import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs
} from "firebase/firestore";
import { Transaction } from "../types";

export const paymentService = {
    /**
     * Initialize a PENDING transaction in Firestore
     */
    createPendingTransaction: async (data: Omit<Transaction, 'id' | 'timestamp' | 'paymentStatus'>): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, "transactions"), {
                ...data,
                paymentStatus: 'PENDING',
                timestamp: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    },

    /**
     * Update transaction status (SUCCESS/FAILED)
     */
    updateTransactionStatus: async (transactionId: string, status: 'SUCCESS' | 'FAILED', orderId?: string) => {
        try {
            const transactionRef = doc(db, "transactions", transactionId);
            await updateDoc(transactionRef, {
                paymentStatus: status,
                orderId: orderId || "",
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating transaction:", error);
            throw error;
        }
    },

    /**
     * Fetch all transactions for a specific user
     */
    getUserTransactions: async (userId: string): Promise<Transaction[]> => {
        try {
            const q = query(
                collection(db, "transactions"),
                where("userId", "==", userId),
                orderBy("timestamp", "desc")
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    }
};
