
import React, { useState, useEffect } from 'react';
import { User, BusinessProfile, FinancialSignals, LoanApplication, CreditAssessment, PersistedBorrowerData, PoolEntry } from '../../types';
import { registryService } from '../../services/registryService';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore';

interface BorrowerDashboardProps {
  user: User;
}

const BorrowerDashboard: React.FC<BorrowerDashboardProps> = ({ user }) => {
  const [view, setView] = useState<'ONBOARDING' | 'SUMMARY' | 'ASSESSMENT'>('ONBOARDING');
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  const [globalPool, setGlobalPool] = useState<PoolEntry | null>(null);

  const [profile, setProfile] = useState<BusinessProfile>({
    name: user.name,
    industry: 'Manufacturing',
    yearsInOperation: 3,
    annualRevenue: 5000000,
    monthlyAvgRevenue: 420000,
    gstRegistered: true,
    employeeCount: 12
  });

  const [finance, setFinance] = useState<FinancialSignals>({
    sixMonthRevenue: [410000, 390000, 450000, 420000, 415000, 435000],
    avgMonthlyExpenses: 280000,
    outstandingLiabilities: 500000,
    existingLoans: false,
    invoiceVolume: 45,
    avgPaymentDelay: 15
  });

  const [loan, setLoan] = useState<LoanApplication>({
    amount: 1500000,
    purpose: 'Inventory',
    tenure: 12,
    interestRange: [12, 16]
  });

  const [repayments, setRepayments] = useState<any[]>([]);
  const [borrowerCreditScore, setBorrowerCreditScore] = useState<number | null>(null);

  // Sync with Firestore (Real-time)
  useEffect(() => {
    const poolsRef = collection(db, "pools");
    const q = query(poolsRef, where("borrowerId", "==", user.udyamId));

    const unsubscribePool = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const myEntry = snapshot.docs[0].data() as PoolEntry;

        // Notify if commitments increased
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const newData = change.doc.data() as PoolEntry;
            const oldData = globalPool;
            if (oldData && newData.commitments.length > oldData.commitments.length) {
              const newCommitment = newData.commitments[newData.commitments.length - 1];
              (window as any).trustpool_notify?.("New Pledge!", `${newCommitment.lenderName} committed ₹${(newCommitment.amount / 1000).toFixed(0)}K`, "SUCCESS");
            }
          }
        });

        setGlobalPool(myEntry);
        setProfile(myEntry.profile);
        setFinance(myEntry.finance);
        setLoan(myEntry.loan);
        setAssessment(myEntry.assessment);
        setView('SUMMARY');
      }
    });

    const unsubscribeRepayments = registryService.listenToRepayments(user.udyamId, (data) => {
      setRepayments(data);
    });

    // Listen for borrower profile updates (for real-time credit score)
    const unsubscribeProfile = onSnapshot(doc(db, "borrowers", user.udyamId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBorrowerCreditScore(data.creditScore || null);
      }
    });

    // Load existing profile for auto-fill if pool doesn't exist
    const loadProfile = async () => {
      const profileData = await registryService.getUserProfile(user.udyamId);
      if (profileData.borrower) {
        const data = profileData.borrower;
        if (data.profile) setProfile(data.profile);
        if (data.finance) setFinance(data.finance);
        if (data.creditScore) setBorrowerCreditScore(data.creditScore);
      }
    };
    loadProfile();

    return () => {
      unsubscribePool();
      unsubscribeRepayments();
      unsubscribeProfile();
    };
  }, [user.udyamId]);

  const handleFinalizeAndBroadcast = async () => {
    setAnalyzing(true);
    try {
      const resultPool = await registryService.submitLoanApplication(
        user.udyamId,
        user.name,
        profile,
        finance,
        loan
      );
      setAssessment(resultPool.assessment);
      setGlobalPool(resultPool);
      setView('SUMMARY');
      (window as any).trustpool_notify?.("Application Success!", "Broadcasted to Real-time Marketplace.", "SUCCESS");
    } catch (err: any) {
      (window as any).trustpool_notify?.("Backend Error", err.message, "WARNING");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!globalPool) return;
    if (confirm("Are you sure you want to delete this active request? This will wipe all current pledges.")) {
      try {
        await registryService.deleteBorrowerPool(globalPool.id, user.udyamId);
        setGlobalPool(null);
        setView('ONBOARDING');
        (window as any).trustpool_notify?.("Request Deleted", "The loan request has been removed from the protocol.", "WARNING");
      } catch (err: any) {
        (window as any).trustpool_notify?.("Deletion Failed", err.message, "WARNING");
      }
    }
  };

  const getRiskColor = (cat: string) => {
    if (cat === 'Low') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (cat === 'Medium') return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  if (view === 'SUMMARY') {
    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Borrower Hub</h2>
            <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">UDYAM ID: {user.udyamId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleDeleteRequest}
              className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:border-red-500 transition-all flex items-center space-x-3 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>Delete Request</span>
            </button>
            <button onClick={() => setView('ONBOARDING')} className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:border-indigo-600 transition-all flex items-center space-x-3 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <span>Modify Application</span>
            </button>
          </div>
        </div>

        {globalPool ? (
          <div className="bg-slate-950 p-12 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="space-y-4 text-center md:text-left">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Registered & Live</span>
                </div>
                <h3 className="text-4xl font-black text-white">{globalPool.id}</h3>
                <p className="text-slate-400 text-sm font-medium">Your request is active and visible to all platform investors.</p>
              </div>
              <div className="w-full md:w-80 space-y-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                <div className="flex justify-between text-[11px] font-black uppercase text-indigo-400 tracking-widest">
                  <span>Funding Goal Status</span>
                  <span>{((globalPool.totalFunded / globalPool.loan.amount) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.6)]" style={{ width: `${(globalPool.totalFunded / globalPool.loan.amount) * 100}%` }} />
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-slate-500">₹{(globalPool.totalFunded / 1000).toFixed(0)}K Raised</p>
                  <p className="text-[10px] font-bold text-slate-500">Target: ₹{(globalPool.loan.amount / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50 p-12 rounded-[3.5rem] border-2 border-dashed border-indigo-200 text-center space-y-4">
            <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">No active request in registry.</p>
            <button onClick={() => setView('ONBOARDING')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Submit First Application</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Commitment List */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Pledges</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {globalPool?.commitments && globalPool.commitments.length > 0 ? (
                globalPool.commitments.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl animate-in fade-in slide-in-from-right-4">
                    <div>
                      <p className="text-xs font-black">{c.lenderName}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{c.repaymentDuration} Mo Tenure</p>
                    </div>
                    <span className="text-sm font-black text-indigo-600">₹{(c.amount / 1000).toFixed(0)}K</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 font-bold italic">Waiting for market acceptance...</p>
              )}
            </div>
          </div>

          {/* Repayment Simulation */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Hub</h4>
              {borrowerCreditScore && (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black text-emerald-600 uppercase">Live Score:</span>
                  <span className="text-sm font-black text-emerald-600">{borrowerCreditScore}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                <p className="text-[9px] font-black uppercase opacity-60 mb-2">Total Outstanding</p>
                <p className="text-2xl font-black">₹{((globalPool?.loan.amount || 0) - repayments.reduce((acc, r) => acc + r.amount, 0)) / 1000}K</p>
              </div>

              <button
                onClick={async () => {
                  const totalRepaid = repayments.reduce((acc, r) => acc + r.amount, 0);
                  const remaining = (globalPool?.loan.amount || 0) - totalRepaid;
                  const payAmount = Math.min(150000, remaining);

                  if (payAmount <= 0) {
                    (window as any).trustpool_notify?.("Loan Repaid", "Your loan is already fully settled.", "SUCCESS");
                    return;
                  }

                  try {
                    await registryService.submitRepayment(globalPool!.id, user.udyamId, payAmount);
                    (window as any).trustpool_notify?.("Payment Successful!", `₹${(payAmount / 1000).toFixed(0)}K credited to protocol. Credit score updated.`, "SUCCESS");
                    if (payAmount === remaining) {
                      setGlobalPool(null); // Clear for fresh start if fully repaid
                    }
                  } catch (e) {
                    (window as any).trustpool_notify?.("Payment Failed", "Protocol registry rejected transaction.", "WARNING");
                  }
                }}
                disabled={!globalPool || globalPool.totalFunded < globalPool.loan.amount}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-30"
              >
                Simulate Payment {((globalPool?.loan.amount || 0) - repayments.reduce((acc, r) => acc + r.amount, 0)) > 0 ? `(₹${Math.min(150, ((globalPool?.loan.amount || 0) - repayments.reduce((acc, r) => acc + r.amount, 0)) / 1000).toFixed(0)}K)` : '(Settled)'}
              </button>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Payment History</p>
                {repayments.map(r => (
                  <div key={r.id} className="flex justify-between text-[10px] font-bold p-2 bg-slate-50 rounded-lg">
                    <span>{new Date(r.paidAt).toLocaleDateString()}</span>
                    <span className="text-emerald-600">PAID ₹{(r.amount / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Metadata</p>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-xs text-slate-500">Annual Revenue</span><span className="text-sm font-black">₹{(profile.annualRevenue / 100000).toFixed(1)}L</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Industry Sector</span><span className="text-sm font-black">{profile.industry}</span></div>
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Ask</p>
            <div className="space-y-4">
              <div className="flex justify-between"><span className="text-xs text-slate-500">Requested</span><span className="text-sm font-black">₹{(loan.amount / 1000).toFixed(0)}K</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Tenure</span><span className="text-sm font-black">{loan.tenure} Months</span></div>
            </div>
          </div>
          {assessment && (
            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white space-y-4 cursor-pointer hover:scale-[1.02] transition-all shadow-xl shadow-indigo-100" onClick={() => setView('ASSESSMENT')}>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">AI Credit Merit</p>
              <div className="flex items-center space-x-6">
                <span className="text-5xl font-black">{assessment.score}</span>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border border-white/20 bg-white/10`}>{assessment.riskCategory}</div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">View Detailed Report →</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 bg-white p-3 rounded-[3rem] border border-slate-100 shadow-sm flex-1">
          {[{ s: 1, l: 'Onboarding Data' }, { s: 2, l: 'Validation' }].map(item => (
            <button key={item.s} onClick={() => !analyzing && setStep(item.s as any)} className={`flex-1 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all ${step === item.s ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>{item.l}</button>
          ))}
        </div>
        <button onClick={() => setView('SUMMARY')} className="ml-6 px-8 py-5 bg-slate-900 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
          Back to Hub
        </button>
      </div>

      {step === 1 ? (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Financial Profile</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current FY Revenue</label>
              <input type="number" value={profile.annualRevenue} onChange={e => setProfile({ ...profile, annualRevenue: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Industry</label>
              <select value={profile.industry} onChange={e => setProfile({ ...profile, industry: e.target.value as any })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold">
                <option>Manufacturing</option><option>Retail</option><option>Services</option>
              </select>
            </div>
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Request Amount (₹)</label>
              <input type="number" value={loan.amount} onChange={e => setLoan({ ...loan, amount: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferred Tenure</label>
              <div className="flex gap-2">
                {[6, 12, 18].map(t => (
                  <button key={t} onClick={() => setLoan({ ...loan, tenure: t as any })} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all ${loan.tenure === t ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>{t} Mo</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="w-full py-6 bg-slate-950 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Next: Review Application</button>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-12 text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Registry Broadcast</h2>
          <p className="text-slate-500 font-medium">By finalizing, your application will be underwritten by AI and broadcasted to the TrustPool global registry for investor review.</p>

          <div className="py-12 flex flex-col items-center space-y-8">
            {analyzing ? (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Running Decentralized Underwriting...</p>
              </div>
            ) : (
              <div className="w-full max-w-md space-y-4">
                <button onClick={handleFinalizeAndBroadcast} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all">Broadcast to Marketplace</button>
                <button onClick={() => setStep(1)} className="w-full py-6 bg-slate-50 text-slate-400 rounded-3xl font-black text-sm uppercase tracking-widest hover:text-slate-900 transition-all">Back to Edit</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowerDashboard;
