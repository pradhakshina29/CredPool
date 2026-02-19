import React from 'react';

interface PaymentStatusCardProps {
    transactionId: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    className?: string;
}

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({ transactionId, amount, status, className = "" }) => {
    const statusConfig = {
        PENDING: {
            label: 'PENDING',
            bg: 'bg-amber-500/10',
            text: 'text-amber-500',
            border: 'border-amber-500/20',
            icon: (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )
        },
        SUCCESS: {
            label: 'SUCCESS',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-500',
            border: 'border-emerald-500/20',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
            )
        },
        FAILED: {
            label: 'FAILED',
            bg: 'bg-rose-500/10',
            text: 'text-rose-500',
            border: 'border-rose-500/20',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
            )
        }
    };

    const config = statusConfig[status];

    return (
        <div className={`p-4 rounded-2xl border ${config.border} ${config.bg} ${className} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>Transaction Status</span>
                <div className={`p-1 rounded-full ${config.bg}`}>
                    {config.icon}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">ID</span>
                    <span className="text-xs font-mono font-medium text-slate-200 truncate ml-4 max-w-[120px]">{transactionId}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Amount</span>
                    <span className="text-sm font-bold text-white">₹{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-xs text-slate-400">Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                        {config.label}
                    </span>
                </div>
            </div>

            {status === 'PENDING' && (
                <p className="mt-3 text-[10px] text-amber-500/70 italic text-center animate-pulse">
                    Processing Payment... Please do not close this window.
                </p>
            )}
        </div>
    );
};

export default PaymentStatusCard;
