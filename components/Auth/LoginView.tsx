
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../../types';
import { authService } from '../../services/authService';
import { MOCK_MSME_DATA, MAX_OTP_ATTEMPTS } from '../../constants';

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [udyamId, setUdyamId] = useState('');
  const [phone, setPhone] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'ID' | 'OTP'>('ID');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');

  // Security references
  const [activeOtpHash, setActiveOtpHash] = useState<string | null>(null);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && activeOtpHash) {
      setError('Verification code expired.');
      setActiveOtpHash(null);
      setSimulatedSms(null);
    }
    return () => clearInterval(interval);
  }, [timer, activeOtpHash]);

  const handleIdSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.requestOtp(udyamId, phone);
      setActiveOtpHash(result.hash);
      setSimulatedSms(result.code);
      setStep('OTP');
      setTimer(120);
      setAttempts(0);
      setOtpInputs(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullOtp = otpInputs.join('');

    if (!activeOtpHash) {
      setError('Session expired. Please restart.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.verifyOtp(fullOtp, activeOtpHash, udyamId);
      onLoginSuccess({
        id: Math.random().toString(36).substr(2, 9),
        udyamId: udyamId,
        phoneNumber: phone,
        name: result.user!.name,
        role: UserRole.UNASSIGNED,
        isVerified: true
      }, result.token);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        setError("Security lockout: Too many failed attempts.");
        setStep('ID');
        setActiveOtpHash(null);
      } else {
        setError(`${err.message} (${MAX_OTP_ATTEMPTS - newAttempts} left)`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpInputs];
    newOtp[index] = value.substring(value.length - 1);
    setOtpInputs(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9] px-4 py-12 font-sans relative">

      {/* SIMULATED SMS BANNER */}
      {simulatedSms && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] px-4 animate-in slide-in-from-top-4">
          <div className="bg-slate-950 text-white p-5 rounded-3xl shadow-2xl border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Simulated SMS</p>
                <p className="font-mono text-base">OTP: <span className="text-white font-black underline underline-offset-4">{simulatedSms}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full">
        <div className="mb-10 text-center animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2.5rem] shadow-2xl mb-6 transform -rotate-6 border-4 border-white hover:rotate-0 hover:scale-110 transition-all duration-500 cursor-pointer group">
            <span className="text-white text-4xl font-black italic group-hover:not-italic group-hover:text-amber-300 transition-all">C</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors duration-300 cursor-default">CredPool</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] opacity-80 mt-2">Protocol Gatekeeper</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
          <div className="p-10">
            {error && (
              <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black border border-rose-100 flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="uppercase">{error}</span>
              </div>
            )}

            {step === 'ID' ? (
              <form onSubmit={handleIdSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">UDYAM ID</label>
                  <input
                    type="text"
                    value={udyamId}
                    onChange={(e) => setUdyamId(e.target.value)}
                    placeholder="UDYAM-XX-00-0000000"
                    className="w-full px-6 py-5 rounded-[1.25rem] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition-all font-mono text-slate-950 font-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-XXXXXXXXXX"
                    className="w-full px-6 py-5 rounded-[1.25rem] border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition-all text-slate-950 font-black"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
                >
                  {loading ? 'Verifying Node...' : 'Request Access'}
                </button>

                <div className="pt-6 border-t border-slate-50 grid grid-cols-3 gap-2">
                  {MOCK_MSME_DATA.map((d, i) => (
                    <button key={i} type="button" onClick={() => { setUdyamId(d.udyam); setPhone(d.phone) }} className="text-[9px] font-black text-slate-400 border border-slate-100 py-2 rounded-lg hover:bg-slate-50">Profile {i + 1}</button>
                  ))}
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-10">
                <div className="flex justify-between gap-3">
                  {otpInputs.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className="w-full aspect-square text-center text-2xl font-black border-2 border-slate-100 bg-slate-50/50 text-slate-950 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none"
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading || timer === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-2xl disabled:opacity-50 uppercase text-xs tracking-widest"
                >
                  {loading ? 'Authorizing Token...' : 'Finalize Login'}
                </button>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Expires in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
