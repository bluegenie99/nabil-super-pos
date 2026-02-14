
export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
}

export interface ShopSettings {
  name: string;
  phone: string;
  address: string;
  currency: string;
  currency_symbol: string;
  vat_percent: number;
  logo_url?: string;
  whatsapp_footer: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  purchase_price: number;
  sell_price: number;
  stock_quantity: number;
  alert_threshold: number;
  show_in_catalog?: boolean;
  expiry_date?: string;
  promo?: Promotion;
}

export interface Promotion {
  type: 'buy_x_get_y' | 'percent_discount';
  buy_qty: number;
  get_qty: number;
  discount_percent?: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  notes: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  balance: number;
  points: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
  promoApplied?: string;
}

export interface Sale {
  id: string;
  invoice_no: number;
  customer_id?: string;
  total_amount: number;
  discount_amount: number;
  vat_amount: number;
  points_redeemed?: number;
  points_earned?: number;
  paid_now: number;
  remaining_due: number;
  created_at: string;
  user_id?: string;
  user_name?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_sell_price: number;
  unit_cost_price: number;
  line_total: number;
  line_profit: number;
}

export interface Shift {
  isOpen: boolean;
  openingBalance: number;
  startTime: string | null;
  openedBy?: string;
}

export interface Report {
  todaySales: number;
  todayCashIn: number;
  todayProfit: number;
  todayExpenses: number;
  netProfit: number;
  totalReceivables: number;
  totalPayables: number;
  expiringSoon: Product[];
  shift?: {
    openingBalance: number;
    expectedCash: number;
    netMovement: number;
    startTime: string | null;
  };
  topProducts: {name: string, qty: number}[];
  chartData: {date: string, amount: number}[];
}

export interface InventoryAudit {
  id: string;
  date: string;
  items: AuditItem[];
  status: 'draft' | 'committed';
}

export interface AuditItem {
  product_id: string;
  product_name: string;
  expected: number;
  actual: number;
  difference: number;
  loss_value: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

export interface PurchaseInvoice {
  id: string;
  supplier_id: string;
  total_amount: number;
  paid_amount: number;
  date: string;
  items: {
    product_id: string;
    quantity: number;
    cost_price: number;
  }[];
}
