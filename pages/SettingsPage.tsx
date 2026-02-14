
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { cloudSync } from '../services/cloudSync';
import { aiService } from '../services/aiService';
import { ShopSettings, User } from '../types';
import { 
  Cog6ToothIcon, UserGroupIcon, ArrowDownTrayIcon, QrCodeIcon,
  CloudIcon, ShieldCheckIcon, PencilSquareIcon, TrashIcon, KeyIcon,
  BuildingStorefrontIcon, PrinterIcon, ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon, ArrowUpTrayIcon, DocumentArrowDownIcon,
  CheckBadgeIcon, SparklesIcon, XMarkIcon, QuestionMarkCircleIcon,
  LinkIcon, InformationCircleIcon, ShareIcon, UserCircleIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';

const SettingsPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'staff' | 'cloud' | 'export' | 'help'>('general');
  const [settings, setSettings] = useState<ShopSettings>(db.getSettings());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ name: '', pin: '', role: 'cashier' });
  const [copySuccess, setCopySuccess] = useState(false);
  const [linkCopySuccess, setLinkCopySuccess] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(aiService.hasKey());

  const publicUrl = window.location.origin + window.location.pathname + '#catalog';
  const systemUrl = window.location.origin;

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settings);
    alert("✅ تم حفظ الإعدادات بنجاح");
  };

  const copyToClipboard = (text: string, setStatus: (s: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setStatus(true);
    setTimeout(() => setStatus(false), 2000);
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

  const handleAddOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const userToSave = editingUser || newUser;
    if (!userToSave.name || !userToSave.pin) return alert("يرجى إكمال البيانات");
    db.addUser(userToSave);
    setNewUser({ name: '', pin: '', role: 'cashier' });
    setEditingUser(null);
    setUsers(db.getUsers());
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("حذف الموظف؟")) {
      db.deleteUser(id);
      setUsers(db.getUsers());
    }
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
            <button onClick={() => setActiveTab('help')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition ${activeTab === 'help' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>
                <InformationCircleIcon className="w-6 h-6" /> دليل المساعدة
            </button>
        </div>

        <div className="flex-1 space-y-8">
            {activeTab === 'general' && (
                <>
                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h3 className="text-xl font-black">معلومات المتجر</h3>
                            <div className="bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100">
                                <span className="text-[10px] font-black text-blue-600 uppercase">رابط النظام الخاص بك:</span>
                                <span className="text-[10px] font-mono text-blue-400 select-all">{systemUrl}</span>
                                <button onClick={() => copyToClipboard(systemUrl, setLinkCopySuccess)} className={`p-1 rounded transition ${linkCopySuccess ? 'text-green-500' : 'text-blue-300 hover:text-blue-600'}`}>
                                    {linkCopySuccess ? <CheckBadgeIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateSettings} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs font-black text-gray-400 mb-2 block">اسم السوبر ماركت</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} /></div>
                                <div><label className="text-xs font-black text-gray-400 mb-2 block">رقم التواصل</label><input className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} /></div>
                            </div>
                            <button type="submit" className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition">حفظ المعلومات</button>
                        </form>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-1">
                                <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-blue-600"><QrCodeIcon className="w-6 h-6" /> بوابة الزبائن الذكية</h3>
                                <p className="text-gray-400 font-bold text-sm mb-6 leading-relaxed">اطبع هذا الكود وعلقه في المحل ليدخل الزبائن ويروا نقاطهم بأنفسهم.</p>
                                
                                <div className="bg-gray-50 p-5 rounded-2xl font-mono text-xs break-all mb-6 border-2 border-dashed border-gray-200 flex justify-between items-center gap-4">
                                    <span className="text-gray-500">{publicUrl}</span>
                                    <button onClick={() => copyToClipboard(publicUrl, setCopySuccess)} className={`p-2 rounded-xl transition ${copySuccess ? 'bg-green-500 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition">
                                        <PrinterIcon className="w-5 h-5" /> طباعة QR الكود
                                    </button>
                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`مرحباً بك في *${settings.name}* 🏪\n\nتصفح منتجاتنا هنا:\n${publicUrl}`)}`, '_blank')} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg active:scale-95 transition">
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

            {activeTab === 'staff' && (
                <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
                    <h3 className="text-xl font-black mb-8 border-b pb-4">إدارة الموظفين</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        {u.role === 'admin' ? <ShieldCheckIcon className="w-6 h-6" /> : <UserCircleIcon className="w-6 h-6" />}
                                    </div>
                                    <div><p className="font-black text-gray-800">{u.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{u.role === 'admin' ? 'مدير' : 'موظف'}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingUser(u)} className="p-2 text-gray-300 hover:text-blue-600 transition"><PencilSquareIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-300 hover:text-red-500 transition"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleAddOrUpdateUser} className="bg-blue-50/50 p-8 rounded-[2.5rem] border-2 border-blue-50">
                        <h4 className="font-black text-blue-900 mb-6">{editingUser ? 'تعديل موظف' : 'إضافة موظف جديد'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input placeholder="اسم الموظف" className="p-4 rounded-xl border-none outline-none font-bold" value={editingUser ? editingUser.name : newUser.name} onChange={e => editingUser ? setEditingUser({...editingUser, name: e.target.value}) : setNewUser({...newUser, name: e.target.value})} />
                            <input placeholder="رمز الدخول (4 أرقام)" maxLength={4} className="p-4 rounded-xl border-none outline-none font-bold" value={editingUser ? editingUser.pin : newUser.pin} onChange={e => editingUser ? setEditingUser({...editingUser, pin: e.target.value}) : setNewUser({...newUser, pin: e.target.value})} />
                            <select className="p-4 rounded-xl border-none outline-none font-bold" value={editingUser ? editingUser.role : newUser.role} onChange={e => editingUser ? setEditingUser({...editingUser, role: e.target.value as any}) : setNewUser({...newUser, role: e.target.value as any})}>
                                <option value="cashier">كاشير</option><option value="admin">مدير</option>
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-sm">حفظ</button>
                            {editingUser && <button type="button" onClick={() => setEditingUser(null)} className="text-gray-400 font-bold">إلغاء</button>}
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'cloud' && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-blue-600"><CloudIcon className="w-6 h-6" /> المزامنة السحابية (Google Drive)</h3>
                        <p className="text-gray-400 font-bold text-sm mb-8">حماية بياناتك من الضياع عبر المزامنة الآلية مع حسابك الشخصي.</p>
                        
                        <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex-1">
                                <h4 className="font-black text-blue-900 text-lg mb-2">ربط التخزين</h4>
                                <p className="text-xs text-blue-500 font-bold leading-relaxed">يتم حفظ ملف مشفر يحتوي على كافة البيانات في مجلد خاص بجوجل درايف.</p>
                            </div>
                            <button onClick={() => cloudSync.initGoogleAuth()} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition active:scale-95">تفعيل المزامنة</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'export' && (
                <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
                    <h3 className="text-xl font-black mb-4">تصدير واستيراد البيانات يدوياً</h3>
                    <p className="text-gray-400 font-bold text-sm mb-10">يمكنك تحميل نسخة كاملة من النظام أو استعادتها في أي وقت.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={downloadBackup} className="p-10 bg-gray-900 text-white rounded-[2.5rem] flex flex-col items-center gap-4 shadow-xl active:scale-95 transition group">
                            <DocumentArrowDownIcon className="w-10 h-10 text-gray-400 group-hover:text-white transition" />
                            <span className="font-black text-xl">تحميل النسخة (.json)</span>
                        </button>
                        <label className="p-10 bg-white border-2 border-dashed border-gray-200 text-gray-400 rounded-[2.5rem] flex flex-col items-center gap-4 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition active:scale-95">
                            <ArrowUpTrayIcon className="w-10 h-10" />
                            <span className="font-black text-xl">استعادة من ملف</span>
                            <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                        </label>
                    </div>
                </div>
            )}

            {activeTab === 'help' && (
                <div className="space-y-6 animate-in slide-in-from-left">
                    <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                        <h3 className="text-2xl font-black mb-6 text-purple-600 flex items-center gap-3">
                            <InformationCircleIcon className="w-8 h-8" />
                            مركز المساعدة الذكي
                        </h3>
                        
                        <div className="space-y-10">
                            {/* Gemini Section */}
                            <section className="border-r-4 border-purple-500 pr-6">
                                <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <SparklesIcon className="w-6 h-6 text-purple-500" />
                                    تفعيل الذكاء الاصطناعي (Gemini)
                                </h4>
                                <p className="text-gray-500 font-bold text-sm mb-6 leading-relaxed">
                                    للحصول على نصائح تجارية دقيقة وتحليل للمبيعات، يجب ربط مفتاح API من جوجل.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center justify-between p-5 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100 transition group">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-600 text-white p-2 rounded-xl"><LinkIcon className="w-5 h-5" /></div>
                                            <span className="font-black text-purple-900">رابط جلب المفتاح</span>
                                        </div>
                                        <span className="text-[10px] bg-white px-2 py-1 rounded-lg font-black text-purple-600 shadow-sm uppercase group-hover:scale-110 transition">افتح الآن</span>
                                    </a>
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                        <h5 className="font-black text-xs text-gray-400 mb-2">الحالة الحالية:</h5>
                                        <div className={`flex items-center gap-2 font-black ${hasAiKey ? 'text-green-600' : 'text-red-500 animate-pulse'}`}>
                                            {hasAiKey ? <CheckBadgeIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
                                            {hasAiKey ? 'مفعل ويعمل بنجاح' : 'غير مفعل (أضف المفتاح في Vercel)'}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Cloud Section */}
                            <section className="border-r-4 border-blue-500 pr-6">
                                <h4 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <CloudIcon className="w-6 h-6 text-blue-500" />
                                    المزامنة والنسخ الاحتياطي
                                </h4>
                                <p className="text-gray-500 font-bold text-sm mb-4 leading-relaxed">
                                    بياناتك مخزنة محلياً في المتصفح. لتجنب ضياعها في حال مسح بيانات المتصفح، ننصح دائماً بربطها بجوجل درايف.
                                </p>
                                <ul className="text-xs font-bold text-gray-400 space-y-2 list-disc list-inside">
                                    <li>يتم حفظ نسخة مشفرة في مجلد التطبيقات بجوجل درايف.</li>
                                    <li>المزامنة تتم تلقائياً عند كل عملية بيع.</li>
                                    <li>يمكنك استعادة البيانات في أي وقت من أي جهاز آخر.</li>
                                </ul>
                            </section>
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
