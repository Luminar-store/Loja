-- Migration para adicionar pedidos personalizados
CREATE TABLE IF NOT EXISTS custom_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  model TEXT,
  length TEXT,
  thickness TEXT,
  material TEXT,
  notes TEXT,
  reference_image TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Allow insert from anywhere (public)
CREATE POLICY "custom_orders_insert_public" ON custom_orders FOR INSERT WITH CHECK (true);

-- Allow select only for authenticated users (admin)
CREATE POLICY "custom_orders_select_auth" ON custom_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "custom_orders_update_auth" ON custom_orders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "custom_orders_delete_auth" ON custom_orders FOR DELETE USING (auth.role() = 'authenticated');
