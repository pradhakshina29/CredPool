import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  where
} from "firebase/firestore";
import { PoolEntry, PersistedLenderData, PersistedBorrowerData, LenderPreferences, BusinessProfile, FinancialSignals, LoanApplication, PoolCommitment, Repayment, User } from "../types";
import { analyzeMSMEProtocol, calculateDynamicCreditScore } from "./geminiService";

/**
 * REGISTRY SERVICE (Firestore Data Layer)
 * This handles the persistence and real-time syncing of all loan requests.
 */
export const registryService = {

  /**
   * LISTEN (Real-time): Get updates on all pools
   */
  listenToPools: (callback: (pools: PoolEntry[]) => void) => {
    const poolsRef = collection(db, "pools");
    const q = query(poolsRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
      const pools = snapshot.docs.map(doc => doc.data() as PoolEntry);
      callback(pools);
    });
  },

  /**
   * DATABASE READ: Get current snapshot (One-time)
   */
  getPools: async (): Promise<PoolEntry[]> => {
    const poolsRef = collection(db, "pools");
    const q = query(poolsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return []; // No pools yet
    }

    return snapshot.docs.map(doc => doc.data() as PoolEntry);
  },

  /**
   * DATABASE WRITE: Create or Update a loan request (Borrower side)
   */
  submitLoanApplication: async (
    udyamId: string,
    borrowerName: string,
    profile: BusinessProfile,
    finance: FinancialSignals,
    loan: LoanApplication
  ): Promise<PoolEntry> => {

    // 1. Generate AI Assessment
    const assessment = await analyzeMSMEProtocol(profile, finance, loan);

    const poolId = `POOL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newEntry: PoolEntry = {
      id: poolId,
      borrowerId: udyamId,
      borrowerName: borrowerName,
      profile,
      finance,
      loan,
      assessment,
      totalFunded: 0,
      status: 'OPEN',
      createdAt: Date.now(),
      commitments: []
    };

    // 2. Save to Firestore
    await setDoc(doc(db, "pools", poolId), newEntry);

    // 3. Persist borrower state
    await setDoc(doc(db, `borrowers`, udyamId), {
      profile, finance, loan, assessment, lastUpdated: Date.now()
    });

    return newEntry;
  },

  /**
   * DATABASE WRITE: Invest/Pledge to a pool (Lender side)
   */
  investInPool: async (lender: User, poolId: string, amount: number, duration: number) => {
    const poolRef = doc(db, "pools", poolId);
    const poolSnapshot = await getDocs(query(collection(db, "pools"), where("id", "==", poolId)));

    if (poolSnapshot.empty) return;

    const poolData = poolSnapshot.docs[0].data() as PoolEntry;
    const newFunded = (poolData.totalFunded || 0) + amount;
    const commitments = poolData.commitments || [];

    const newCommitment: PoolCommitment = {
      lenderId: lender.udyamId,
      lenderName: lender.name,
      amount,
      repaymentDuration: duration,
      timestamp: Date.now(),
      status: 'ACCEPTED'
    };

    await updateDoc(poolRef, {
      totalFunded: newFunded,
      commitments: [...commitments, newCommitment],
      status: newFunded >= poolData.loan.amount ? 'FUNDED' : 'OPEN'
    });

    // Record the pledge in lender profile
    const lenderRef = doc(db, "lenders", lender.udyamId);
    const lenderDataRaw = await getDocs(query(collection(db, "lenders"), where("udyamId", "==", lender.udyamId)));

    let lenderData = lenderDataRaw.empty ? { myPledges: [] } : lenderDataRaw.docs[0].data();
    await setDoc(doc(db, "lenders", lender.udyamId), {
      ...lenderData,
      myPledges: [...(lenderData.myPledges || []), { poolId, amount, timestamp: Date.now() }],
      lastUpdated: Date.now()
    });
  },

  /**
   * DATABASE READ: Get lender data including preferences
   */
  getLenderData: async (udyamId: string): Promise<PersistedLenderData | null> => {
    const snapshot = await getDocs(query(collection(db, "lenders"), where("udyamId", "==", udyamId)));
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as PersistedLenderData;
  },

  /**
   * DATABASE WRITE: Save lender preferences
   */
  saveLenderPreferences: async (udyamId: string, preferences: LenderPreferences) => {
    const lenderRef = doc(db, "lenders", udyamId);
    await setDoc(lenderRef, {
      udyamId,
      preferences,
      lastUpdated: Date.now()
    }, { merge: true });
  },

  /**
   * DATABASE WRITE: Submit a repayment (Borrower side)
   */
  submitRepayment: async (poolId: string, borrowerId: string, amount: number) => {
    const repaymentId = `REPAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const repayment: Repayment = {
      id: repaymentId,
      poolId,
      borrowerId,
      amount,
      dueDate: Date.now() + 30 * 86400000, // Hardcoded next month for demo
      status: 'PAID',
      paidAt: Date.now()
    };

    await setDoc(doc(db, "repayments", repaymentId), repayment);

    // Update pool status if needed (e.g. if fully repaid)
    // For MVP, we'll also trigger a credit score update
    await registryService.updateBorrowerCreditScore(borrowerId);

    // Check if fully repaid
    const poolSnap = await getDocs(query(collection(db, "pools"), where("id", "==", poolId)));
    if (!poolSnap.empty) {
      const pool = poolSnap.docs[0].data() as PoolEntry;
      const repaymentsSnapshot = await getDocs(query(collection(db, "repayments"), where("poolId", "==", poolId)));
      const totalRepaidAmount = repaymentsSnapshot.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);

      if (totalRepaidAmount >= pool.loan.amount) {
        await updateDoc(doc(db, "pools", poolSnap.docs[0].id), {
          status: 'REPAID'
        });
      }
    }
  },

  /**
   * DATABASE LISTEN: Get real-time repayments for a pool/borrower
   */
  listenToRepayments: (borrowerId: string, callback: (repayments: Repayment[]) => void) => {
    const q = query(collection(db, "repayments"), where("borrowerId", "==", borrowerId), orderBy("paidAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as Repayment));
    });
  },

  /**
   * AI-DRIVEN: Update credit score based on history
   */
  updateBorrowerCreditScore: async (borrowerId: string) => {
    const borrowerSnap = await getDocs(query(collection(db, "borrowers"), where("udyamId", "==", borrowerId)));
    if (borrowerSnap.empty) return;

    const borrowerDoc = borrowerSnap.docs[0];
    const borrowerData = borrowerDoc.data();

    const repaymentsSnapshot = await getDocs(query(collection(db, "repayments"), where("borrowerId", "==", borrowerId)));
    const repayments = repaymentsSnapshot.docs.map(d => d.data() as Repayment);

    const baseScore = borrowerData.assessment?.score || 70;
    const newScore = await calculateDynamicCreditScore(baseScore, repayments);

    await updateDoc(doc(db, "borrowers", borrowerDoc.id), {
      creditScore: newScore,
      "assessment.score": newScore, // Sync the score inside assessment too
      lastUpdated: Date.now()
    });

    // Also update all active pools for this borrower to show "Live Merit"
    const poolsSnapshot = await getDocs(query(collection(db, "pools"), where("borrowerId", "==", borrowerId)));
    for (const poolDoc of poolsSnapshot.docs) {
      const poolData = poolDoc.data();
      await updateDoc(poolDoc.ref, {
        "assessment.score": newScore
      });
    }
  },

  /**
   * DATABASE READ: Unified fetch for any user (Centralized)
   */
  getUserProfile: async (udyamId: string) => {
    const borrowerSnap = await getDocs(query(collection(db, "borrowers"), where("udyamId", "==", udyamId)));
    const lenderSnap = await getDocs(query(collection(db, "lenders"), where("udyamId", "==", udyamId)));

    return {
      borrower: borrowerSnap.empty ? null : borrowerSnap.docs[0].data() as PersistedBorrowerData,
      lender: lenderSnap.empty ? null : lenderSnap.docs[0].data() as PersistedLenderData
    };
  },

  /**
   * DATABASE WRITE: Centralized user profile update
   */
  saveUserProfile: async (udyamId: string, data: Partial<PersistedBorrowerData | PersistedLenderData>, collectionName: 'borrowers' | 'lenders') => {
    const docRef = doc(db, collectionName, udyamId);
    await setDoc(docRef, {
      ...data,
      udyamId,
      lastUpdated: Date.now()
    }, { merge: true });
  },

  /**
   * DATABASE WRITE: Delete a borrower's pool/request
   */
  deleteBorrowerPool: async (poolId: string, udyamId: string) => {
    // 1. Delete the pool
    await deleteDoc(doc(db, "pools", poolId));

    // 2. Clear current loan from borrower document (but keep profile/finance for auto-fill)
    const borrowerRef = doc(db, "borrowers", udyamId);
    await updateDoc(borrowerRef, {
      loan: null,
      assessment: null
    });

    // 3. Clear repayments for this pool
    const repaymentsSnapshot = await getDocs(query(collection(db, "repayments"), where("poolId", "==", poolId)));
    for (const d of repaymentsSnapshot.docs) {
      await deleteDoc(d.ref);
    }
  },

  /**
   * Developer utility to reset for a clean demo
   */
  wipeAllData: async () => {
    const collections = ["pools", "borrowers", "lenders", "repayments", "connection_tests"];
    for (const coll of collections) {
      const snapshot = await getDocs(collection(db, coll));
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
    }
  }
};
