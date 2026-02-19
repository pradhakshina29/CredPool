import React, { useState } from 'react';
import SandboxLoginModal from './SandboxLoginModal';
import PaymentStatusCard from './PaymentStatusCard';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { delay } from '../../utils/delay';
import { registryService } from '../../services/registryService';

interface PaymentCardProps {
    amount: number;
    loanId: string;
    type?: 'INVESTMENT' | 'REPAYMENT';
    onComplete?: () => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({ amount, loanId, type = 'INVESTMENT', onComplete }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'IDLE' | 'MOCK_AUTH' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
    const [transactionId, setTransactionId] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleStartPayment = async () => {
        setStatus('MOCK_AUTH');
    };

    const handleAuthValidated = async () => {
        if (!user) return;

        setStatus('PENDING');
        setErrorMessage(null);

        try {
            // 1. Create PENDING transaction in Firestore
            const tId = await paymentService.createPendingTransaction({
                userId: user.udyamId || user.id,
                userEmail: user.email || "demo@example.com",
                amount: amount,
                loanId: loanId,
                orderId: "",
                paymentMethod: "PayPal"
            });

            setTransactionId(tId);

            // 2. Simulate PayPal approval after 2 seconds delay
            await delay(2000);

            // 3. Logic based on type
            const mockOrderId = `PAYPAL-MOCK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            if (type === 'REPAYMENT') {
                // Record repayment in the registry (repayments collection + credit score)
                await registryService.submitRepayment(loanId, user.udyamId, amount);
            }

            // 4. Update transaction to SUCCESS
            await paymentService.updateTransactionStatus(tId, 'SUCCESS', mockOrderId);

            setStatus('SUCCESS');

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 2000);
        } catch (err: any) {
            if (transactionId) {
                await paymentService.updateTransactionStatus(transactionId, 'FAILED');
            }
            setStatus('FAILED');
            setErrorMessage(err.message);
        }
    };

    const handleAuthCancel = () => {
        setStatus('IDLE');
    };

    const labels = {
        title: type === 'INVESTMENT' ? 'Investment Opportunity' : 'Loan Repayment',
        amountLabel: type === 'INVESTMENT' ? 'Investment Amount' : 'Repayment Amount',
        buttonLabel: type === 'INVESTMENT' ? 'Invest Now' : 'Pay Now',
        successMsg: type === 'INVESTMENT' ? 'Investment Completed!' : 'Repayment Successful!'
    };

    return (
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-center">
            {status === 'MOCK_AUTH' ? (
                <SandboxLoginModal
                    onValidated={handleAuthValidated}
                    onCancel={handleAuthCancel}
                />
            ) : (
                <>
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-white mb-1 tracking-tight">{labels.title}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loan ID: <span className="text-indigo-400 font-mono">{loanId}</span></p>
                    </div>

                    <div className="flex items-center justify-between mb-8 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                        <div>
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-1">{labels.amountLabel}</span>
                            <span className="text-2xl font-black text-white">₹{amount.toLocaleString()}</span>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    {status === 'IDLE' ? (
                        <div className="space-y-4">
                            <div className="p-5 bg-slate-800/50 rounded-2xl border border-white/5">
                                <ul className="space-y-3">
                                    <li className="flex items-center text-[10px] font-bold text-slate-400">
                                        <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center mr-3 border border-emerald-500/20">
                                            <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        PayPal Sandbox Simulation
                                    </li>
                                    <li className="flex items-center text-[10px] font-bold text-slate-400">
                                        <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center mr-3 border border-emerald-500/20">
                                            <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        Instant Protocol Update
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={handleStartPayment}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40"
                            >
                                {labels.buttonLabel}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 transition-all animate-in fade-in zoom-in-95">
                            <PaymentStatusCard
                                transactionId={transactionId || "Generating ID..."}
                                amount={amount}
                                status={status === 'SUCCESS' || status === 'FAILED' ? status : 'PENDING'}
                            />

                            {status === 'FAILED' && (
                                <div className="space-y-3">
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">
                                            {errorMessage || "Payment declined or cancelled."}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStatus('IDLE')}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {status === 'SUCCESS' && (
                                <div className="text-center py-2 animate-bounce">
                                    <p className="text-[12px] font-black text-emerald-400 uppercase tracking-widest leading-relaxed">
                                        {labels.successMsg}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PaymentCard;
