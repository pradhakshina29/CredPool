
import React from 'react';
import { UserRole } from '../../types';

interface RoleSelectionProps {
  onRoleSelected: (role: UserRole) => void;
  onBack: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelected, onBack }) => {
  const roles = [
    {
      id: UserRole.BORROWER,
      title: 'MSME Borrower',
      tag: 'Growth Focused',
      description: 'Access institutional capital pools based on your business merit and AI-driven credit scoring.',
      features: ['Automated Credit Assessment', 'Community Pooling', 'Low Interest Rates'],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: UserRole.LENDER,
      title: 'Capital Funder',
      tag: 'Yield Generator',
      description: 'Deploy capital into verified MSME pools with full blockchain transparency and risk mitigation.',
      features: ['Direct Asset Backing', 'Real-time On-chain Ledger', 'Performance Analytics'],
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 selection:bg-indigo-100">
      <div className="max-w-4xl w-full">
        {/* Top Navigation */}
        <div className="mb-12 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="group inline-flex items-center space-x-2 text-slate-400 hover:text-slate-900 transition-all"
          >
            <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
              <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
          </button>
          
          <div className="text-right">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Stage 02/02</p>
            <p className="text-sm font-bold text-slate-900">Configure Identity</p>
          </div>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Choose your role.</h1>
          <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">Select the protocol interface that best aligns with your financial objectives on the TrustPool network.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => onRoleSelected(role.id)}
              className="group relative bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-100 transition-all text-left flex flex-col items-start overflow-hidden hover:border-indigo-500"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 p-8 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 -translate-y-4">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
              </div>

              <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                {role.icon}
              </div>
              
              <div className="mb-2 inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {role.tag}
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 mb-4">{role.title}</h2>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">{role.description}</p>
              
              <ul className="space-y-3 mb-10 w-full">
                {role.features.map(f => (
                  <li key={f} className="flex items-center space-x-3 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto w-full pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Select Interface</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <button 
            onClick={() => onRoleSelected(UserRole.ADMIN)}
            className="px-6 py-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-white transition-all text-[10px] font-black uppercase tracking-[0.2em]"
          >
            System Administrator Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
