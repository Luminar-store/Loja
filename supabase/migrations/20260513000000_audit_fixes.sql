-- Update products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_made_to_order boolean DEFAULT false;

-- Create product images table
CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    url text NOT NULL,
    position integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup policies
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Imagens visiveis publicamente" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins podem inserir imagens" ON public.product_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins podem atualizar imagens" ON public.product_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins podem deletar imagens" ON public.product_images FOR DELETE USING (auth.role() = 'authenticated');
