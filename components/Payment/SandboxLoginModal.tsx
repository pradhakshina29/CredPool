import React, { useState } from 'react';
import { sandboxAuthService } from '../../services/sandboxAuthService';
import { SandboxAccount } from '../../types';

interface SandboxLoginModalProps {
    onValidated: (account: SandboxAccount) => void;
    onCancel: () => void;
}

const SandboxLoginModal: React.FC<SandboxLoginModalProps> = ({ onValidated, onCancel }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const account = await sandboxAuthService.validateSandboxUser(email, password);
            setTimeout(() => {
                onValidated(account);
            }, 1000); // Small aesthetic delay
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const autoFill = () => {
        setEmail('testbuyer1@sandbox.com');
        setPassword('123456');
        setError(null);
    };

    return (
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl w-full max-w-sm mx-auto animate-in zoom-in-95">
            <div className="text-center mb-8 relative">
                <button
                    onClick={autoFill}
                    className="absolute -top-4 -right-4 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30 transition-all active:scale-95"
                    title="Auto-fill for Demo"
                >
                    Auto-fill
                </button>
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-xl font-black text-white">Sandbox PayPal Login</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Authentication Layer Required</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sandbox Email</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="testbuyer1@sandbox.com"
                        className="w-full px-5 py-4 bg-slate-800/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-5 py-4 bg-slate-800/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                    />
                </div>

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3 animate-in slide-in-from-top-2">
                        <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[11px] font-bold text-rose-500 leading-tight">{error}</p>
                    </div>
                )}

                <div className="pt-2 flex flex-col space-y-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center space-x-3`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>Validating...</span>
                            </>
                        ) : (
                            <span>Proceed to Payment</span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full py-4 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                        Cancel Transaction
                    </button>
                </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] font-medium text-slate-600 italic">
                    Tip: Try testbuyer1@sandbox.com / 123456
                </p>
            </div>
        </div>
    );
};

export default SandboxLoginModal;
