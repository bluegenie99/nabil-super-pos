
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCartIcon, TagIcon, UsersIcon, ArrowPathIcon, 
  ChartBarIcon, ArrowLeftOnRectangleIcon, CloudIcon, 
  CloudArrowUpIcon, LockOpenIcon, LockClosedIcon, GlobeAltIcon, 
  TruckIcon, UserCircleIcon, CalculatorIcon, ArchiveBoxIcon,
  Cog6ToothIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PagePath } from '../App';
import { cloudSync } from '../services/cloudSync';
import { db } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  active: PagePath;
  setPage: (path: PagePath) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, active, setPage, onLogout }) => {
  const [syncStatus, setSyncStatus] = useState(cloudSync.getStatus());
  const [isShiftOpen, setIsShiftOpen] = useState(db.getRawStore().currentShift?.isOpen ?? false);
  const currentUser = db.getCurrentUser();
  const settings = db.getSettings();

  useEffect(() => {
    cloudSync.setNotifyCallback((s: any) => setSyncStatus(s));
    const unsubscribe = db.subscribe((store: any) => {
        setIsShiftOpen(store.currentShift?.isOpen ?? false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    db.logout();
    onLogout();
  };

  const handleCloudLogin = async () => {
    try {
      await cloudSync.initGoogleAuth();
      alert("تم الربط مع جوجل درايف بنجاح!");
    } catch (e: any) {
      alert("خطأ في الربط: " + e.message);
    }
  };

  const navItems = [
    { name: 'المبيعات', icon: ShoppingCartIcon, path: '/pos', roles: ['admin', 'cashier'] },
    { name: 'الأرشيف', icon: ArchiveBoxIcon, path: '/archive', roles: ['admin', 'cashier'] },
    { name: 'المنتجات', icon: TagIcon, path: '/products', roles: ['admin', 'cashier'] },
    { name: 'الزبائن', icon: UsersIcon, path: '/customers', roles: ['admin', 'cashier'] },
    { name: 'الموردين', icon: TruckIcon, path: '/suppliers', roles: ['admin'] },
    { name: 'المرتجعات', icon: ArrowPathIcon, path: '/returns', roles: ['admin'] },
    { name: 'الجرد الذكي', icon: CalculatorIcon, path: '/audit', roles: ['admin'] },
    { name: 'التقارير', icon: ChartBarIcon, path: '/reports', roles: ['admin'] },
    { name: 'الإعدادات', icon: Cog6ToothIcon, path: '/settings', roles: ['admin'] },
    { name: 'المتجر', icon: GlobeAltIcon, path: '/catalog', roles: ['admin', 'cashier'] },
  ].filter(item => item.roles.includes(currentUser?.role || 'cashier'));

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 bg-gray-50">
      <nav className="hidden md:flex fixed top-0 w-full bg-white border-b border-gray-100 z-[100] px-6 py-3 items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="w-8 h-8 object-contain" />}
                <h1 className="text-xl font-black text-blue-600">{settings.name}</h1>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-gray-700">{currentUser?.name || 'زائر'}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${currentUser?.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>
                    {currentUser?.role === 'admin' ? 'مدير' : 'كاشير'}
                </span>
            </div>

            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${isShiftOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {isShiftOpen ? <LockOpenIcon className="w-3 h-3" /> : <LockClosedIcon className="w-3 h-3" />}
                <span>{isShiftOpen ? 'الوردية مفتوحة' : 'الوردية مغلقة'}</span>
            </div>

            <button 
              onClick={handleCloudLogin}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black transition ${syncStatus === 'success' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}
            >
              {syncStatus === 'syncing' ? <CloudArrowUpIcon className="w-4 h-4 sync-spin" /> : <CloudIcon className="w-4 h-4" />}
              {syncStatus === 'success' ? 'سحابة متصلة' : syncStatus === 'syncing' ? 'جاري المزامنة..' : 'ربط السحابة'}
            </button>
        </div>
        
        <div className="flex gap-4">
          <div className="flex gap-1 overflow-x-auto max-w-[40vw]">
            {navItems.map((item) => (
              <button 
                key={item.path} 
                onClick={() => setPage(item.path as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${active === item.path ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-black">{item.name}</span>
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm font-black">خروج</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-3 z-[100] shadow-[0_-5px_15px_rgba(0,0,0,0.05)] overflow-x-auto">
        {navItems.map((item) => (
          <button 
            key={item.path} 
            onClick={() => setPage(item.path as any)}
            className={`flex flex-col items-center p-2 rounded-2xl min-w-[70px] transition-all ${active === item.path ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] mt-1.5 font-black">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
