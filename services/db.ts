
import { Product, Customer, Sale, CartItem, SaleItem, Report, Shift, Supplier, PurchaseInvoice, User, Expense, InventoryAudit, AuditItem, ShopSettings } from '../types';

const STORAGE_KEY = 'superpos_v1_db';
const AUTH_KEY = 'superpos_auth_user';
const AUDIT_KEY = 'superpos_current_audit';

interface DBStore {
  settings: ShopSettings;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  users: User[];
  sales: Sale[];
  saleItems: SaleItem[];
  purchaseInvoices: PurchaseInvoice[];
  cashLedger: any[];
  expenses: Expense[];
  currentShift: Shift;
}

const DEFAULT_SETTINGS: ShopSettings = {
  name: "سوبر ماركت نبيل",
  phone: "+970595083591",
  address: "نابلس - الدوار الرئيسي",
  currency: "شيكل",
  currency_symbol: "₪",
  vat_percent: 0,
  logo_url: "/logo.png",
  whatsapp_footer: "هذا التقرير تم تصديره بشكل آلي من نظام إدارة سوبر ماركت نبيل."
};

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'المدير نبيل', pin: '1234', role: 'admin' },
  { id: 'u2', name: 'كاشير الموظف', pin: '0000', role: 'cashier' }
];

const getStore = (): DBStore => {
  const emptyStore: DBStore = {
    settings: DEFAULT_SETTINGS,
    products: [],
    customers: [{ id: '101', name: 'زبون نقدي عام', phone: '-', balance: 0, points: 0 }],
    suppliers: [],
    users: DEFAULT_USERS,
    sales: [],
    saleItems: [],
    purchaseInvoices: [],
    cashLedger: [],
    expenses: [],
    currentShift: { isOpen: false, openingBalance: 0, startTime: null }
  };

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return emptyStore;
    const parsed = JSON.parse(data);
    return {
      ...emptyStore,
      ...parsed,
      customers: parsed.customers?.map((c: any) => ({ ...c, points: c.points || 0 })) || emptyStore.customers
    };
  } catch (e) {
    return emptyStore;
  }
};

const saveStore = (store: DBStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  listeners.forEach(l => l(store));
};

let listeners: ((store: DBStore) => void)[] = [];

