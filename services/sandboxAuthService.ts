import { db } from "./firebase";
import {
    collection,
    query,
    where,
    getDocs,
    setDoc,
    doc,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import { SandboxAccount } from "../types";

export const sandboxAuthService = {
    /**
     * Validate sandbox credentials
     */
    validateSandboxUser: async (email: string, password: string): Promise<SandboxAccount> => {
        const normalizedEmail = email.trim().toLowerCase();

        // First, check if there's even one account. If not, seed immediately.
        const allAccountsCheck = await getDocs(collection(db, "sandboxAccounts"));
        if (allAccountsCheck.empty) {
            console.log("Database empty, triggering emergency seed...");
            await sandboxAuthService.seedSandboxAccounts();
        }

        const q = query(
            collection(db, "sandboxAccounts"),
            where("email", "==", normalizedEmail),
            where("password", "==", password)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid sandbox credentials. Try testbuyer1@sandbox.com / 123456");
        }

        const account = querySnapshot.docs[0].data() as SandboxAccount;

        if (account.status === "BLOCKED") {
            throw new Error("Account blocked");
        }

        return { ...account, id: querySnapshot.docs[0].id };
    },

    /**
     * Seed Firestore with initial sandbox accounts
     */
    seedSandboxAccounts: async () => {
        const accounts = [
            {
                email: "testbuyer1@sandbox.com",
                password: "123456",
                userId: "buyer_1",
                name: "Test Buyer 1",
                status: "ACTIVE",
                balance: 50000,
            },
            {
                email: "lender@sandbox.com",
                password: "demo123",
                userId: "lender_1",
                name: "Sandbox Lender",
                status: "ACTIVE",
                balance: 100000,
            },
            {
                email: "blocked@sandbox.com",
                password: "password123",
                userId: "blocked_1",
                name: "Blocked User",
                status: "BLOCKED",
                balance: 0,
            }
        ];

        for (const account of accounts) {
            await setDoc(doc(db, "sandboxAccounts", account.email), {
                ...account,
                createdAt: serverTimestamp()
            });
        }

        console.log("Sandbox accounts seeded successfully");
    },

    /**
     * Block a sandbox user
     */
    blockSandboxUser: async (email: string) => {
        const accountRef = doc(db, "sandboxAccounts", email);
        await updateDoc(accountRef, {
            status: "BLOCKED"
        });
    }
};
