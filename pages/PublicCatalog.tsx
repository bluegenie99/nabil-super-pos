
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, Customer } from '../types';
import { SHOP_CONFIG } from '../config';
import { 
  ShoppingBagIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon, 
  TagIcon, MapPinIcon, UserIcon, StarIcon, XMarkIcon,
  WalletIcon, ArrowRightOnRectangleIcon, UserPlusIcon
} from '@heroicons/react/24/outline';

const PublicCatalog: React.FC<{ onLoginRedirect: () => void }> = ({ onLoginRedirect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showPortal, setShowPortal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // لنموذج الدخول/التسجيل
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [portalError, setPortalError] = useState('');

  useEffect(() => {
    setProducts(db.getProducts().filter(p => p.show_in_catalog !== false));
  }, []);

  const handlePortalCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const c = db.getCustomers().find(cust => cust.phone === customerPhone || cust.whatsapp?.includes(customerPhone));
    if (c) {
      setFoundCustomer(c);
      setPortalError('');
      setIsRegistering(false);
    } else {
      setPortalError('هذا الرقم غير مسجل لدينا حالياً.');
      setIsRegistering(true); // عرض خيار التسجيل إذا لم يوجد الرقم
    }
  };

  const handleSelfRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;
    
    const newCustomer = db.addCustomer({
      name: customerName,
      phone: customerPhone,
      whatsapp: customerPhone.startsWith('970') || customerPhone.startsWith('972') ? customerPhone : `970${customerPhone.replace(/^0/, '')}`,
      balance: 0,
      points: 0
    });
    
    setFoundCustomer(newCustomer);
    setIsRegistering(false);
    setPortalError('');
  };

  const addToCart = (p: Product) => setCart(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
  const removeFromCart = (p: Product) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[p.id] > 1) updated[p.id] -= 1;
      else delete updated[p.id];
      return updated;
    });
  };

  const totalItems = (Object.values(cart) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-['Cairo']" dir="rtl">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <StarIcon className="w-64 h-64 absolute -top-10 -left-10" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-2xl shadow-lg w-12 h-12 flex items-center justify-center text-blue-600 font-black">N</div>
              <div>
                <h1 className="text-xl font-black">{SHOP_CONFIG.name}</h1>
                <p className="text-[10px] opacity-80 flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> {SHOP_CONFIG.shop_address}</p>
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowPortal(true)} className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition flex items-center gap-2 border border-white/10">
                    <UserIcon className="w-5 h-5" />
                    <span className="text-xs font-black">حسابي</span>
                </button>
                <button onClick={onLoginRedirect} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition"><ArrowRightOnRectangleIcon className="w-5 h-5" /></button>
            </div>
          </div>
          
          <div className="bg-yellow-400/20 backdrop-blur-md rounded-3xl p-5 border border-yellow-400/30 flex items-center gap-4">
             <div className="bg-yellow-400 p-3 rounded-2xl text-blue-900 shadow-lg shadow-yellow-400/20 animate-pulse"><StarIcon className="w-6 h-6" /></div>
             <div className="flex-1">
                <p className="text-sm font-black text-yellow-50">انضم لبرنامج الولاء مجاناً</p>
                <p className="text-[10px] text-blue-100 font-bold leading-relaxed">سجل رقمك الآن، اجمع النقاط، واحصل على خصومات حقيقية عند كل شراء من السوبر ماركت!</p>
             </div>
          </div>

          <div className="relative mt-8">
            <input type="text" placeholder="ماذا تبحث عن اليوم؟" className="w-full p-5 pr-14 rounded-[2rem] border-none text-gray-900 outline-none shadow-2xl font-black text-lg focus:ring-4 focus:ring-blue-500/20 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
            <MagnifyingGlassIcon className="absolute right-5 top-5 w-7 h-7 text-gray-300" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><TagIcon className="w-6 h-6 text-blue-600" /> قائمة المنتجات</h2>
            <div className="bg-blue-50 px-4 py-2 rounded-xl text-[10px] font-black text-blue-600 border border-blue-100">الأسعار تشمل الضريبة</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.filter(p => p.name.includes(search)).map(p => (
            <div key={p.id} className="bg-white p-5 rounded-[2.5rem] border-2 border-transparent shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative">
               <h4 className="font-black text-gray-800 mb-2 truncate text-lg group-hover:text-blue-600 transition-colors">{p.name}</h4>
               <p className="text-2xl text-blue-600 font-black mb-6">{p.sell_price.toFixed(2)} ₪</p>
               {cart[p.id] ? (
                 <div className="flex items-center bg-blue-600 rounded-full p-1 gap-2 border-2 border-blue-500 shadow-lg animate-in zoom-in">
                   <button onClick={() => removeFromCart(p)} className="w-10 h-10 bg-white/20 text-white rounded-full font-black shadow-sm hover:bg-white/30">-</button>
                   <span className="flex-1 text-center font-black text-white">{cart[p.id]}</span>
                   <button onClick={() => addToCart(p)} className="w-10 h-10 bg-white/20 text-white rounded-full font-black shadow-sm hover:bg-white/30">+</button>
                 </div>
               ) : (
                 <button onClick={() => addToCart(p)} className="w-full bg-gray-900 text-white py-4 rounded-full text-xs font-black shadow-lg active:scale-95 transition-all hover:bg-blue-600">إضافة للسلة</button>
               )}
            </div>
          ))}
        </div>
      </div>

      {/* بوابة الزبون */}
      {showPortal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
             <button onClick={() => {setShowPortal(false); setFoundCustomer(null); setIsRegistering(false); setPortalError('');}} className="absolute top-8 left-8 p-2 text-gray-400 hover:text-gray-900 transition"><XMarkIcon className="w-7 h-7" /></button>
             
             {!foundCustomer && !isRegistering && (
               <>
                 <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-50 rounded-[2.2rem] flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-inner"><UserIcon className="w-10 h-10" /></div>
                    <h3 className="text-2xl font-black">رصيدك ونقاطك</h3>
                    <p className="text-gray-400 font-bold text-sm">أدخل رقم جوالك لمعرفة رصيدك</p>
                 </div>
                 <form onSubmit={handlePortalCheck} className="space-y-6">
                    <input autoFocus type="tel" className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-3xl text-center text-2xl font-black outline-none focus:border-blue-600 transition" placeholder="05XXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    {portalError && <p className="text-red-500 text-xs font-black text-center">{portalError}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition">عرض بياناتي</button>
                 </form>
               </>
             )}

             {isRegistering && !foundCustomer && (
                <div className="animate-in fade-in duration-300">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-green-50 rounded-[2.2rem] flex items-center justify-center mx-auto mb-4 text-green-600 shadow-inner"><UserPlusIcon className="w-10 h-10" /></div>
                        <h3 className="text-2xl font-black">تسجيل جديد</h3>
                        <p className="text-gray-400 font-bold text-sm">انضم الآن لتبدأ بجمع النقاط!</p>
                    </div>
                    <form onSubmit={handleSelfRegister} className="space-y-4">
                        <input required placeholder="اسمك الكامل" className="w-full p-5 bg-gray-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-green-500" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        <input disabled className="w-full p-5 bg-gray-100 rounded-2xl font-black text-lg text-center opacity-50" value={customerPhone} />
                        <button type="submit" className="w-full bg-green-600 text-white py-6 rounded-3xl font-black text-lg shadow-xl shadow-green-100 active:scale-95 transition">تأكيد التسجيل</button>
                        <button type="button" onClick={() => setIsRegistering(false)} className="w-full py-2 text-gray-400 font-bold text-xs uppercase">رجوع</button>
                    </form>
                </div>
             )}

             {foundCustomer && (
               <div className="animate-in zoom-in duration-300">
                  <div className="text-center mb-8">
                     <h3 className="text-3xl font-black text-gray-900 mb-1">{foundCustomer.name}</h3>
                     <div className="inline-block bg-blue-50 px-4 py-1 rounded-full text-[10px] text-blue-600 font-black uppercase tracking-widest">زبون دائم</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-purple-50 p-6 rounded-[2.5rem] border-2 border-purple-100 text-center shadow-sm">
                        <StarIcon className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                        <span className="text-[10px] font-black text-purple-400 block uppercase">نقاط الولاء</span>
                        <span className="text-3xl font-black text-purple-700">{foundCustomer.points}</span>
                     </div>
                     <div className="bg-red-50 p-6 rounded-[2.5rem] border-2 border-red-100 text-center shadow-sm">
                        <WalletIcon className="w-10 h-10 text-red-600 mx-auto mb-2" />
                        <span className="text-[10px] font-black text-red-400 block uppercase">ديون متبقية</span>
                        <span className="text-3xl font-black text-red-700">{foundCustomer.balance.toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="mt-8 p-6 bg-blue-600 rounded-[2rem] text-center text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                     <StarIcon className="absolute -right-5 -bottom-5 w-24 h-24 opacity-10" />
                     <p className="text-xs font-black mb-1 relative z-10">نظام الخصومات الذكي</p>
                     <p className="text-[10px] opacity-80 relative z-10 leading-relaxed">أخبر الكاشير بوجود نقاط لديك عند الدفع لتحصل على خصم فوري!</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalog;
