import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { paymentService } from '../services/paymentService';
import { Transaction } from '../types';

const TransactionHistory: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const loadTransactions = async () => {
                const data = await paymentService.getUserTransactions(user.id || user.udyamId);
                setTransactions(data);
                setLoading(false);
            };
            loadTransactions();
        }
    }, [user]);

    const getStatusBadge = (status: string) => {
        const configs = {
            SUCCESS: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            FAILED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        };
        const config = (configs as any)[status] || configs.PENDING;
        return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${config}`}>{status}</span>;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-medium">Loading history...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Transaction History</h2>
                <p className="text-sm text-slate-400 font-medium">Review your recent investments and pool contributions.</p>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24 font-bold">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-white font-bold mb-1">No transactions found</h3>
                    <p className="text-xs text-slate-500">Your investment records will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((t) => (
                        <div key={t.id} className="group bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2 mb-0.5">
                                            <span className="text-sm font-bold text-white">₹{t.amount.toLocaleString()}</span>
                                            {getStatusBadge(t.paymentStatus)}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">Loan ID: <span className="font-mono text-indigo-400">{t.loanId}</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:text-right border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                    <div className="md:hidden">
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Details</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-300 font-medium">{formatDate(t.timestamp)}</p>
                                        <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">Ref: {t.orderId || t.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
