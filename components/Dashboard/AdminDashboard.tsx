
import React, { useState, useEffect } from 'react';
import { registryService } from '../../services/registryService';

interface AdminDashboardProps {
  onBack?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [stats, setStats] = useState({ tvl: 0, activePools: 0, totalProtocols: 0 });

  const refreshStats = () => {
    setStats(registryService.getPlatformStats());
  };

  useEffect(() => {
    refreshStats();
    
    window.addEventListener('trustpool-registry-updated', refreshStats);
    return () => window.removeEventListener('trustpool-registry-updated', refreshStats);
  }, []);

  const handleWipe = () => {
    if (confirm("Developer Tool: Wipe all registry data? This will clear all submitted loans.")) {
      registryService.wipeAllData();
      refreshStats();
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Platform Governance</h2>
          <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">Registry Master Node</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleWipe}
            className="px-6 py-3 bg-white border-2 border-rose-100 rounded-2xl text-[10px] font-black text-rose-600 uppercase tracking-widest hover:border-rose-600 transition-all shadow-sm"
          >
            Wipe DB
          </button>
          {onBack && (
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"
            >
              Back to Role Selection
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {[
          { label: 'Network TVL', value: `₹${(stats.tvl/100000).toFixed(2)}L`, color: 'slate' },
          { label: 'Registered Protocols', value: stats.totalProtocols.toString(), color: 'slate' },
          { label: 'Active Funding Pools', value: stats.activePools.toString(), color: 'indigo' },
          { label: 'Average Merit Score', value: '78', color: 'emerald' }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">{stat.label}</p>
            <p className={`text-3xl font-black tracking-tight ${stat.color === 'emerald' ? 'text-emerald-600' : 'text-slate-950'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Live Registry Queue</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Protocol Integrity Audit</p>
          </div>
          <button onClick={refreshStats} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Refresh Node State</button>
        </div>
        <div className="divide-y divide-slate-50">
          {registryService.getPools().map(pool => (
            <div key={pool.id} className="p-10 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
               <div className="flex items-center space-x-8">
                 <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 border border-slate-100">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <div>
                   <p className="text-lg font-black text-slate-950 mb-1">{pool.borrowerName}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{pool.id} • AI Rank: {pool.assessment.score}</p>
                 </div>
               </div>
               <div className="flex items-center space-x-12">
                 <div className="text-right">
                    <p className="text-lg font-black text-slate-900">₹{(pool.loan.amount/1000).toFixed(0)}K</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Target</p>
                 </div>
                 <div className="flex items-center space-x-6">
                   <span className={`text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-widest border ${pool.status === 'OPEN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                     {pool.status}
                   </span>
                   <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all">Audit</button>
                 </div>
               </div>
            </div>
          ))}
          {registryService.getPools().length === 0 && (
            <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Registry is currently empty.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
