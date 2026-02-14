
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Scanner from '../components/Scanner';
import { db } from '../services/db';
import { Product, Promotion } from '../types';
import { 
    MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, XMarkIcon, 
    QrCodeIcon, TrashIcon, ArrowDownOnSquareIcon,
    ShoppingCartIcon, MinusIcon, GlobeAltIcon, 
    SparklesIcon, PrinterIcon, TagIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';
import { SHOP_CONFIG } from '../config';

const ProductsPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState<Partial<Product> | null>(null);
  const [showScannerInModal, setShowScannerInModal] = useState(false);
  const [printLabel, setPrintLabel] = useState<Product | null>(null);
  const isAdmin = db.isAdmin();

  const refresh = () => setProducts(db.getProducts());
  useEffect(() => { refresh(); return db.subscribe(() => refresh()); }, []);

  const handlePrintLabel = (product: Product) => {
    const printArea = document.getElementById('receipt-print-area');
    if (!printArea) return;
    printArea.innerHTML = `
      <div style="width: 50mm; height: 30mm; border: 1px solid #000; padding: 10px; text-align: center; font-family: 'Cairo', sans-serif; direction: rtl; display: flex; flex-direction: column; justify-content: center;">
        <div style="font-size: 8px; font-weight: bold;">${SHOP_CONFIG.name}</div>
        <div style="font-size: 14px; font-weight: 900; margin: 5px 0;">${product.name}</div>
        <div style="font-size: 18px; font-weight: 900;">${product.sell_price.toFixed(2)} ₪</div>
        <div style="font-family: monospace; font-size: 10px; margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">* ${product.barcode} *</div>
      </div>
    `;
    window.print();
  };

  const filtered = products.filter(p => p.name.includes(search) || p.barcode.includes(search));

  return (
    <Layout active="/products" setPage={setPage} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-black text-gray-900">المخزن</h1><p className="text-sm text-gray-500 font-bold tracking-tight">إدارة الأصناف والباركود والعروض</p></div>
        {isAdmin && <button onClick={() => setShowModal({ name: '', barcode: '', purchase_price: 0, sell_price: 0, stock_quantity: 0, show_in_catalog: true })} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 active:scale-95 transition"><PlusIcon className="w-6 h-6" />إضافة صنف</button>}
      </div>

      <div className="bg-white p-3 rounded-3xl border shadow-sm mb-6 flex gap-4">
          <div className="relative flex-1">
            <input type="text" placeholder="ابحث باسم المنتج أو الباركود.." className="w-full p-4 pr-12 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={search} onChange={e => setSearch(e.target.value)} />
            <MagnifyingGlassIcon className="absolute right-4 top-4 w-6 h-6 text-gray-300" />
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-right min-w-[800px]">
          <thead><tr className="bg-gray-50 border-b text-gray-500 text-xs font-black uppercase tracking-widest"><th className="p-6">المنتج</th><th className="p-6 text-center">سعر البيع</th><th className="p-6 text-center">المخزن</th><th className="p-6 text-center">العرض النشط</th><th className="p-6 text-center">إجراءات</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(product => (
              <tr key={product.id} className="hover:bg-blue-50/20 transition">
                <td className="p-6"><p className="font-black text-gray-800 text-lg">{product.name}</p><p className="text-[10px] font-mono text-gray-400">{product.barcode}</p></td>
                <td className="p-6 text-center font-black text-blue-700 text-xl">{product.sell_price.toFixed(2)} ₪</td>
                <td className="p-6 text-center"><span className={`px-4 py-2 rounded-xl font-black ${product.stock_quantity <= product.alert_threshold ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{product.stock_quantity}</span></td>
                <td className="p-6 text-center">
                    {product.promo ? (
                        <span className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1"><SparklesIcon className="w-3 h-3" /> {product.promo.type === 'buy_x_get_y' ? `عرض ${product.promo.buy_qty}+${product.promo.get_qty}` : `خصم ${product.promo.discount_percent}%`}</span>
                    ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="p-6 text-center">
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => handlePrintLabel(product)} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition" title="طباعة باركود"><PrinterIcon className="w-5 h-5" /></button>
                        {isAdmin && <button onClick={() => setShowModal(product)} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition"><PencilSquareIcon className="w-5 h-5" /></button>}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); db.addProduct(showModal); setShowModal(null); }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border-t-[12px] border-blue-600 animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black mb-10">بيانات الصنف والعروض</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <input required placeholder="اسم المنتج.." className="col-span-full p-5 bg-gray-50 rounded-2xl font-black" value={showModal.name} onChange={e => setShowModal({...showModal, name: e.target.value})} />
                <div className="relative">
                  <input placeholder="الباركود" className="w-full p-5 bg-gray-50 rounded-2xl font-black pr-14" value={showModal.barcode} onChange={e => setShowModal({...showModal, barcode: e.target.value})} />
                  <button type="button" onClick={() => setShowScannerInModal(true)} className="absolute right-4 top-4 p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition">
                      <QrCodeIcon className="w-6 h-6" />
                  </button>
                </div>
                <input type="number" step="0.01" placeholder="سعر البيع" className="p-5 bg-blue-50 text-blue-700 rounded-2xl font-black" value={showModal.sell_price} onChange={e => setShowModal({...showModal, sell_price: Number(e.target.value)})} />
            </div>

            <div className="p-6 bg-purple-50 rounded-[2rem] border-2 border-purple-100 mb-8">
                <h4 className="font-black text-purple-700 flex items-center gap-2 mb-4"><SparklesIcon className="w-5 h-5" /> نظام العروض والخصومات الذكي</h4>
                <div className="grid grid-cols-2 gap-4">
                    <select className="col-span-full p-4 rounded-xl border-none outline-none font-bold" value={showModal.promo?.type || ''} onChange={e => setShowModal({...showModal, promo: e.target.value ? { type: e.target.value as any, buy_qty: 0, get_qty: 0 } : undefined})}>
                        <option value="">-- بدون عرض حالياً --</option>
                        <option value="buy_x_get_y">عرض الكميات (اشتري X واحصل على Y)</option>
                        <option value="percent_discount">خصم نسبة مئوية (%)</option>
                    </select>
                    {showModal.promo?.type === 'buy_x_get_y' && (
                        <>
                            <input type="number" placeholder="اشتري كم؟" className="p-4 rounded-xl" value={showModal.promo.buy_qty} onChange={e => setShowModal({...showModal, promo: {...showModal.promo!, buy_qty: Number(e.target.value)}})} />
                            <input type="number" placeholder="واحصل على كم مجاناً؟" className="p-4 rounded-xl" value={showModal.promo.get_qty} onChange={e => setShowModal({...showModal, promo: {...showModal.promo!, get_qty: Number(e.target.value)}})} />
                        </>
                    )}
                    {showModal.promo?.type === 'percent_discount' && (
                        <input type="number" placeholder="نسبة الخصم %" className="col-span-full p-4 rounded-xl" value={showModal.promo.discount_percent} onChange={e => setShowModal({...showModal, promo: {...showModal.promo!, discount_percent: Number(e.target.value)}})} />
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black shadow-xl">حفظ المنتج</button>
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {showScannerInModal && (
        <Scanner 
          onScan={(barcode) => {
            if (showModal) setShowModal({ ...showModal, barcode });
            setShowScannerInModal(false);
          }} 
          onClose={() => setShowScannerInModal(false)} 
        />
      )}
    </Layout>
  );
};

export default ProductsPage;
