import { db } from "./firebase";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { MOCK_MSME_DATA, OTP_EXPIRY_SECONDS, MAX_OTP_ATTEMPTS } from "../constants";

// Helper for hashing (Simulating bcrypt/crypto)
const hashString = async (str: string) => {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Rate limiting state (survives refreshes for demo)
const getRequestLogs = (): number[] => {
  const logs = localStorage.getItem('tp_auth_logs');
  return logs ? JSON.parse(logs) : [];
};

const logRequest = () => {
  const logs = getRequestLogs();
  logs.push(Date.now());
  localStorage.setItem('tp_auth_logs', JSON.stringify(logs.slice(-10))); // Keep last 10
};

export const authService = {
  /**
   * SEED USERS into Firestore (Utility for demo)
   */
  seedUsers: async () => {
    console.log("Seeding users into Firestore...");
    for (const user of MOCK_MSME_DATA) {
      await setDoc(doc(db, "users", user.udyam), {
        udyamId: user.udyam,
        phone: user.phone,
        name: user.name,
        role: "UNASSIGNED",
        isVerified: true
      });
    }
    console.log("Seeding complete.");
  },

  /**
   * REQUEST OTP (Validates identity via Firestore)
   */
  requestOtp: async (udyamId: string, phone: string) => {
    // 1. Rate Limit Check
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recentRequests = getRequestLogs().filter(t => t > fiveMinAgo);

    if (recentRequests.length >= 3) {
      throw new Error("Rate limit exceeded. Please wait 5 minutes.");
    }

    // 2. Validate Identity via Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("udyamId", "==", udyamId), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Auto-seed if empty for easy demo setup
      await authService.seedUsers();
      const reCheck = await getDocs(q);
      if (reCheck.empty) {
        throw new Error("Invalid Government ID or Phone Number.");
      }
    }

    // 3. Generate & Hash OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await hashString(code);

    logRequest();

    return {
      success: true,
      code,
      hash: hashedCode,
      expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000
    };
  },

  /**
   * VERIFY OTP
   */
  verifyOtp: async (inputCode: string, storedHash: string, udyamId: string) => {
    const inputHash = await hashString(inputCode);

    if (inputHash !== storedHash) {
      throw new Error("Invalid verification code.");
    }

    // Fetch user details from Firestore
    const userDoc = await getDocs(query(collection(db, "users"), where("udyamId", "==", udyamId)));
    const userData = userDoc.docs[0].data();

    // Generate Mock JWT
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: udyamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iss: "trustpool.gov"
    }));
    const signature = "simulated_signature";

    return {
      token: `${header}.${payload}.${signature}`,
      user: userData
    };
  }
};
