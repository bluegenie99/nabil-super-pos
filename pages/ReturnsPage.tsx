
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Sale, SaleItem, Product } from '../types';
import { MagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { PageProps } from '../App';
import { SHOP_CONFIG } from '../config';

const ReturnsPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<'cash' | 'reduce_due'>('cash');

  const handleSearch = () => {
    const allSales = db.getSales();
    const found = allSales.find(s => s.invoice_no === Number(invoiceNo));
    if (found) {
      setSale(found);
      setItems(db.getSaleItems(found.id));
      setProducts(db.getProducts());
      setSelectedItems({});
    } else { alert('عذراً، الفاتورة غير موجودة'); }
  };

  const toggleItem = (productId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[productId]) delete newItems[productId];
      else newItems[productId] = maxQty;
      return newItems;
    });
  };

  const handleReturn = () => {
    if (!sale) return;
    const returnPayload = Object.entries(selectedItems).map(([productId, qty]) => ({ productId, qty: qty as number }));
    if (returnPayload.length === 0) return alert('يرجى اختيار أصناف للإرجاع أولاً');
    try {
      db.createReturn(sale.id, returnPayload, refundMethod);
      alert('تمت عملية الإرجاع بنجاح');
      setSale(null); setItems([]); setInvoiceNo('');
    } catch (err: any) { alert(err.message); }
  };

  const totalRefund = Object.entries(selectedItems).reduce((acc, [pid, qty]) => {
    const item = items.find(i => i.product_id === pid);
    if (!item) return acc;
    return acc + (item.line_total / item.quantity) * (qty as number);
  }, 0);

  return (
    <Layout active="/returns" setPage={setPage} onLogout={onLogout}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">مرتجعات المبيعات</h1>
        <div className="flex gap-2 max-w-md">
          <input type="number" placeholder="أدخل رقم الفاتورة.." className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition shadow-lg shadow-blue-100"><MagnifyingGlassIcon className="w-5 h-5" />بحث</button>
        </div>
      </div>

      {sale ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold border-b pb-3 mb-4 flex justify-between">
              <span>محتويات الفاتورة #{sale.invoice_no}</span>
              <span className="text-gray-400 text-sm">{new Date(sale.created_at).toLocaleDateString('ar-EG')}</span>
            </h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.product_id} className={`flex items-center justify-between p-4 rounded-xl border transition ${selectedItems[item.product_id] ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded" checked={!!selectedItems[item.product_id]} onChange={() => toggleItem(item.product_id, item.quantity)} />
                    <div>
                      <p className="font-bold text-gray-800">{products.find(p => p.id === item.product_id)?.name}</p>
                      <p className="text-xs text-gray-400">الكمية المباعة: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="font-bold text-blue-600">{(item.line_total / item.quantity).toFixed(2)} {SHOP_CONFIG.currency_symbol}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="font-bold border-b pb-3">ملخص الإرجاع</h3>
              <div className="p-6 bg-blue-50 rounded-2xl text-center">
                <p className="text-sm text-blue-600 mb-1">المبلغ المرتجع الإجمالي</p>
                <div className="text-3xl font-black text-blue-700">{totalRefund.toFixed(2)} <span className="text-sm font-bold">{SHOP_CONFIG.currency_symbol}</span></div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-3 text-center">طريقة إعادة المبلغ:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setRefundMethod('cash')} className={`py-3 rounded-xl font-bold border transition ${refundMethod === 'cash' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-400 border-gray-200'}`}>نقداً</button>
                  <button disabled={!sale.customer_id} onClick={() => setRefundMethod('reduce_due')} className={`py-3 rounded-xl font-bold border transition ${refundMethod === 'reduce_due' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-400 border-gray-200'} ${!sale.customer_id && 'opacity-20 cursor-not-allowed'}`}>تقليل دين</button>
                </div>
                {!sale.customer_id && <p className="text-[10px] text-red-400 mt-2 text-center">لا يمكن تقليل الدين لزبون غير مسجل</p>}
              </div>
            </div>

            <button onClick={handleReturn} disabled={totalRefund === 0} className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-50 disabled:grayscale">
              <ArrowPathIcon className="w-6 h-6" /> تأكيد الإرجاع للمخزن
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 p-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400"><CheckCircleIcon className="w-16 h-16 mb-4 opacity-20" /><p>قم بالبحث عن رقم فاتورة للبدء في عملية الإرجاع</p></div>
      )}
    </Layout>
  );
};

export default ReturnsPage;
