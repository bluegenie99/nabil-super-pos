
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { aiService } from '../services/aiService';
import { 
  ArrowTrendingUpIcon, BanknotesIcon, ShoppingBagIcon, 
  SparklesIcon, ClockIcon, ChartPieIcon, ArrowUpIcon,
  ExclamationCircleIcon, CubeIcon, LockClosedIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';

const DashboardPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [report, setReport] = useState<any>(null);
  const [forecast, setForecast] = useState<string>('جاري تحليل البيانات...');
  const [showShiftModal, setShowShiftModal] = useState(false);

  useEffect(() => {
    const data = db.getReport();
    setReport(data);
    aiService.getInventoryForecast().then((res) => setForecast(res || 'لا توجد توقعات حالياً.'));
    return db.subscribe(() => setReport(db.getReport()));
  }, []);

  const handleCloseShift = () => {
    if (confirm("هل أنت متأكد من إغلاق الوردية الحالية؟ سيتم تصفير عداد الكاش للوردية القادمة.")) {
        db.closeShift();
        setShowShiftModal(false);
        alert("تم إغلاق الوردية بنجاح. يرجى سحب تقرير Z-Report");
    }
  };

  if (!report) return null;

  const maxAmount = Math.max(...report.chartData.map((d: any) => d.amount), 100);

  return (
    <Layout active="/reports" setPage={setPage} onLogout={onLogout}>
      <div className="flex justify-between items-start mb-10">
        <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">لوحة التحكم الذكية</h1>
            <p className="text-gray-400 font-bold">مرحباً بك يا سيد نبيل، إليك أداء محلك اليوم.</p>
        </div>
        {report.shift && (
            <button 
                onClick={() => setShowShiftModal(true)}
                className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 border border-red-100 hover:bg-red-100 transition shadow-sm"
            >
                <LockClosedIcon className="w-6 h-6" /> إغلاق الوردية
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-700 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10"><BanknotesIcon className="w-64 h-64" /></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <p className="text-blue-200 font-bold text-sm uppercase tracking-widest mb-2">صافي الربح اليوم</p>
                        <h2 className="text-6xl font-black">{report.netProfit.toFixed(2)} <span className="text-2xl">₪</span></h2>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20">
                        <ArrowTrendingUpIcon className="w-10 h-10 text-green-400" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
                    <div><p className="text-xs text-blue-300 mb-1">المبيعات</p><p className="font-black">{report.todaySales.toFixed(0)} ₪</p></div>
                    <div><p className="text-xs text-blue-300 mb-1">المصاريف</p><p className="font-black text-red-300">{report.todayExpenses.toFixed(0)} ₪</p></div>
                    <div><p className="text-xs text-blue-300 mb-1">الديون</p><p className="font-black text-orange-300">{report.totalReceivables.toFixed(0)} ₪</p></div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border-2 border-purple-100 shadow-xl shadow-purple-50 flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-purple-600">
                <SparklesIcon className="w-6 h-6 animate-pulse" />
                <h3 className="font-black text-lg">توقعات AI للمخزون</h3>
            </div>
            <div className="flex-1 bg-purple-50/50 rounded-[2rem] p-6 text-sm font-bold text-purple-900 leading-relaxed italic">
                "{forecast}"
            </div>
            <p className="text-[10px] text-purple-300 mt-4 text-center font-black">يتم التحديث بناءً على سرعة البيع</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] p-8 border shadow-sm">
            <h3 className="font-black text-xl mb-8 flex items-center gap-2"><ChartPieIcon className="w-6 h-6 text-blue-600" /> مبيعات آخر 7 أيام</h3>
            <div className="flex items-end justify-between h-48 gap-2">
                {report.chartData.map((d: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                            className="w-full bg-blue-100 rounded-t-xl group-hover:bg-blue-600 transition-all duration-500 relative"
                            style={{ height: `${(d.amount / maxAmount) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition">{d.amount} ₪</div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">{d.date}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border shadow-sm">
            <h3 className="font-black text-xl mb-6 flex items-center gap-2"><ExclamationCircleIcon className="w-6 h-6 text-red-600" /> أصناف ستنفد قريباً</h3>
            <div className="space-y-3">
                {report.expiringSoon.length > 0 ? report.expiringSoon.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm"><CubeIcon className="w-5 h-5" /></div>
                            <span className="font-black text-gray-800">{p.name}</span>
                        </div>
                        <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-black">{p.stock_quantity} قطعة</span>
                    </div>
                )) : (
                    <div className="text-center py-10 text-gray-300 font-bold">جميع الأصناف متوفرة بكميات جيدة ✅</div>
                )}
            </div>
        </div>
      </div>

      {showShiftModal && report.shift && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in border-t-[10px] border-red-600">
                  <h3 className="text-2xl font-black mb-8 text-center text-red-600">تقرير إغلاق الوردية (Z)</h3>
                  
                  <div className="space-y-4 mb-10 text-right">
                      <div className="flex justify-between border-b pb-2"><span>الرصيد الافتتاحي:</span><span className="font-black">{report.shift.openingBalance.toFixed(2)} ₪</span></div>
                      <div className="flex justify-between border-b pb-2"><span>صافي المبيعات (كاش):</span><span className="font-black text-green-600">{report.shift.netMovement.toFixed(2)} ₪</span></div>
                      <div className="flex justify-between text-xl pt-4 font-black"><span>الكاش المتوقع بالدرج:</span><span className="text-blue-700">{report.shift.expectedCash.toFixed(2)} ₪</span></div>
                  </div>

                  <div className="flex flex-col gap-3">
                      <button onClick={handleCloseShift} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-lg">تأكيد الإغلاق والتصفير</button>
                      <button onClick={() => window.print()} className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"><PrinterIcon className="w-5 h-5" /> طباعة تقرير الجرد</button>
                      <button onClick={() => setShowShiftModal(false)} className="w-full py-2 text-gray-400 font-bold">إلغاء</button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default DashboardPage;
