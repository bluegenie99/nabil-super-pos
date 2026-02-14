
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { db } from '../services/db';
import { Customer } from '../types';
import { UserCircleIcon, PlusIcon, XMarkIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, PencilSquareIcon, ReceiptPercentIcon, StarIcon } from '@heroicons/react/24/outline';
import { PageProps } from '../App';
import { SHOP_CONFIG } from '../config';

const CustomersPage: React.FC<PageProps> = ({ setPage, onLogout }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showPayModal, setShowPayModal] = useState<Customer | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState<Partial<Customer> | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountNotes, setDiscountNotes] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');

  const refresh = () => setCustomers(db.getCustomers());
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (showAddModal) {
      setNewName(showAddModal.name || '');
      setNewPhone(showAddModal.phone || '');
      setNewWhatsapp(showAddModal.whatsapp || '');
    }
  }, [showAddModal]);

  const openWhatsapp = (number: string, text: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePayment = () => {
    if (!showPayModal) return;
    try {
      const oldBalance = showPayModal.balance;
      db.payDebt(showPayModal.id, payAmount);
      const newBalance = oldBalance - payAmount;
      
      if (showPayModal.whatsapp) {
        const msg = `*${SHOP_CONFIG.name}* 🏪\n\n` +
                    `✅ تم استلام مبلغ: *${payAmount.toFixed(2)} ${SHOP_CONFIG.currency_symbol}*\n` +
                    `الرصيد السابق: ${oldBalance.toFixed(2)} ${SHOP_CONFIG.currency_symbol}\n` +
                    `*الرصيد المتبقي الحالي: ${newBalance.toFixed(2)} ${SHOP_CONFIG.currency_symbol}*\n\n` +
                    `شكراً لثقتكم بنا.\n` +
                    `_ ${SHOP_CONFIG.whatsapp_footer} _`;
        
        setTimeout(() => openWhatsapp(showPayModal.whatsapp!, msg), 500);
      }

      alert('تم استلام المبلغ بنجاح!');
      refresh(); setShowPayModal(null); setPayAmount(0);
    } catch (err: any) { alert(err.message); }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    db.addCustomer({
      id: showAddModal?.id,
      name: newName,
      phone: newPhone,
      whatsapp: newWhatsapp
    });
    setShowAddModal(null);
    setNewName('');
    setNewPhone('');
    setNewWhatsapp('');
    refresh();
  };

  return (
    <Layout active="/customers" setPage={setPage} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-black text-gray-900">الزبائن والولاء</h1>
           <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{SHOP_CONFIG.name}</p>
        </div>
        <button onClick={() => setShowAddModal({})} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-100 transition active:scale-95">
            <PlusIcon className="w-5 h-5" /> زبون جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {customers.map(customer => (
          <div key={customer.id} className="bg-white rounded-[2.5rem] p-8 border shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            
            {/* بطاقة النقاط في الخلفية */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
               <StarIcon className="w-32 h-32 text-purple-600" />
            </div>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <UserCircleIcon className="w-10 h-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-xl text-gray-900 truncate">{customer.name}</h3>
                <p className="text-gray-400 font-bold text-xs truncate uppercase tracking-widest">{customer.phone || 'بدون هاتف'}</p>
              </div>
              <div className="flex gap-1">
                  <button onClick={() => setShowAddModal(customer)} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition shadow-sm border border-gray-100"><PencilSquareIcon className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 block mb-1">الرصيد المتبقي</span>
                    <p className={`text-xl font-black ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{Number(customer.balance).toFixed(2)} ₪</p>
                </div>
                <div className="p-5 bg-purple-50 rounded-3xl border border-purple-100">
                    <span className="text-[10px] font-black text-purple-400 block mb-1">نقاط الولاء</span>
                    <p className="text-xl font-black text-purple-600">{customer.points || 0} ⭐</p>
                </div>
            </div>
            
            <div className="flex gap-2 relative z-10">
              {Number(customer.balance) > 0 && (
                <button onClick={() => { setShowPayModal(customer); setPayAmount(Number(customer.balance)); }} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-50 active:scale-95 transition">تسديد دين</button>
              )}
              {customer.whatsapp && (
                <button onClick={() => openWhatsapp(customer.whatsapp!, `مرحباً ${customer.name}`)} className="p-4 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition shadow-sm border border-green-100"><ChatBubbleLeftRightIcon className="w-6 h-6" /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveCustomer} className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black mb-10 text-center">{showAddModal.id ? 'تعديل بيانات زبون' : 'إضافة زبون جديد'}</h3>
            <div className="space-y-6">
                <input required autoFocus className="w-full p-5 bg-gray-50 rounded-2xl font-black text-xl outline-none focus:bg-white border-2 border-transparent focus:border-blue-100" value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم الزبون" />
                <input className="w-full p-5 bg-gray-50 rounded-2xl font-black outline-none focus:bg-white border-2 border-transparent focus:border-blue-100" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="رقم الهاتف" />
                <input className="w-full p-5 bg-green-50 text-green-800 rounded-2xl font-black outline-none focus:bg-white border-2 border-transparent focus:border-green-100" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} placeholder="واتساب (مثلاً 970595083591)" />
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-xl active:scale-95 transition mt-4">حفظ البيانات</button>
                <button type="button" onClick={() => setShowAddModal(null)} className="w-full py-2 text-gray-400 font-bold">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in duration-300 border-t-[10px] border-green-600">
            <h3 className="text-2xl font-black mb-2">تسديد حساب</h3>
            <p className="text-gray-400 font-bold mb-8">{showPayModal.name}</p>
            <input type="number" className="w-full text-center text-4xl font-black p-6 bg-green-50 text-green-700 border-2 border-green-200 rounded-3xl outline-none mb-8" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} />
            <div className="flex gap-4">
              <button onClick={handlePayment} className="flex-1 bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition">تأكيد واستلام</button>
              <button onClick={() => setShowPayModal(null)} className="flex-1 bg-gray-100 text-gray-500 font-black py-5 rounded-2xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CustomersPage;
