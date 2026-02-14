
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Scanner from '../components/Scanner';
import { db } from '../services/db';
import { aiService } from '../services/aiService';
import { CartItem, Product, Customer, Sale } from '../types';
import { 
    PlusIcon, MinusIcon, TrashIcon, QrCodeIcon, 
    ShoppingCartIcon, PrinterIcon, MagnifyingGlassIcon, 
    ChevronUpIcon, ChevronDownIcon, PlayIcon, 
    MicrophoneIcon, SparklesIcon, GiftIcon,
    CheckCircleIcon, XMarkIcon, StarIcon
} from '@heroicons/react/24/solid';

const POSPage: React.FC<any> = ({ setPage, onLogout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paidNow, setPaidNow] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isShiftOpen, setIsShiftOpen] = useState(db.getRawStore().currentShift?.isOpen ?? false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const settings = db.getSettings();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setCustomers(db.getCustomers());
    const unsubscribe = db.subscribe((store: any) => {
        setIsShiftOpen(store.currentShift?.isOpen ?? false);
        setCustomers(store.customers);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F2') {
            document.getElementById('pos-search-input')?.focus();
            e.preventDefault();
        }
        if (e.key === 'F4') {
            setIsCheckoutExpanded(true);
            document.getElementById('paid-now-input')?.focus();
            e.preventDefault();
        }
        if (e.key === 'Enter' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
             document.getElementById('pos-search-input')?.focus();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        unsubscribe();
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (search.trim().length > 1) {
      const allProducts = db.getProducts();
      const exactMatch = allProducts.find(p => p.barcode === search.trim());
      if (exactMatch) {
          addToCart(exactMatch);
          setSearch('');
          return;
      }
      setSearchResults(allProducts.filter(p => p.name.includes(search) || p.barcode.includes(search)).slice(0, 6));
    } else setSearchResults([]);
  }, [search]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      const allProducts = db.getProducts();
      const match = allProducts.find(p => p.barcode === search.trim() || p.name === search.trim());
      if (match) {
        addToCart(match);
        setSearch('');
      } else if (searchResults.length === 1) {
        addToCart(searchResults[0]);
        setSearch('');
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    try {
        const sale = db.createSale({
            items: cart,
            discount: discount,
            paidNow: paidNow || total,
            customerId: selectedCustomerId,
            pointsRedeemed: pointsToRedeem
        });
        setLastSale(sale);
        setShowReceipt(true);
        resetPOS();
    } catch (error: any) {
        alert(error.message);
    }
  };

  const resetPOS = () => {
    setCart([]);
    setDiscount(0);
    setPaidNow(0);
    setSelectedCustomerId('');
    setPointsToRedeem(0);
    setIsCheckoutExpanded(false);
    setSearch('');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
          return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, originalPrice: product.sell_price, discountedPrice: product.sell_price }];
    });
    setSearch('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
          return { ...item, quantity: Math.max(0.1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const subtotal = cart.reduce((acc, item) => acc + (item.discountedPrice * item.quantity), 0);
  const pointsDiscountValue = pointsToRedeem / 10;
  const total = Math.max(0, subtotal - discount - pointsDiscountValue);
  const remaining = Math.max(0, total - paidNow);
  const pointsEarned = Math.floor(total / 10);
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  return (
    <Layout active="/pos" setPage={setPage} onLogout={onLogout}>
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] relative">
        {!isShiftOpen && (
            <div className="absolute inset-0 z-[60] bg-gray-50/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
                <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-sm border-2 border-blue-50">
                    <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-100"><PlayIcon className="w-12 h-12" /></div>
                    <h3 className="text-3xl font-black mb-2 text-gray-900">افتح الوردية</h3>
                    <p className="text-gray-400 font-bold mb-8 text-sm">أدخل مبلغ الكاش الموجود بالدرج حالياً</p>
                    <input autoFocus type="number" className="w-full p-6 bg-gray-50 border-2 rounded-3xl text-4xl font-black text-center mb-8 outline-none focus:border-blue-500" value={openingBalance} onChange={e => setOpeningBalance(Number(e.target.value))} />
                    <button onClick={() => db.startShift(openingBalance)} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition">بدء العمل اليوم</button>
                </div>
            </div>
        )}

        <div className="z-40 bg-white p-4 border-b flex gap-3 items-center">
            <div className="relative flex-1">
                <input id="pos-search-input" type="text" placeholder="ابحث بالاسم أو الباركود.." className="w-full p-5 pr-12 rounded-3xl border-2 border-gray-50 focus:border-blue-600 outline-none shadow-sm font-bold text-lg" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyPress} />
                <MagnifyingGlassIcon className="absolute right-4 top-5 w-6 h-6 text-gray-300" />
            </div>
            <button onClick={() => setShowScanner(true)} className="p-5 bg-blue-600 text-white rounded-3xl shadow-lg active:scale-90 transition"><QrCodeIcon className="w-8 h-8" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 pb-44">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-5"><ShoppingCartIcon className="w-48 h-48" /></div>
            ) : cart.map(item => (
                <div key={item.product.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between gap-5 animate-in slide-in-from-right">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-800 text-xl truncate">{item.product.name}</h4>
                        <span className="text-blue-600 font-black text-2xl">{(item.discountedPrice * item.quantity).toFixed(2)} ₪</span>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-2 text-gray-400 hover:text-red-500"><MinusIcon className="w-6 h-6" /></button>
                        <span className="font-black w-10 text-center text-xl">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-2 text-gray-400 hover:text-green-500"><PlusIcon className="w-6 h-6" /></button>
                        <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="p-2 text-red-200 hover:text-red-600"><TrashIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            ))}
        </div>

        <div className={`fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t-4 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 z-50 rounded-t-[3.5rem] px-10 pt-8 pb-10 ${isCheckoutExpanded ? 'h-[90vh]' : 'h-[170px]'}`}>
            <button onClick={() => setIsCheckoutExpanded(!isCheckoutExpanded)} className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-10 bg-white border-t-4 border-x-4 rounded-t-full flex items-center justify-center text-gray-300">{isCheckoutExpanded ? <ChevronDownIcon className="w-8 h-8" /> : <ChevronUpIcon className="w-8 h-8" />}</button>

            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <span className="text-gray-400 font-bold block text-sm">إجمالي الفاتورة (F4)</span>
                        <span className="text-5xl font-black text-blue-700">{total.toFixed(2)} ₪</span>
                    </div>
                    {selectedCustomerId && (
                        <div className="text-left bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100 flex items-center gap-2">
                             <StarIcon className="w-5 h-5 text-purple-600" />
                             <div className="text-right">
                                <span className="block text-[10px] text-purple-400 font-black">سيكسب الزبون</span>
                                <span className="font-black text-purple-700">+{pointsEarned} نقطة</span>
                             </div>
                        </div>
                    )}
                </div>

                {isCheckoutExpanded && (
                    <div className="space-y-6 overflow-y-auto pb-10">
                        <div className="p-6 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100">
                            <label className="text-sm font-black text-gray-400 mb-3 block">الزبون ونقاط الولاء:</label>
                            <select className="w-full p-5 rounded-2xl bg-white border-2 border-transparent font-bold outline-none text-lg mb-4" value={selectedCustomerId} onChange={e => {setSelectedCustomerId(e.target.value); setPointsToRedeem(0);}}>
                                <option value="">-- زبون نقدي عام --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name} (رصيده: {c.points} نقطة)</option>)}
                            </select>
                            
                            {selectedCustomer && selectedCustomer.points > 0 && (
                                <div className="bg-purple-100 p-5 rounded-2xl flex items-center justify-between border-2 border-purple-200">
                                    <div>
                                        <p className="font-black text-purple-900">استبدال نقاط الزبون؟</p>
                                        <p className="text-[10px] font-bold text-purple-600">كل 10 نقاط = 1 شيكل خصم</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" max={selectedCustomer.points} className="w-20 p-2 rounded-xl text-center font-black outline-none border-2 border-purple-300" value={pointsToRedeem} onChange={e => setPointsToRedeem(Math.min(selectedCustomer.points, Number(e.target.value)))} />
                                        <span className="font-bold text-purple-700">نقطة</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div><label className="text-xs font-black text-gray-400 block mb-2">خصم يدوي:</label><input type="number" className="w-full p-5 bg-red-50 text-red-600 border rounded-2xl font-black text-2xl text-center" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
                            <div><label className="text-xs font-black text-gray-400 block mb-2">المدفوع كاش:</label><input id="paid-now-input" type="number" className="w-full p-5 bg-green-50 text-green-700 border rounded-2xl font-black text-2xl text-center" value={paidNow} onChange={e => setPaidNow(Number(e.target.value))} /></div>
                        </div>

                        {remaining > 0 && (
                            <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-3xl flex justify-between items-center"><span className="text-orange-700 font-black text-xl">دين متبقي:</span><span className="text-3xl font-black text-orange-700">{remaining.toFixed(2)} ₪</span></div>
                        )}
                    </div>
                )}

                <div className="mt-auto flex gap-4">
                    <button disabled={cart.length === 0} onClick={handleCheckout} className="flex-1 py-6 bg-blue-600 text-white rounded-3xl font-black text-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition disabled:opacity-50"><PrinterIcon className="w-8 h-8" /> تنفيذ العملية</button>
                    {!isCheckoutExpanded && cart.length > 0 && <button onClick={() => setIsCheckoutExpanded(true)} className="px-10 py-6 bg-gray-100 text-gray-600 rounded-3xl font-black text-lg">تفاصيل</button>}
                </div>
            </div>
        </div>
      </div>

      {showReceipt && lastSale && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in text-center">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircleIcon className="w-14 h-14" /></div>
                  <h3 className="text-3xl font-black mb-1">تمت العملية!</h3>
                  <p className="text-gray-400 font-bold mb-10">فاتورة رقم: #{lastSale.invoice_no}</p>
                  
                  {lastSale.points_earned && lastSale.points_earned > 0 && (
                      <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 mb-6 flex items-center justify-center gap-2">
                        <StarIcon className="w-5 h-5 text-purple-600" />
                        <span className="font-black text-purple-700">رصيد نقاط جديد: +{lastSale.points_earned}</span>
                      </div>
                  )}

                  <div className="bg-gray-50 p-8 rounded-3xl mb-10 text-right space-y-3 font-bold text-lg">
                      <div className="flex justify-between border-b pb-3"><span>الإجمالي:</span><span>{lastSale.total_amount.toFixed(2)} ₪</span></div>
                      <div className="flex justify-between text-green-600"><span>المدفوع كاش:</span><span>{lastSale.paid_now.toFixed(2)} ₪</span></div>
                  </div>

                  <div className="flex flex-col gap-4">
                      <button onClick={() => window.print()} className="bg-blue-600 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3"><PrinterIcon className="w-6 h-6" /> طباعة الوصل</button>
                      <button onClick={() => {setShowReceipt(false); setLastSale(null);}} className="bg-gray-900 text-white py-5 rounded-3xl font-black">فاتورة جديدة</button>
                  </div>
              </div>
          </div>
      )}

      {showScanner && <Scanner onScan={(b) => {
          const p = db.getProductByBarcode(b);
          if (p) { addToCart(p); setShowScanner(false); }
          else alert("منتج غير معرف!");
      }} onClose={() => setShowScanner(false)} />}
    </Layout>
  );
};

export default POSPage;
