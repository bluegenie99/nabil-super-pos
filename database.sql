
-- Database Schema for SuperPOS V1
-- Designed for Ledger-based accounting (Cash / AR / Inventory / Profit)

-- 1. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sell_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    alert_threshold DECIMAL(12,2) DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_products_barcode ON products(barcode);

-- 2. Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sales Table (Header)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no SERIAL UNIQUE,
    customer_id UUID REFERENCES customers(id),
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    paid_now DECIMAL(12,2) NOT NULL,
    remaining_due DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- 4. Sale Items (Details)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(12,2) NOT NULL,
    unit_sell_price DECIMAL(12,2) NOT NULL,
    unit_cost_price DECIMAL(12,2) NOT NULL, -- Captured at time of sale
    line_total DECIMAL(12,2) NOT NULL,
    line_profit DECIMAL(12,2) NOT NULL
);

-- 5. Cash Ledger (Cash movements)
CREATE TYPE cash_movement_type AS ENUM ('sale_cash_in', 'debt_payment_in', 'refund_cash_out', 'expense_cash_out');
CREATE TABLE cash_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_type cash_movement_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    ref_id UUID NOT NULL, -- Can be sale_id, return_id, or payment_id
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Accounts Receivable Ledger (Customer Debts)
CREATE TYPE ar_movement_type AS ENUM ('sale_due', 'payment', 'return_reduce_due', 'credit_issue', 'credit_use');
CREATE TABLE ar_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) NOT NULL,
    movement_type ar_movement_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Positive for debt increase, negative for decrease
    ref_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Inventory Ledger
CREATE TYPE inventory_movement_type AS ENUM ('sale_out', 'return_in', 'adjustment', 'waste_out', 'purchase_in');
CREATE TABLE inventory_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) NOT NULL,
    movement_type inventory_movement_type NOT NULL,
    quantity DECIMAL(12,2) NOT NULL, -- Positive for addition, negative for reduction
    ref_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Returns
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_method TEXT NOT NULL, -- 'cash', 'reduce_due', 'credit'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(12,2) NOT NULL,
    unit_sell_price DECIMAL(12,2) NOT NULL,
    unit_cost_price DECIMAL(12,2) NOT NULL
);

-- Constraints
ALTER TABLE sales ADD CONSTRAINT chk_paid_remaining CHECK (paid_now + remaining_due = total_amount - discount_amount);
ALTER TABLE sales ADD CONSTRAINT chk_due_customer CHECK (remaining_due = 0 OR customer_id IS NOT NULL);
