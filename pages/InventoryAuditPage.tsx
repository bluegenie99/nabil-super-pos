
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Scanner from '../components/Scanner';
import { db } from '../services/db';
import { InventoryAudit, Product } from '../types';
import { 
  QrCodeIcon, ArrowPathIcon, CheckCircleIcon, 
  ExclamationTriangleIcon, TrashIcon, CalculatorIcon,
  PlayIcon, XMarkIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';

const InventoryAuditPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [audit, setAudit] = useState<InventoryAudit | null>(db.getAuditSession());
  const [showScanner, setShowScanner] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [manualQty, setManualQty] = useState<{id: string, qty: number} | null>(null);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
        setAudit(db.getAuditSession());
        setProducts(db.getProducts());
    });
    return unsubscribe;
  }, []);

  const handleStart = () => {
    const newAudit = db.startAudit();
    setAudit(newAudit);
  };

  const handleScan = (barcode: string) => {
    setShowScanner(false);
    const p = products.find(prod => prod.barcode === barcode);
    if (p) {
        setManualQty({ id: p.id, qty: 1 });
    } else {
        alert("منتج غير موجود في القاعدة");
    }
  };

  const handleUpdateItem = (productId: string, qty: number) => {
    db.updateAuditItem(productId, qty);
    setManualQty(null);
  };

  const handleCommit = () => {
    if (confirm("هل أنت متأكد من تحديث كميات المخزن بناءً على هذا الجرد؟ لا يمكن التراجع.")) {
        db.commitAudit();
        alert("تم تحديث المخزون بنجاح!");
        setAudit(null);
    }
  };

  const handleCancel = () => {
    if (confirm("سيتم حذف مسودة الجرد الحالية. هل أنت متأكد؟")) {
        db.cancelAudit();
        setAudit(null);
    }
  };

  const totalLoss = audit?.items.reduce((acc, item) => acc + item.loss_value, 0) || 0;

  if (!audit) {
    return (
      <Layout active="/audit" setPage={setPage} onLogout={onLogout}>
        <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                <CalculatorIcon className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-4">بدء جرد جديد</h1>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">
                استخدم نظام الجرد لمطابقة الكميات الفعلية على الرفوف مع ما هو مسجل في النظام.
                سيقوم النظام بحساب العجز المالي الناتج عن أي نقص في البضاعة.
            </p>
            <button 
                onClick={handleStart}
                className="bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition"
            >
                ابدأ عملية الجرد الآن
            </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="/audit" setPage={setPage} onLogout={onLogout}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-black text-gray-900">جلسة الجرد الحالية</h1>
           <p className="text-sm text-gray-400 font-bold">تاريخ البدء: {new Date(audit.date).toLocaleString('ar-EG')}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleCancel} className="flex-1 md:flex-none px-6 py-4 rounded-2xl bg-gray-100 text-gray-500 font-black hover:bg-red-50 hover:text-red-600 transition">إلغاء الجرد</button>
            <button onClick={handleCommit} className="flex-1 md:flex-none px-10 py-4 rounded-2xl bg-green-600 text-white font-black shadow-xl shadow-green-100 active:scale-95 transition">اعتماد وتحديث المخزن</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-4 rounded-3xl border shadow-sm flex gap-4">
                <button 
                    onClick={() => setShowScanner(true)}
                    className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition"
                >
                    <QrCodeIcon className="w-7 h-7" />
                </button>
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="ابحث عن منتج لإضافته للجرد.." 
                        className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition font-bold" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute right-4 top-4.5 w-6 h-6 text-gray-400" />
                    
                    {search && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in duration-200">
                            {products.filter(p => p.name.includes(search) || p.barcode.includes(search)).slice(0, 5).map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => { setManualQty({ id: p.id, qty: p.stock_quantity }); setSearch(''); }}
                                    className="w-full p-4 flex justify-between items-center hover:bg-blue-50 text-right border-b"
                                >
                                    <span className="font-bold">{p.name}</span>
                                    <span className="text-blue-600 font-black">{p.stock_quantity} قطعة</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-right min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-50 border-b text-sm font-black text-gray-500 uppercase tracking-tighter">
                            <th className="p-6">المنتج</th>
                            <th className="p-6 text-center">المسجل بالنظام</th>
                            <th className="p-6 text-center">الموجود فعلياً</th>
                            <th className="p-6 text-center">الفرق</th>
                            <th className="p-6 text-center">تكلفة العجز</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {audit.items.map(item => (
                            <tr key={item.product_id} className="hover:bg-blue-50/20 transition">
                                <td className="p-6 font-black text-gray-900">{item.product_name}</td>
                                <td className="p-6 text-center font-bold text-gray-500">{item.expected}</td>
                                <td className="p-6 text-center">
                                    <button onClick={() => setManualQty({id: item.product_id, qty: item.actual})} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-black">{item.actual}</button>
                                </td>
                                <td className="p-6 text-center">
                                    <span className={`font-black ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                                        {item.difference > 0 ? '+' : ''}{item.difference}
                                    </span>
                                </td>
                                <td className="p-6 text-center font-black text-red-600">
                                    {item.loss_value > 0 ? `-${item.loss_value.toFixed(2)} ₪` : '0.00 ₪'}
                                </td>
                            </tr>
                        ))}
                        {audit.items.length === 0 && (
                            <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-bold opacity-50">لم يتم مسح أي منتج بعد..</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-10"><CalculatorIcon className="w-40 h-40" /></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">إجمالي العجز المالي</h3>
                <div className="text-4xl font-black text-red-400">{totalLoss.toFixed(2)} ₪</div>
                <p className="text-[10px] mt-4 text-gray-500 font-bold uppercase">بناءً على أسعار الشراء للأصناف المسجلة</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                    تعليمات الجرد
                </h3>
                <ul className="text-xs font-bold text-gray-500 space-y-3 leading-relaxed">
                    <li>1. امسح باركود المنتج بالكاميرا أو ابحث عنه.</li>
                    <li>2. أدخل الكمية التي وجدتها "بالفعل" على الرف.</li>
                    <li>3. سيظهر لك النظام الفرق فوراً باللون الأحمر أو الأخضر.</li>
                    <li>4. عند الضغط على "اعتماد"، سيتم تصفير الفروقات وتعديل المخزن ليتطابق مع الواقع.</li>
                </ul>
            </div>
        </div>
      </div>

      {showScanner && <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {manualQty && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-300 border-t-[10px] border-blue-600">
                  <h3 className="text-xl font-black mb-1 text-gray-900">{products.find(p => p.id === manualQty.id)?.name}</h3>
                  <p className="text-gray-400 font-bold text-xs mb-8 uppercase tracking-widest">كمية الجرد الفعلية</p>
                  
                  <input 
                    type="number" 
                    autoFocus
                    className="w-full text-center text-5xl font-black p-6 bg-blue-50 text-blue-700 border-2 border-transparent rounded-3xl outline-none focus:border-blue-500"
                    value={manualQty.qty}
                    onFocus={e => e.target.select()}
                    onChange={e => setManualQty({...manualQty, qty: Number(e.target.value)})}
                  />

                  <div className="flex gap-4 mt-8">
                      <button 
                        onClick={() => handleUpdateItem(manualQty.id, manualQty.qty)}
                        className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black active:scale-95 transition"
                      >
                        تحديث
                      </button>
                      <button onClick={() => setManualQty(null)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-bold">إلغاء</button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default InventoryAuditPage;
