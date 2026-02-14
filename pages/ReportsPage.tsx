
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { aiService } from '../services/aiService';
import { 
  CurrencyDollarIcon, ArrowTrendingUpIcon, WalletIcon, 
  MinusCircleIcon, TruckIcon, ChartBarIcon, 
  ShoppingBagIcon, CalendarDaysIcon, BanknotesIcon,
  SparklesIcon, ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';

const ReportsPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [report, setReport] = useState<any>(null);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expAmount, setExpAmount] = useState(0);
  const [expCat, setExpCat] = useState('كهرباء');
  const [expNotes, setExpNotes] = useState('');
  
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(aiService.hasKey());

  const refresh = () => setReport(db.getReport());
  useEffect(() => { refresh(); return db.subscribe(() => refresh()); }, []);

  const handleAddExp = () => {
    if (expAmount <= 0) return;
    db.addExpense(expAmount, expCat, expNotes);
    setShowExpModal(false); setExpAmount(0); setExpNotes('');
  };

  const handleGetAIInsights = async () => {
    if (!hasAiKey) {
      setPage('/settings');
      return;
    }
    setIsAnalyzing(true);
    const insights = await aiService.getBusinessInsights();
    setAiInsights(insights || 'تعذر الحصول على نصيحة حالياً.');
    setIsAnalyzing(false);
  };

  if (!report) return null;

  return (
    <Layout active="/reports" setPage={setPage} onLogout={onLogout}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-black text-gray-900">التقارير المالية</h1>
            <p className="text-sm text-gray-500 font-bold">ملخص الأرباح والمصاريف والصندوق</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button 
                onClick={handleGetAIInsights}
                disabled={isAnalyzing}
                className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition disabled:opacity-50 ${hasAiKey ? 'bg-purple-600 text-white shadow-purple-100' : 'bg-gray-200 text-gray-500 shadow-none'}`}
            >
                {isAnalyzing ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                {!hasAiKey ? 'تفعيل المستشار الذكي' : isAnalyzing ? 'جاري التحليل..' : 'نصيحة ذكية'}
            </button>
            <button onClick={() => setShowExpModal(true)} className="flex-1 md:flex-none bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition">
                <MinusCircleIcon className="w-6 h-6" /> تسجيل مصروف
            </button>
        </div>
      </div>

      {!hasAiKey && (
        <div className="mb-8 bg-orange-50 border-2 border-orange-100 p-6 rounded-[2rem] flex items-center gap-4 text-orange-800">
           <ExclamationTriangleIcon className="w-10 h-10 text-orange-500 shrink-0" />
           <p className="text-sm font-bold">
             عقلك الذكي (AI) متوقف حالياً. لتفعيله والحصول على نصائح تجارية دقيقة، يرجى إضافة <b>API_KEY</b> في إعدادات Vercel.
           </p>
        </div>
      )}

      {aiInsights && (
        <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-top duration-500">
           <div className="absolute top-0 right-0 p-4 opacity-10"><SparklesIcon className="w-32 h-32" /></div>
           <div className="flex items-start gap-4 relative z-10">
              <div className="bg-white/20 p-3 rounded-2xl"><ChatBubbleBottomCenterTextIcon className="w-8 h-8" /></div>
              <div>
                 <h3 className="font-black text-xl mb-2">مستشار نبيل الذكي (AI)</h3>
                 <p className="font-bold text-blue-50 leading-relaxed whitespace-pre-wrap">{aiInsights}</p>
                 <button onClick={() => setAiInsights(null)} className="mt-4 text-xs font-black bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition">إخفاء التحليل</button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><ArrowTrendingUpIcon className="w-6 h-6" /></div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">أرباح البيع اليومية</p>
            <h3 className="text-2xl font-black text-gray-900">{report.todayProfit.toFixed(2)} ₪</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4"><MinusCircleIcon className="w-6 h-6" /></div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">إجمالي المصاريف</p>
            <h3 className="text-2xl font-black text-red-600">{report.todayExpenses.toFixed(2)} ₪</h3>
        </div>
        <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-100 text-white relative overflow-hidden">
            <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 relative z-10"><BanknotesIcon className="w-6 h-6" /></div>
            <p className="text-[10px] text-blue-100 font-black uppercase mb-1 relative z-10">صافي الربح الحقيقي</p>
            <h3 className="text-3xl font-black relative z-10">{report.netProfit.toFixed(2)} ₪</h3>
            <div className="absolute -right-4 -bottom-4 opacity-10"><ChartBarIcon className="w-32 h-32" /></div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4"><WalletIcon className="w-6 h-6" /></div>
            <p className="text-[10px] text-gray-400 font-black uppercase mb-1">كاش الصندوق الحالي</p>
            <h3 className="text-2xl font-black text-green-600">{report.shift?.expectedCash.toFixed(2) || '0.00'} ₪</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
           <h3 className="text-xl font-black flex items-center gap-2 mb-6"><ShoppingBagIcon className="w-7 h-7 text-purple-600" /> الأصناف الأكثر مبيعاً</h3>
           <div className="space-y-4">
              {report.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border">
                  <span className="font-black text-gray-700">{p.name}</span>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-black">{p.qty} قطعة</span>
                </div>
              ))}
           </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
           <h3 className="text-xl font-black flex items-center gap-2 mb-6"><CalendarDaysIcon className="w-7 h-7 text-orange-600" /> تنبيهات الصلاحية</h3>
           <div className="space-y-4">
              {report.expiringSoon.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                  <span className="font-black text-orange-800 text-sm">{p.name}</span>
                  <span className="text-xs font-black text-orange-600">{p.expiry_date}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {showExpModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-2xl font-black mb-8 text-center text-red-600">تسجيل مصروف جديد</h3>
             <div className="space-y-4">
                <input type="number" placeholder="المبلغ ₪" className="w-full p-6 bg-red-50 text-red-700 border-none rounded-2xl text-3xl font-black text-center outline-none" value={expAmount} onChange={e => setExpAmount(Number(e.target.value))} />
                <select className="w-full p-4 rounded-xl border-2 font-bold" value={expCat} onChange={e => setExpCat(e.target.value)}>
                    <option value="كهرباء">كهرباء / ماء</option><option value="إيجار">إيجار المحل</option><option value="رواتب">رواتب موظفين</option><option value="أكياس">أكياس وتغليف</option><option value="أخرى">مصاريف أخرى</option>
                </select>
                <input placeholder="ملاحظات إضافية.." className="w-full p-4 rounded-xl border-2 font-bold" value={expNotes} onChange={e => setExpNotes(e.target.value)} />
                <button onClick={handleAddExp} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition">تأكيد الخصم</button>
                <button onClick={() => setShowExpModal(false)} className="w-full py-2 text-gray-400 font-bold">إلغاء</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReportsPage;
