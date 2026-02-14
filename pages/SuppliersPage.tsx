
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Supplier, Product } from '../types';
import { 
    TruckIcon, PlusIcon, XMarkIcon, 
    PencilSquareIcon, WalletIcon, DocumentPlusIcon,
    MagnifyingGlassIcon, ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { PageProps } from '../App';
import { SHOP_CONFIG } from '../config';

const SuppliersPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddSupplier, setShowAddSupplier] = useState<Partial<Supplier> | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState<Supplier | null>(null);
  const [showPayModal, setShowPayModal] = useState<Supplier | null>(null);

  // حالة فاتورة الشراء
  const [purchaseItems, setPurchaseItems] = useState<{product_id: string, quantity: number, cost_price: number}[]>([]);
  const [paidInInvoice, setPaidInInvoice] = useState(0);
  const [searchProduct, setSearchProduct] = useState('');
  
  const [payAmount, setPayAmount] = useState(0);

  const refresh = () => {
    setSuppliers(db.getSuppliers());
    setProducts(db.getProducts());
  };

  useEffect(() => {
    refresh();
    return db.subscribe(() => refresh());
  }, []);

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddSupplier?.name) return;
    db.addSupplier(showAddSupplier);
    setShowAddSupplier(null);
  };

  const handleAddPurchase = () => {
    if (!showPurchaseModal || purchaseItems.length === 0) return;
    const total = purchaseItems.reduce((a, b) => a + (b.quantity * b.cost_price), 0);
    db.addPurchaseInvoice({
      supplier_id: showPurchaseModal.id,
      total_amount: total,
      paid_amount: paidInInvoice,
      date: new Date().toISOString(),
      items: purchaseItems
    });
    setShowPurchaseModal(null);
    setPurchaseItems([]);
    setPaidInInvoice(0);
    alert('تم تسجيل فاتورة المشتريات وزيادة المخزون بنجاح!');
  };

  const handlePayment = () => {
    if (!showPayModal || payAmount <= 0) return;
    db.paySupplier(showPayModal.id, payAmount);
    setShowPayModal(null);
    setPayAmount(0);
    alert('تم تسجيل الدفعة بنجاح!');
  };

  const filteredProducts = products.filter(p => p.name.includes(searchProduct) || p.barcode.includes(searchProduct)).slice(0, 5);

  return (
    <Layout active="/suppliers" setPage={setPage} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-black text-gray-900">إدارة الموردين</h1>
           <p className="text-sm text-gray-500 font-bold">متابعة حسابات الشركات والمشتريات</p>
        </div>
        <button 
            onClick={() => setShowAddSupplier({ name: '', phone: '', balance: 0 })}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl active:scale-95 transition"
        >
            <PlusIcon className="w-5 h-5" />
            مورد جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 shadow-sm hover:border-blue-500 transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                <TruckIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl text-gray-900">{supplier.name}</h3>
                <p className="text-gray-400 font-bold text-sm">{supplier.phone || 'بدون هاتف'}</p>
              </div>
              <button onClick={() => setShowAddSupplier(supplier)} className="p-2 text-gray-300 hover:text-blue-600 transition"><PencilSquareIcon className="w-6 h-6" /></button>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl mb-6">
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">المبلغ المطلوب من طرفك</span>
               <div className="text-3xl font-black text-red-600">{Number(supplier.balance).toFixed(2)} ₪</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setShowPurchaseModal(supplier)}
                 className="bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition"
               >
                 <DocumentPlusIcon className="w-5 h-5" /> فاتورة شراء
               </button>
               <button 
                 onClick={() => { setShowPayModal(supplier); setPayAmount(Number(supplier.balance)); }}
                 className="bg-green-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition"
               >
                 <WalletIcon className="w-5 h-5" /> تسديد رصيد
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* مودال مورد جديد */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleSaveSupplier} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 border-t-[10px] border-gray-900">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">بيانات المورد</h3>
                <button type="button" onClick={() => setShowAddSupplier(null)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
             </div>
             <div className="space-y-6">
                <input required placeholder="اسم الشركة / المورد" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-xl outline-none focus:border-blue-500" value={showAddSupplier.name} onChange={e => setShowAddSupplier({...showAddSupplier, name: e.target.value})} />
                <input placeholder="رقم الهاتف" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black outline-none focus:border-blue-500" value={showAddSupplier.phone} onChange={e => setShowAddSupplier({...showAddSupplier, phone: e.target.value})} />
                {!showAddSupplier.id && (
                  <div>
                    <label className="text-xs font-black text-gray-400 mb-2 block">الرصيد الافتتاحي (كم يريد منك الآن؟)</label>
                    <input type="number" className="w-full p-5 bg-red-50 text-red-600 border-2 border-transparent rounded-2xl font-black text-2xl outline-none focus:border-red-500" value={showAddSupplier.balance} onChange={e => setShowAddSupplier({...showAddSupplier, balance: Number(e.target.value)})} />
                  </div>
                )}
                <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition active:scale-95">حفظ البيانات</button>
             </div>
          </form>
        </div>
      )}

      {/* مودال فاتورة شراء */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-300 border-t-[10px] border-blue-600 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="text-2xl font-black text-gray-900">فاتورة شراء جديدة</h3>
                   <p className="text-blue-600 font-bold">المورد: {showPurchaseModal.name}</p>
                </div>
                <button type="button" onClick={() => {setShowPurchaseModal(null); setPurchaseItems([]);}}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
             </div>

             <div className="space-y-6">
                {/* البحث عن منتج لإضافته للفاتورة */}
                <div className="relative">
                   <input 
                    placeholder="ابحث عن منتج لإضافته.." 
                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" 
                    value={searchProduct}
                    onChange={e => setSearchProduct(e.target.value)}
                   />
                   {searchProduct && filteredProducts.length > 0 && (
                     <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl z-50 mt-2 overflow-hidden">
                        {filteredProducts.map(p => (
                          <button 
                            key={p.id} 
                            onClick={() => {
                                if (!purchaseItems.find(i => i.product_id === p.id)) {
                                    setPurchaseItems([...purchaseItems, { product_id: p.id, quantity: 1, cost_price: p.purchase_price }]);
                                }
                                setSearchProduct('');
                            }}
                            className="w-full p-4 hover:bg-blue-50 flex justify-between items-center text-right border-b last:border-0"
                          >
                             <span className="font-black text-gray-800">{p.name}</span>
                             <span className="text-blue-600 font-bold">{p.purchase_price} ₪</span>
                          </button>
                        ))}
                     </div>
                   )}
                </div>

                {/* قائمة الأصناف في الفاتورة */}
                <div className="space-y-3">
                   {purchaseItems.map((item, idx) => {
                       const p = products.find(prod => prod.id === item.product_id);
                       return (
                         <div key={item.product_id} className="bg-gray-50 p-4 rounded-2xl flex flex-wrap md:flex-nowrap items-center gap-4 border-2 border-gray-100">
                            <span className="flex-1 font-black text-gray-700">{p?.name}</span>
                            <div className="flex items-center gap-2">
                               <label className="text-[10px] font-black text-gray-400">الكمية:</label>
                               <input type="number" className="w-20 p-2 rounded-xl border font-black text-center" value={item.quantity} onChange={e => {
                                   const newItems = [...purchaseItems];
                                   newItems[idx].quantity = Number(e.target.value);
                                   setPurchaseItems(newItems);
                               }} />
                            </div>
                            <div className="flex items-center gap-2">
                               <label className="text-[10px] font-black text-gray-400">السعر:</label>
                               <input type="number" step="0.01" className="w-24 p-2 rounded-xl border font-black text-center text-blue-600" value={item.cost_price} onChange={e => {
                                   const newItems = [...purchaseItems];
                                   newItems[idx].cost_price = Number(e.target.value);
                                   setPurchaseItems(newItems);
                               }} />
                            </div>
                            <button onClick={() => setPurchaseItems(purchaseItems.filter(i => i.product_id !== item.product_id))} className="text-red-400 p-2"><XMarkIcon className="w-5 h-5" /></button>
                         </div>
                       );
                   })}
                </div>

                {/* ملخص الفاتورة */}
                <div className="bg-blue-50 p-8 rounded-[2.5rem] border-2 border-blue-100 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="font-black text-gray-500">إجمالي الفاتورة:</span>
                      <span className="text-3xl font-black text-blue-700">{purchaseItems.reduce((a, b) => a + (b.quantity * b.cost_price), 0).toFixed(2)} ₪</span>
                   </div>
                   <div className="pt-4 border-t border-blue-200">
                      <label className="text-xs font-black text-blue-600 mb-2 block uppercase">المبلغ المدفوع الآن (نقداً):</label>
                      <input type="number" className="w-full p-5 bg-white border-2 border-blue-200 rounded-2xl font-black text-2xl text-center outline-none" value={paidInInvoice} onChange={e => setPaidInInvoice(Number(e.target.value))} />
                      <p className="text-[10px] text-gray-400 mt-2 font-bold">المتبقي سيتم إضافته آلياً لديون المورد</p>
                   </div>
                </div>

                <button 
                  disabled={purchaseItems.length === 0}
                  onClick={handleAddPurchase} 
                  className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition disabled:opacity-50"
                >
                  تأكيد الفاتورة وزيادة المخزون
                </button>
             </div>
          </div>
        </div>
      )}

      {/* مودال تسديد رصيد */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300 border-t-[10px] border-green-600 text-center">
             <h3 className="text-2xl font-black mb-1">تسديد حساب مورد</h3>
             <p className="text-green-600 font-bold mb-8">{showPayModal.name}</p>
             <div className="mb-8">
                <label className="text-xs font-black text-gray-400 mb-2 block uppercase">المبلغ المدفوع:</label>
                <input type="number" className="w-full p-6 bg-green-50 text-green-700 border-2 border-green-200 rounded-3xl text-4xl font-black text-center outline-none" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
             </div>
             <div className="flex gap-4">
                <button onClick={handlePayment} className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition shadow-lg shadow-green-100">تأكيد الدفع</button>
                <button onClick={() => setShowPayModal(null)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-bold">إلغاء</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SuppliersPage;
