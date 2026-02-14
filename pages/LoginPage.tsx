
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { 
  GlobeAltIcon, 
  UserCircleIcon, 
  ShieldCheckIcon,
  ChevronLeftIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const settings = db.getSettings();

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const user = db.login(selectedUser.id, pin);
    if (user) {
      onLogin();
    } else {
      setError('الرمز السري غير صحيح لهذا المستخدم');
      setPin('');
      // اهتزاز بسيط للتنبيه بالخطأ
      if (window.navigator.vibrate) window.navigator.vibrate(200);
    }
  };

  const openPublicCatalog = () => {
    window.location.hash = 'catalog';
  };

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl text-gray-900 animate-in zoom-in duration-300 relative overflow-hidden">
        
        {/* زر المتجر العام للزبائن */}
        <button 
            onClick={openPublicCatalog}
            className="absolute top-0 right-0 left-0 bg-blue-50 text-blue-700 py-3 text-[10px] font-black flex items-center justify-center gap-2 hover:bg-blue-100 transition border-b border-blue-100 uppercase tracking-widest"
        >
            <GlobeAltIcon className="w-4 h-4" />
            تصفح المتجر والأسعار (للزوار)
        </button>

        <div className="text-center mb-10 mt-10">
           <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50 overflow-hidden p-3">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-black text-blue-600">POS</span>
              )}
           </div>
           <h1 className="text-xl font-black text-gray-900">{settings.name}</h1>
           <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-widest uppercase">نظام إدارة المبيعات والمخزن</p>
        </div>

        {!selectedUser ? (
          <div className="animate-in slide-in-from-bottom duration-300">
            <h3 className="text-sm font-black text-gray-400 mb-6 text-center uppercase tracking-widest">اختر هويتك للدخول</h3>
            <div className="grid grid-cols-1 gap-3">
              {users.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-3xl hover:bg-blue-50 hover:scale-105 transition-all border border-transparent hover:border-blue-100 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                       {u.role === 'admin' ? <ShieldCheckIcon className="w-7 h-7" /> : <UserCircleIcon className="w-7 h-7" />}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-800">{u.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{u.role === 'admin' ? 'المدير' : 'موظف كاشير'}</p>
                    </div>
                  </div>
                  <ChevronLeftIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-3xl border border-blue-100 mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                    {selectedUser.role === 'admin' ? <ShieldCheckIcon className="w-6 h-6" /> : <UserCircleIcon className="w-6 h-6" />}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-900 text-sm">{selectedUser.name}</p>
                    <p className="text-[9px] text-blue-400 font-bold uppercase">أدخل رمز الدخول</p>
                  </div>
               </div>
               <button type="button" onClick={() => {setSelectedUser(null); setError(''); setPin('');}} className="text-[10px] font-black text-blue-600 hover:underline">تغيير</button>
            </div>

            <div className="relative">
              <input 
                type="password" 
                placeholder="••••"
                autoFocus
                maxLength={4}
                className="w-full text-center text-4xl tracking-[0.5em] p-6 bg-gray-50 border-2 border-transparent rounded-[2.5rem] focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner font-black"
                value={pin}
                onChange={e => { setPin(e.target.value); if(error) setError(''); }}
              />
              <FingerPrintIcon className="absolute left-6 top-7 w-8 h-8 text-gray-200 pointer-events-none" />
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-black text-center animate-bounce">{error}</p>}

            <button 
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              فتح النظام
            </button>
          </form>
        )}

        <p className="mt-10 text-center text-[9px] text-gray-300 font-bold tracking-[0.2em] uppercase">Built with pride for Supermarket Nabil</p>
      </div>
    </div>
  );
};

export default LoginPage;
