
import React from 'react';
import { User, UserRole } from '../../types';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
  onSwitchRole: () => void;
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout, onSwitchRole, children }) => {
  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black italic">TP</div>
            <h2 className="text-2xl font-black tracking-tighter">TrustPool</h2>
          </div>
          <p className="text-slate-500 text-[10px] mt-4 uppercase font-black tracking-[0.2em]">Institutional Access</p>
        </div>
        
        <nav className="flex-1 mt-4 px-4 space-y-1">
          {[
            { label: 'Overview', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', active: true },
            { label: 'Pool Registry', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', active: false },
            { label: 'Risk AI', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', active: false },
            { label: 'Blockchain Ledger', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04M12 21.48V22', active: false }
          ].map(item => (
            <a key={item.label} href="#" className={`flex items-center space-x-4 p-4 rounded-2xl font-bold text-sm transition-all ${item.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
              <span>{item.label}</span>
            </a>
          ))}
          
          <button 
            onClick={onSwitchRole}
            className="w-full flex items-center space-x-4 p-4 rounded-2xl font-bold text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all mt-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            <span>Switch Role</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800">
          <div className="bg-slate-800 p-4 rounded-2xl mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate">{user.name}</p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase">{user.role}</p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono break-all">{user.udyamId}</div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full text-center text-xs font-black text-slate-500 hover:text-white transition-colors"
          >
            TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-gray-100/50">
          <div className="flex items-center space-x-4">
             <div className="bg-green-50 text-green-600 p-2 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04M12 21.48V22" /></svg>
             </div>
             <div>
               <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                 {user.role === UserRole.BORROWER ? 'MSME Credit Hub' : user.role === UserRole.LENDER ? 'Lending Pool Registry' : 'Platform Governance'}
               </h1>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">On-Chain Data: SYNCED</p>
             </div>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">UDYAM Linked</span>
             </div>
             <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
          </div>
        </header>

        <div className="p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
