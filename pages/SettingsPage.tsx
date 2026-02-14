
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { cloudSync } from '../services/cloudSync';
import { ShopSettings, User } from '../types';
import { 
  Cog6ToothIcon, UserGroupIcon, ArrowDownTrayIcon, QrCodeIcon,
  CloudIcon, ShieldCheckIcon, PencilSquareIcon, TrashIcon, KeyIcon,
  BuildingStorefrontIcon, PrinterIcon, ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon, ArrowUpTrayIcon, DocumentArrowDownIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';
import * as XLSX from 'xlsx';

const SettingsPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'cloud' | 'export'>('general');
  const [settings, setSettings] = useState<ShopSettings>(db.getSettings());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', pin: '', role: 'cashier' });
  const [copySuccess, setCopySuccess] = useState(false);

  const publicUrl = window.location.origin + window.location.pathname + '#catalog';

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    alert("✅ تم حفظ الإعدادات بنجاح");
  };

  const downloadBackup = () => {
    const data = db.getRawStore();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_nabil_pos_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm("⚠️ هل أنت متأكد؟ سيتم استبدال كل البيانات الحالية بالبيانات الموجودة في الملف.")) {
          db.updateFromCloud(json);
          alert("✅ تمت استعادة البيانات بنجاح! سيتم تحديث الصفحة.");
          window.location.reload();
        }
      } catch (err) { alert("❌ ملف غير صالح"); }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareViaWhatsapp = () => {
    const text = `مرحباً بك في *${settings.name}* 🏪\n\nيمكنك الآن تصفح منتجاتنا، معرفة الأسعار، ومتابعة رصيد نقاطك وديونك من خلال الرابط التالي:\n\n${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const userToSave = editingUser || newUser;
    if (!userToSave.name || !userToSave.pin) return alert("يرجى إكمال البيانات");
    db.addUser(userToSave);
    setNewUser({ name: '', pin: '', role: 'cashier' });
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("حذف الموظف؟")) db.deleteUser(id);
  };

  return (
    <Layout active="/settings" setPage={setPage} onLogout={onLogout}>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2">
            <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                <BuildingStorefrontIcon className="w-6 h-6" /> إعدادات المتجر
            </button>
            <button onClick={() => setActiveTab('staff')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition ${activeTab === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                <UserGroupIcon className="w-6 h-6" /> الموظفون
            </button>
            <button onClick={() => setActiveTab('cloud')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition ${activeTab === 'cloud' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                <CloudIcon className="w-6 h-6" /> السحابة والأمان
            </button>
            <button onClick={() => setActiveTab('export')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition ${activeTab === 'export' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                <ArrowDownTrayIcon className="w-6 h-6" /> تصدير البيانات
            </button>
        </div>

        <div className="flex-1 space-y-8">
            {activeTab === 'general' && (
                <>
                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
                        <h3 className="text-xl font-black mb-8 border-b pb-4">معلومات المتجر</h3>
                        <form onSubmit={handleUpdateSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs font-black text-gray-400 mb-2 block">اسم السوبر ماركت</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} /></div>
                                <div><label className="text-xs font-black text-gray-400 mb-2 block">رقم التواصل</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} /></div>
                            </div>
                            <button type="submit" className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl">حفظ</button>
                        </form>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1">
                                <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-blue-600"><QrCodeIcon className="w-6 h-6" /> بوابة الزبائن الذكية</h3>
                                <p className="text-gray-400 font-bold text-sm mb-6 leading-relaxed">اطبع هذا الكود وعلقه في المحل ليدخل الزبائن ويروا نقاطهم بأنفسهم.</p>
                                
                                <div className="bg-gray-50 p-5 rounded-2xl font-mono text-xs break-all mb-6 border-2 border-dashed border-gray-200 flex justify-between items-center gap-4">
                                    <span className="text-gray-500">{publicUrl}</span>
                                    <button onClick={copyToClipboard} className={`p-2 rounded-xl transition ${copySuccess ? 'bg-green-500 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition">
                                        <PrinterIcon className="w-5 h-5" /> طباعة QR الكتالوج
                                    </button>
                                    <button onClick={shareViaWhatsapp} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition">
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" /> واتساب للزبائن
                                    </button>
                                </div>
                            </div>
                            <div className="w-56 h-56 bg-white border-8 border-gray-100 p-3 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`} alt="Store QR" className="w-full h-full" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'cloud' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-purple-600"><ShieldCheckIcon className="w-6 h-6" /> الأمان والنسخ الاحتياطي</h3>
                        <p className="text-gray-400 font-bold text-sm mb-8">حماية بياناتك هي أولويتنا. اختر الطريقة المناسبة لحفظ بياناتك.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-100"><CloudIcon className="w-6 h-6" /></div>
                                    <h4 className="font-black text-blue-900 text-lg mb-2">المزامنة السحابية</h4>
                                    <p className="text-xs text-blue-500 font-bold leading-relaxed mb-6">يتم حفظ بياناتك تلقائياً في حساب جوجل درايف الخاص بك. هذه الطريقة تحميك من ضياع الهاتف أو تعطل المتصفح.</p>
                                </div>
                                <button onClick={() => cloudSync.initGoogleAuth()} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">ربط حساب جوجل</button>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg"><DocumentArrowDownIcon className="w-6 h-6" /></div>
                                    <h4 className="font-black text-gray-900 text-lg mb-2">نسخة احتياطية يدوية</h4>
                                    <p className="text-xs text-gray-400 font-bold leading-relaxed mb-6">قم بتحميل ملف يحتوي على كل بياناتك الآن لحفظه في مكان آمن بعيداً عن الإنترنت.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={downloadBackup} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs">تحميل النسخة</button>
                                    <label className="flex-1 bg-white border-2 border-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xs text-center cursor-pointer flex items-center justify-center">
                                        استعادة
                                        <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-green-50 p-8 rounded-[2.5rem] border-2 border-green-100 flex items-center gap-6">
                        <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100"><CheckBadgeIcon className="w-8 h-8" /></div>
                        <div>
                            <h4 className="font-black text-green-900">جاهز للعمل الحقيقي</h4>
                            <p className="text-sm text-green-700 font-bold">النظام الآن يدعم العمل بدون إنترنت، وجميع بياناتك يتم تخزينها في المتصفح بشكل آمن.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
