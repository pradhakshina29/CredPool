import React, { useEffect, useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';

interface PayPalButtonProps {
    amount: number;
    loanId: string;
    onSuccess: (transactionId: string) => void;
    onError: (error: string) => void;
    onStarted: (transactionId: string) => void;
}

declare global {
    interface Window {
        paypal?: any;
    }
}

const PayPalButton: React.FC<PayPalButtonProps> = ({ amount, loanId, onSuccess, onError, onStarted }) => {
    const { user } = useAuth();
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [transactionId, setTransactionId] = useState<string | null>(null);

    useEffect(() => {
        if (window.paypal) {
            setIsSdkLoaded(true);
            return;
        }

        const script = document.createElement('script');
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb"; // Fallback to sandbox
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => setIsSdkLoaded(true);
        document.body.appendChild(script);

        return () => {
            // Clean up if needed, though usually SDK stays
        };
    }, []);

    useEffect(() => {
        if (isSdkLoaded && window.paypal && user) {
            window.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'pay',
                },
                createOrder: async (data: any, actions: any) => {
                    try {
                        // 1. Create PENDING transaction in Firestore
                        const tId = await paymentService.createPendingTransaction({
                            userId: user.id || user.udyamId,
                            userEmail: user.email || "demo@example.com",
                            amount: amount,
                            loanId: loanId,
                            orderId: "", // Will update after approval
                            paymentMethod: "PayPal"
                        });

                        setTransactionId(tId);
                        onStarted(tId);

                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: amount.toString(),
                                },
                                description: `Investment for Loan ${loanId}`
                            }]
                        });
                    } catch (err: any) {
                        onError(err.message);
                        throw err;
                    }
                },
                onApprove: async (data: any, actions: any) => {
                    if (!transactionId) return;

                    try {
                        const details = await actions.order.capture();
                        await paymentService.updateTransactionStatus(transactionId, 'SUCCESS', details.id);
                        onSuccess(transactionId);
                    } catch (err: any) {
                        await paymentService.updateTransactionStatus(transactionId, 'FAILED');
                        onError(err.message);
                    }
                },
                onCancel: async () => {
                    if (transactionId) {
                        await paymentService.updateTransactionStatus(transactionId, 'FAILED');
                    }
                    onError("Transaction cancelled by user");
                },
                onError: async (err: any) => {
                    if (transactionId) {
                        await paymentService.updateTransactionStatus(transactionId, 'FAILED');
                    }
                    onError("PayPal Error: " + err.message);
                }
            }).render("#paypal-button-container");
        }
    }, [isSdkLoaded, user, amount, loanId, transactionId]);

    return (
        <div className="w-full min-h-[50px] flex items-center justify-center">
            {!isSdkLoaded && (
                <div className="flex items-center space-x-2 text-slate-400">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium">Loading PayPal...</span>
                </div>
            )}
            <div id="paypal-button-container" className="w-full"></div>
        </div>
    );
};

export default PayPalButton;
