import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBFivtF3SVHacxQklx10cqH9irxE_mhLXk",
    authDomain: "poolcred-c49ad.firebaseapp.com",
    projectId: "poolcred-c49ad",
    storageBucket: "poolcred-c49ad.firebasestorage.app",
    messagingSenderId: "471100713963",
    appId: "1:471100713963:web:232856dcc2c239e65707ae",
    measurementId: "G-GYFG0TGQLH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