export const db = {
  subscribe: (listener: any) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },

  getRawStore: () => getStore(),
  getSettings: () => getStore().settings,
  updateSettings: (newSettings: ShopSettings) => {
    const store = getStore();
    store.settings = newSettings;
    saveStore(store);
  },

  getUsers: () => getStore().users,
  addUser: (user: Partial<User>) => {
    const store = getStore();
    const id = user.id || Math.random().toString(36).substr(2, 9);
    const newUser = { id, name: user.name!, pin: user.pin!, role: user.role || 'cashier' } as User;
    const idx = store.users.findIndex(u => u.id === id);
    if (idx !== -1) store.users[idx] = newUser;
    else store.users.push(newUser);
    saveStore(store);
  },

  // Fix: Added deleteUser method
  deleteUser: (id: string) => {
    const store = getStore();
    store.users = store.users.filter(u => u.id !== id);
    saveStore(store);
  },

  login: (userId: string, pin: string): User | null => {
    const store = getStore();
    const user = store.users.find(u => u.id === userId && u.pin === pin);
    if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        return user;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    try {
        const data = localStorage.getItem(AUTH_KEY);
        return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  logout: () => { localStorage.removeItem(AUTH_KEY); },
  isAdmin: () => db.getCurrentUser()?.role === 'admin',

  getProducts: () => getStore().products,
  getProductByBarcode: (barcode: string) => getStore().products.find(p => p.barcode === barcode),
  
  addProduct: (data: Partial<Product>) => {
    const store = getStore();
    const productId = data.id || Math.random().toString(36).substr(2, 9);
    const newProduct: Product = {
      id: productId,
      name: data.name || 'منتج جديد',
      barcode: data.barcode || '',
      purchase_price: Number(data.purchase_price) || 0,
      sell_price: Number(data.sell_price) || 0,
      stock_quantity: Number(data.stock_quantity) || 0,
      alert_threshold: Number(data.alert_threshold) || 5,
      show_in_catalog: data.show_in_catalog !== undefined ? data.show_in_catalog : true,
      promo: data.promo
    };
    const idx = store.products.findIndex(p => p.id === productId);
    if (idx !== -1) store.products[idx] = newProduct;
    else store.products.push(newProduct);
    saveStore(store);
    return newProduct;
  },

  getCustomers: () => getStore().customers,
  addCustomer: (data: Partial<Customer>) => {
    const store = getStore();
    const id = data.id || Math.random().toString(36).substr(2, 9);
    const newCustomer = { id, name: data.name || '', phone: data.phone || '', balance: data.balance || 0, points: data.points || 0, whatsapp: data.whatsapp };
    const idx = store.customers.findIndex(c => c.id === id);
    if (idx !== -1) store.customers[idx] = { ...store.customers[idx], ...data } as Customer;
    else store.customers.push(newCustomer as Customer);
    saveStore(store);
    return newCustomer;
  },

  // Fix: Added payDebt method
  payDebt: (customerId: string, amount: number) => {
    const store = getStore();
    const c = store.customers.find(cust => cust.id === customerId);
    if (c) {
      c.balance -= amount;
      store.cashLedger.push({ movement_type: 'debt_payment', amount: amount, ref_id: customerId, date: new Date().toISOString() });
      saveStore(store);
    }
  },

  // Fix: Added getSuppliers method
  getSuppliers: () => getStore().suppliers,
  // Fix: Added addSupplier method
  addSupplier: (data: Partial<Supplier>) => {
    const store = getStore();
    const id = data.id || Math.random().toString(36).substr(2, 9);
    const newSupplier = { id, name: data.name || '', phone: data.phone || '', balance: data.balance || 0 };
    const idx = store.suppliers.findIndex(s => s.id === id);
    if (idx !== -1) store.suppliers[idx] = { ...store.suppliers[idx], ...data } as Supplier;
    else store.suppliers.push(newSupplier as Supplier);
    saveStore(store);
    return newSupplier;
  },
  // Fix: Added paySupplier method
  paySupplier: (id: string, amount: number) => {
    const store = getStore();
    const s = store.suppliers.find(sup => sup.id === id);
    if (s) {
      s.balance -= amount;
      store.cashLedger.push({ movement_type: 'supplier_pay', amount: -amount, ref_id: id, date: new Date().toISOString() });
      saveStore(store);
    }
  },
  // Fix: Added addPurchaseInvoice method
  addPurchaseInvoice: (invoice: any) => {
    const store = getStore();
    store.purchaseInvoices.push(invoice);
    const supplier = store.suppliers.find(s => s.id === invoice.supplier_id);
    if (supplier) supplier.balance += (invoice.total_amount - invoice.paid_amount);
    
    invoice.items.forEach((item: any) => {
      const p = store.products.find(prod => prod.id === item.product_id);
      if (p) {
        p.stock_quantity += item.quantity;
        p.purchase_price = item.cost_price;
      }
    });

    if (invoice.paid_amount > 0) {
      store.cashLedger.push({ movement_type: 'purchase_cash_out', amount: -invoice.paid_amount, ref_id: invoice.supplier_id, date: invoice.date });
    }
    saveStore(store);
  },

  // Fix: Added getSales method
  getSales: () => getStore().sales,
  // Fix: Added getSaleItems method
  getSaleItems: (saleId?: string) => {
    if (saleId) return getStore().saleItems.filter(si => si.sale_id === saleId);
    return getStore().saleItems;
  },

  createSale: (data: { items: CartItem[], discount: number, paidNow: number, customerId?: string, pointsRedeemed?: number }) => {
    const store = getStore();
    const user = db.getCurrentUser();
    const saleId = Math.random().toString(36).substr(2, 9);
    const invoiceNo = store.sales.length > 0 ? Math.max(...store.sales.map(s => s.invoice_no)) + 1 : 1001;
    
    const pointsValue = (data.pointsRedeemed || 0) / 10;
    const subtotal = data.items.reduce((acc, item) => acc + (item.discountedPrice * item.quantity), 0);
    const totalAmount = Math.max(0, subtotal - data.discount - pointsValue);
    const remainingDue = Math.max(0, totalAmount - data.paidNow);

    const pointsEarned = Math.floor(totalAmount / 10);

    const sale: Sale = {
      id: saleId, invoice_no: invoiceNo, customer_id: data.customerId,
      total_amount: totalAmount, discount_amount: data.discount, vat_amount: 0,
      paid_now: data.paidNow, remaining_due: remainingDue, created_at: new Date().toISOString(),
      user_name: user?.name, points_redeemed: data.pointsRedeemed, points_earned: pointsEarned
    };

    store.sales.push(sale);
    data.items.forEach(item => {
      const lineTotal = item.discountedPrice * item.quantity;
      store.saleItems.push({
        id: Math.random().toString(36).substr(2, 9), sale_id: saleId, product_id: item.product.id,
        product_name: item.product.name, quantity: item.quantity, unit_sell_price: item.discountedPrice,
        unit_cost_price: item.product.purchase_price, line_total: lineTotal, 
        line_profit: lineTotal - (item.product.purchase_price * item.quantity)
      });
      const p = store.products.find(prod => prod.id === item.product.id);
      if (p) p.stock_quantity -= item.quantity;
    });

    if (data.customerId) {
      const customer = store.customers.find(c => c.id === data.customerId);
      if (customer) {
        customer.balance += remainingDue;
        if (data.pointsRedeemed) customer.points -= data.pointsRedeemed;
        customer.points += pointsEarned;
      }
    }

    if (data.paidNow > 0) store.cashLedger.push({ movement_type: 'sale_cash_in', amount: data.paidNow, ref_id: saleId, date: sale.created_at });
    saveStore(store);
    return sale;
  },

  // Fix: Added undoLastSale method
  undoLastSale: (saleId: string) => {
    const store = getStore();
    const saleIdx = store.sales.findIndex(s => s.id === saleId);
    if (saleIdx === -1) return;
    const sale = store.sales[saleIdx];
    
    const items = store.saleItems.filter(si => si.sale_id === saleId);
    items.forEach(item => {
      const p = store.products.find(prod => prod.id === item.product_id);
      if (p) p.stock_quantity += item.quantity;
    });

    if (sale.customer_id) {
      const c = store.customers.find(cust => cust.id === sale.customer_id);
      if (c) {
        c.balance -= sale.remaining_due;
        if (sale.points_earned) c.points -= sale.points_earned;
        if (sale.points_redeemed) c.points += sale.points_redeemed;
      }
    }

    store.sales.splice(saleIdx, 1);
    store.saleItems = store.saleItems.filter(si => si.sale_id !== saleId);
    store.cashLedger = store.cashLedger.filter(l => l.ref_id !== saleId);
    saveStore(store);
  },

  // Fix: Added createReturn method
  createReturn: (saleId: string, itemsToReturn: {productId: string, qty: number}[], method: 'cash' | 'reduce_due') => {
    const store = getStore();
    const sale = store.sales.find(s => s.id === saleId);
    if (!sale) return;

    itemsToReturn.forEach(ret => {
      const si = store.saleItems.find(i => i.sale_id === saleId && i.product_id === ret.productId);
      if (!si) return;
      
      const refundValue = (si.unit_sell_price * ret.qty);
      
      const p = store.products.find(prod => prod.id === ret.productId);
      if (p) p.stock_quantity += ret.qty;

      if (method === 'cash') {
        store.cashLedger.push({ movement_type: 'return_cash_out', amount: -refundValue, ref_id: saleId, date: new Date().toISOString() });
      } else if (method === 'reduce_due' && sale.customer_id) {
        const c = store.customers.find(cust => cust.id === sale.customer_id);
        if (c) c.balance -= refundValue;
      }
    });
    saveStore(store);
  },

  // Fix: Added addExpense method
  addExpense: (amount: number, category: string, notes: string) => {
    const store = getStore();
    const exp = { id: Math.random().toString(36).substr(2, 9), amount, category, notes, date: new Date().toISOString() };
    store.expenses.push(exp);
    store.cashLedger.push({ movement_type: 'expense', amount: -amount, ref_id: exp.id, date: exp.date });
    saveStore(store);
  },

  // Fix: Enhanced getReport method with missing fields (todayExpenses, chartData, etc.)
  getReport: (): Report => {
    const store = getStore();
    const today = new Date().toISOString().split('T')[0];
    const todaySales = store.sales.filter(s => s.created_at.startsWith(today)).reduce((a, s) => a + s.total_amount, 0);
    const todayExpenses = store.expenses.filter(e => e.date.startsWith(today)).reduce((a, e) => a + e.amount, 0);
    const todayProfit = store.saleItems
      .filter(si => store.sales.find(s => s.id === si.sale_id)?.created_at.startsWith(today))
      .reduce((a, si) => a + si.line_profit, 0);
    
    const chartData = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const daySales = store.sales.filter(s => s.created_at.startsWith(dayStr)).reduce((a, s) => a + s.total_amount, 0);
        return { date: dayStr, amount: daySales };
    }).reverse();

    return {
      todaySales, todayProfit, todayExpenses, todayCashIn: 0,
      netProfit: todayProfit - todayExpenses,
      totalReceivables: store.customers.reduce((a, c) => a + Number(c.balance), 0),
      totalPayables: store.suppliers.reduce((a, s) => a + Number(s.balance), 0),
      expiringSoon: store.products.filter(p => p.stock_quantity <= p.alert_threshold),
      topProducts: [], chartData, 
      shift: store.currentShift.isOpen ? {
        openingBalance: store.currentShift.openingBalance,
        expectedCash: Number(store.currentShift.openingBalance) + store.cashLedger.filter(l => l.date >= (store.currentShift.startTime || '')).reduce((a, l) => a + l.amount, 0),
        netMovement: store.cashLedger.filter(l => l.date >= (store.currentShift.startTime || '') && l.movement_type === 'sale_cash_in').reduce((a, l) => a + l.amount, 0),
        startTime: store.currentShift.startTime
      } : undefined
    };
  },

  // Fix: Added getAuditSession method
  getAuditSession: (): InventoryAudit | null => {
    const data = localStorage.getItem(AUDIT_KEY);
    return data ? JSON.parse(data) : null;
  },
  // Fix: Added startAudit method
  startAudit: () => {
    const audit: InventoryAudit = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), items: [], status: 'draft' };
    localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
    return audit;
  },
  // Fix: Added updateAuditItem method
  updateAuditItem: (productId: string, actual: number) => {
    const audit = db.getAuditSession();
    if (!audit) return;
    const store = getStore();
    const p = store.products.find(prod => prod.id === productId);
    if (!p) return;

    const idx = audit.items.findIndex(i => i.product_id === productId);
    const item: AuditItem = {
      product_id: productId,
      product_name: p.name,
      expected: p.stock_quantity,
      actual: actual,
      difference: actual - p.stock_quantity,
      loss_value: (actual - p.stock_quantity < 0) ? Math.abs(actual - p.stock_quantity) * p.purchase_price : 0
    };

    if (idx !== -1) audit.items[idx] = item;
    else audit.items.push(item);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
    listeners.forEach(l => l(store));
  },
  // Fix: Added commitAudit method
  commitAudit: () => {
    const audit = db.getAuditSession();
    if (!audit) return;
    const store = getStore();
    audit.items.forEach(item => {
      const p = store.products.find(prod => prod.id === item.product_id);
      if (p) p.stock_quantity = item.actual;
    });
    localStorage.removeItem(AUDIT_KEY);
    saveStore(store);
  },
  // Fix: Added cancelAudit method
  cancelAudit: () => {
    localStorage.removeItem(AUDIT_KEY);
  },

  // Fix: Added updateFromCloud method
  updateFromCloud: (data: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    listeners.forEach(l => l(data));
  },

  startShift: (balance: number) => {
    const store = getStore();
    store.currentShift = { isOpen: true, openingBalance: balance, startTime: new Date().toISOString(), openedBy: db.getCurrentUser()?.name };
    saveStore(store);
  },
  closeShift: () => {
    const store = getStore();
    store.currentShift.isOpen = false;
    saveStore(store);
  }
};
