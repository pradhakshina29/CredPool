
import React, { useState, useEffect } from 'react';
import { User } from './types';
import LoginView from './components/Auth/LoginView';
import RoleSelection from './components/Auth/RoleSelection';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import BorrowerDashboard from './components/Dashboard/BorrowerDashboard';
import LenderDashboard from './components/Dashboard/LenderDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TransactionHistory from './pages/TransactionHistory';

import { db } from './services/firebase';
import { registryService } from './services/registryService';
import { sandboxAuthService } from './services/sandboxAuthService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Notification as TPNotification, UserRole } from './types';

const NotificationOverlay: React.FC<{ notifications: TPNotification[], onDismiss: (id: string) => void }> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-8 right-8 z-[9999] space-y-4 max-w-xs w-full pointer-events-none">
      {notifications.map(n => (
        <div key={n.id} className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-right-8 pointer-events-auto group">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{n.title}</h4>
            <button onClick={() => onDismiss(n.id)} className="text-white/20 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-xs font-medium text-slate-300 leading-relaxed">{n.message}</p>
          <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-shrink-width" />
          </div>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'AUTH' | 'ROLE_PICK' | 'APP' | 'TRANSACTION_HISTORY'>('AUTH');
  const [notifications, setNotifications] = useState<TPNotification[]>([]);

  useEffect(() => {
    (window as any).credpool_notify = (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotif: TPNotification = {
        id,
        userId: user?.id || 'system',
        title,
        message,
        type,
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('credpool_user');
    const savedToken = localStorage.getItem('credpool_token');

    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setToken(savedToken);
      setView(parsedUser.role === UserRole.UNASSIGNED ? 'ROLE_PICK' : 'APP');
    }
  }, []);

  useEffect(() => {
    // Seed sandbox accounts on app load for demo
    sandboxAuthService.seedSandboxAccounts();
  }, []);

  const handleLoginSuccess = async (userData: User, jwt: string) => {
    // 1. Initial local set
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('credpool_token', jwt);

    // 2. Fetch Centralized Data from Firestore
    try {
      const profile = await registryService.getUserProfile(userData.udyamId);

      // Merge Firestore role if available
      const finalRole = userData.role !== UserRole.UNASSIGNED ? userData.role :
        (profile.borrower ? UserRole.BORROWER :
          (profile.lender ? UserRole.LENDER : UserRole.UNASSIGNED));

      const syncedUser = { ...userData, role: finalRole };
      setUser(syncedUser);
      localStorage.setItem('credpool_user', JSON.stringify(syncedUser));

      if (finalRole === UserRole.UNASSIGNED) {
        setView('ROLE_PICK');
      } else {
        setView('APP');
        (window as any).credpool_notify?.("Welcome Back!", `Logged in as ${userData.name}`, "SUCCESS");
      }
    } catch (e) {
      setView('ROLE_PICK');
    }
  };

  const handleRoleAssigned = (role: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem('credpool_user', JSON.stringify(updatedUser));
    setView('APP');
  };

  const handleSwitchRole = () => {
    setView('ROLE_PICK');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('credpool_user');
    localStorage.removeItem('credpool_token');
    setView('AUTH');
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (view === 'AUTH') {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'ROLE_PICK') {
    return (
      <>
        <NotificationOverlay notifications={notifications} onDismiss={dismissNotification} />
        <RoleSelection onRoleSelected={handleRoleAssigned} onBack={handleLogout} />
      </>
    );
  }

  return (
    <>
      <NotificationOverlay notifications={notifications} onDismiss={dismissNotification} />
      <DashboardLayout user={user!} onLogout={handleLogout} onSwitchRole={handleSwitchRole}>
        <div className="mb-6 flex space-x-4 border-b border-white/5 pb-4">
          <button
            onClick={() => setView('APP')}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${view === 'APP' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('TRANSACTION_HISTORY')}
            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${view === 'TRANSACTION_HISTORY' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            History
          </button>
        </div>

        {view === 'APP' && (
          <>
            {user?.role === UserRole.BORROWER && <BorrowerDashboard user={user} />}
            {user?.role === UserRole.LENDER && <LenderDashboard user={user} />}
            {user?.role === UserRole.ADMIN && <AdminDashboard onBack={handleSwitchRole} />}
          </>
        )}

        {view === 'TRANSACTION_HISTORY' && <TransactionHistory />}
      </DashboardLayout>
    </>
  );
};

export default App;
