-- Migration para adicionar opções dinâmicas de produtos

CREATE TABLE IF NOT EXISTS product_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS option_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para as novas tabelas (permitir leitura pública, e edição para auth.users)
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_options_read_all" ON product_options FOR SELECT USING (true);
CREATE POLICY "product_options_write_auth" ON product_options FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "option_values_read_all" ON option_values FOR SELECT USING (true);
CREATE POLICY "option_values_write_auth" ON option_values FOR ALL USING (auth.role() = 'authenticated');
