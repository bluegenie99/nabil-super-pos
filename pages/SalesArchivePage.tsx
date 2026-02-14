
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Sale, SaleItem } from '../types';
import { 
  MagnifyingGlassIcon, PrinterIcon, TrashIcon, 
  ReceiptReflectionIcon, CalendarIcon, UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';
import { SHOP_CONFIG } from '../config';

const SalesArchivePage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    setSales(db.getSales().reverse());
  }, []);

  const handleShowDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setSaleItems(db.getSaleItems(sale.id));
  };

  const handleVoid = (saleId: string) => {
    if (confirm("هل أنت متأكد من إلغاء هذه الفاتورة؟ سيتم إرجاع البضاعة للمخزن وخصم المبلغ من الحسابات.")) {
      try {
        db.undoLastSale(saleId);
        setSales(db.getSales().reverse());
        setSelectedSale(null);
        alert("تم إلغاء الفاتورة بنجاح");
      } catch (err: any) { alert(err.message); }
    }
  };

  const filtered = sales.filter(s => 
    s.invoice_no.toString().includes(search) || 
    (s.user_name && s.user_name.includes(search))
  );

  return (
    <Layout active="/archive" setPage={setPage} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">أرشيف المبيعات</h1>
          <p className="text-sm text-gray-500 font-bold">مراجعة الفواتير والعمليات السابقة</p>
        </div>
        <div className="relative w-64">
           <input 
            type="text" 
            placeholder="بحث برقم الفاتورة.." 
            className="w-full p-3 pr-10 rounded-xl border-none bg-white shadow-sm font-bold"
            value={search}
            onChange={e => setSearch(e.target.value)}
           />
           <MagnifyingGlassIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(sale => (
          <div 
            key={sale.id} 
            onClick={() => handleShowDetails(sale)}
            className="bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-black">#{sale.invoice_no}</span>
              <span className="text-[10px] text-gray-400 font-bold">{new Date(sale.created_at).toLocaleString('ar-EG')}</span>
            </div>
            <div className="mb-4">
                <p className="text-2xl font-black text-gray-900">{sale.total_amount.toFixed(2)} ₪</p>
                <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                    <UserIcon className="w-3 h-3" />
                    <span>البائع: {sale.user_name || 'غير معروف'}</span>
                </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
               <span className={`text-[10px] font-black uppercase ${sale.remaining_due > 0 ? 'text-red-500' : 'text-green-500'}`}>
                 {sale.remaining_due > 0 ? 'يوجد دين' : 'مدفوعة بالكامل'}
               </span>
               <PrinterIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition" />
            </div>
          </div>
        ))}
      </div>

      {selectedSale && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
              <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                 <div>
                    <h3 className="font-black text-xl">تفاصيل فاتورة #{selectedSale.invoice_no}</h3>
                    <p className="text-xs text-gray-400">{new Date(selectedSale.created_at).toLocaleString('ar-EG')}</p>
                 </div>
                 <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-white/10 rounded-full transition"><XMarkIcon className="w-6 h-6" /></button>
              </div>
              
              <div className="p-8 max-h-[60vh] overflow-y-auto">
                 <table className="w-full text-right mb-8">
                    <thead className="text-xs text-gray-400 font-black border-b">
                       <tr><th className="pb-2">الصنف</th><th className="pb-2 text-center">الكمية</th><th className="pb-2 text-left">السعر</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {saleItems.map(item => (
                         <tr key={item.id}><td className="py-3 font-bold">{item.product_name}</td><td className="py-3 text-center">{item.quantity}</td><td className="py-3 text-left font-black">{item.line_total.toFixed(2)}</td></tr>
                       ))}
                    </tbody>
                 </table>

                 <div className="bg-gray-50 p-6 rounded-2xl space-y-2">
                    <div className="flex justify-between text-sm font-bold"><span>المجموع:</span><span>{selectedSale.total_amount.toFixed(2)} ₪</span></div>
                    {selectedSale.discount_amount > 0 && <div className="flex justify-between text-sm font-bold text-red-500"><span>الخصم:</span><span>-{selectedSale.discount_amount.toFixed(2)} ₪</span></div>}
                    <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-200 text-blue-600"><span>الإجمالي الصافي:</span><span>{selectedSale.total_amount.toFixed(2)} ₪</span></div>
                 </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex gap-3">
                 <button className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"><PrinterIcon className="w-5 h-5" /> طباعة</button>
                 {db.isAdmin() && <button onClick={() => handleVoid(selectedSale.id)} className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition"><TrashIcon className="w-5 h-5" /> إلغاء الفاتورة</button>}
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default SalesArchivePage;
