
import React, { useState, useEffect } from 'react';
import { User, LenderPreferences, PersistedLenderData, PoolEntry, Repayment, AllocationSuggestion } from '../../types';
import { calculateLenderAllocation } from '../../services/geminiService';
import { registryService } from '../../services/registryService';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface LenderDashboardProps {
  user: User;
}

const LenderDashboard: React.FC<LenderDashboardProps> = ({ user }) => {
  const [view, setView] = useState<'ONBOARDING' | 'MARKETPLACE'>('ONBOARDING');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [availablePools, setAvailablePools] = useState<PoolEntry[]>([]);
  const [myPledges, setMyPledges] = useState<{ poolId: string, amount: number, timestamp: number }[]>([]);

  const [analyzingPool, setAnalyzingPool] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AllocationSuggestion | null>(null);

  const [preferences, setPreferences] = useState<LenderPreferences>({
    experience: 'Intermediate',
    riskAppetite: 'Balanced',
    availableCapital: 1000000,
    annualRevenue: 5000000,
    maxTicketSize: 200000,
    preferredTenure: 12,
    expectedReturn: 15,
    preferredIndustries: ['Manufacturing', 'Retail']
  });

  useEffect(() => {
    // Real-time Firestore Listener
    const unsubscribe = registryService.listenToPools((pools) => {
      console.log("Real-time Update: Received pools from Firestore");
      setAvailablePools(pools);
    });

    // Load Wallet Info & Preferences from Firestore
    const loadProfile = async () => {
      const profileData = await registryService.getUserProfile(user.udyamId);
      if (profileData.lender) {
        const data = profileData.lender;
        setPreferences(data.preferences || preferences);
        setMyPledges(data.myPledges || []);
        if (data.walletAddress) {
          setWalletAddress(data.walletAddress);
          setIsWalletConnected(true);
        }
        setView('MARKETPLACE');
      }
    };
    loadProfile();

    // Listen for repayments to notify lender
    const sessionStartTime = Date.now();
    const unsubscribeRepayments = onSnapshot(query(collection(db, "repayments"), orderBy("paidAt", "desc")), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as Repayment;
          // Only notify for NEW payments during this session
          if (data.paidAt > sessionStartTime) {
            // We use a ref-like check or just rely on sessionStartTime to prevent ghosting
            (window as any).trustpool_notify?.("Payment Received!", `Borrower repaid ₹${(data.amount / 1000).toFixed(0)}K in Pool ${data.poolId}`, "SUCCESS");
          }
        }
      });
    });

    return () => {
      unsubscribeRepayments();
    };
  }, [user.udyamId]); // Removed myPledges dependency to stop re-listening constantly

  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      } catch (e) { (window as any).trustpool_notify?.("Metamask Error", "Sign-In Rejected", "WARNING"); }
    } else { (window as any).trustpool_notify?.("Browser Error", "MetaMask extension not found", "WARNING"); }
  };

  const handleSavePreferences = async () => {
    await registryService.saveUserProfile(user.udyamId, { preferences }, 'lenders');
    setView('MARKETPLACE');
  };

  const handleRunAIAllocation = async (pool: PoolEntry) => {
    setAnalyzingPool(pool.id);
    setSuggestion(null);
    const result = await calculateLenderAllocation(pool, preferences);
    setSuggestion(result);
  };

  const handlePledge = (pool: PoolEntry, amount: number, duration: number) => {
    // Wallet check removed for local simulation as per user request
    registryService.investInPool(user, pool.id, amount, duration);

    setAnalyzingPool(null);
    setSuggestion(null);
    (window as any).trustpool_notify?.("Pledge Success!", `Committed ₹${(amount / 1000).toFixed(0)}K to ${pool.borrowerName}`, "SUCCESS");
  };

  const totalInvested = myPledges.reduce((acc, p) => acc + p.amount, 0);
  const activePoolsCount = myPledges.length;
  const riskExposure = preferences.riskAppetite === 'Aggressive' ? 45 : preferences.riskAppetite === 'Balanced' ? 22 : 8;

  if (view === 'ONBOARDING') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6">
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-12">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Capital Allocation</h2>
              <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Define your investment thesis</p>
            </div>
            {localStorage.getItem(`tp_db_lender_${user.udyamId}`) && (
              <button onClick={() => setView('MARKETPLACE')} className="px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-all border border-slate-100">
                Return to Marketplace
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Knowledge Level</label>
              <select value={preferences.experience} onChange={e => setPreferences({ ...preferences, experience: e.target.value as any })} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-3xl font-bold">
                <option>Beginner</option><option>Intermediate</option><option>Expert</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Risk Appetite</label>
              <div className="flex bg-slate-50 rounded-3xl p-1.5 border-2 border-slate-50">
                {['Conservative', 'Balanced', 'Aggressive'].map(r => (
                  <button key={r} onClick={() => setPreferences({ ...preferences, riskAppetite: r as any })} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all ${preferences.riskAppetite === r ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital Reservoir (₹)</label>
              <input type="number" value={preferences.availableCapital} onChange={e => setPreferences({ ...preferences, availableCapital: parseInt(e.target.value) })} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Annual Revenue (₹)</label>
              <input type="number" value={preferences.annualRevenue} onChange={e => setPreferences({ ...preferences, annualRevenue: parseInt(e.target.value) })} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target ROI (%)</label>
              <input type="number" value={preferences.expectedReturn} onChange={e => setPreferences({ ...preferences, expectedReturn: parseInt(e.target.value) })} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold" />
            </div>
          </div>

          <button onClick={handleSavePreferences} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Save & Browse Pools</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Total Invested', value: `₹${(totalInvested / 1000).toFixed(0)}K`, color: 'slate' },
          { label: 'Active Loans', value: activePoolsCount.toString(), color: 'indigo' },
          { label: 'Diversification', value: '82%', color: 'emerald' },
          { label: 'Risk Exposure', value: `${riskExposure}%`, color: riskExposure > 30 ? 'rose' : 'emerald' }
        ].map(s => (
          <div key={s.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{s.label}</p>
            <p className={`text-2xl font-black ${s.color === 'emerald' ? 'text-emerald-600' : s.color === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pool Marketplace</h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Protocol Registry Data</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('ONBOARDING')} className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all">
            Update Strategy
          </button>

          {/* Web3 Wallet hidden for now 
          {!isWalletConnected ? (
            <button onClick={connectWallet} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-100 flex items-center space-x-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21,18V19A2,2 0 0,1,19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1,5,3H19A2,2 0 0,1,21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0,12,18H21M12,16H22V8H12V16M16,13.5A1.5,1.5 0 1,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" /></svg>
              <span>Link Web3 Wallet</span>
            </button>
          ) : (
            <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl flex items-center space-x-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-mono opacity-60">Connected: {walletAddress.substring(0, 8)}...</span>
            </div>
          )} */}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {availablePools.length === 0 ? (
          <div className="lg:col-span-2 bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">No borrowers in registry.</p>
            <button onClick={() => { registryService.wipeAllData(); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Reset Registry</button>
          </div>
        ) : (
          availablePools.map(pool => (
            <div key={pool.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm hover:border-indigo-600 transition-all flex flex-col group">
              <div className="p-10 space-y-8 flex-1">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900">{pool.borrowerName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pool.profile.industry} • {pool.loan.purpose}</p>
                  </div>
                  <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${pool.assessment.riskCategory === 'Low' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
                    {pool.assessment.riskCategory} Risk
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Yield</p>
                    <p className="text-lg font-black text-emerald-600">{pool.assessment.suggestedInterestRate}%</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-1 border border-indigo-100 shadow-sm shadow-indigo-50">
                    <p className="text-[9px] font-black text-indigo-400 uppercase">Live Merit</p>
                    <p className="text-lg font-black text-indigo-600">{pool.assessment.score}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Principal</p>
                    <p className="text-lg font-black text-slate-900">₹{(pool.loan.amount / 1000).toFixed(0)}K</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Registry Progress</span>
                    <span className="text-indigo-600 font-bold">{((pool.totalFunded / pool.loan.amount) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 group-hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]" style={{ width: `${(pool.totalFunded / pool.loan.amount) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-10 border-t border-slate-100">
                {analyzingPool === pool.id ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95">
                    {suggestion ? (
                      <div className="space-y-5">
                        <div className="p-6 bg-indigo-600 text-white rounded-[2.5rem] space-y-3 shadow-xl shadow-indigo-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black uppercase opacity-60">AI Strategy Match</p>
                              <p className="text-3xl font-black">₹{(suggestion.suggestedAmount / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase opacity-60">Max Capacity</p>
                              <p className="text-sm font-black text-indigo-200">₹{(suggestion.maxLendingCapacity / 1000).toFixed(0)}K</p>
                            </div>
                          </div>
                          <p className="text-[11px] font-medium leading-relaxed italic opacity-80">"{suggestion.allocationReason}"</p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Repayment Duration (Months)</label>
                            <input
                              type="number"
                              defaultValue={preferences.preferredTenure}
                              id={`duration-${pool.id}`}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                            />
                          </div>
                          <div className="flex gap-4">
                            <button
                              onClick={() => {
                                const dur = parseInt((document.getElementById(`duration-${pool.id}`) as HTMLInputElement).value);
                                handlePledge(pool, suggestion.suggestedAmount, dur);
                              }}
                              className="flex-1 bg-slate-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all"
                            >
                              Sign & Pay
                            </button>
                            <button onClick={() => setAnalyzingPool(null)} className="px-6 py-5 border-2 border-slate-200 rounded-2xl text-[11px] font-black uppercase text-slate-400">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Optimal Allocation...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={() => handleRunAIAllocation(pool)} className="flex-1 py-5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">AI Recommendation</button>
                    <button onClick={() => setAnalyzingPool(pool.id)} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Manual Pledge</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LenderDashboard;
