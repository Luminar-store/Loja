-- Migração para transição suave de relacionamento de categorias
-- Substitui o vínculo frágil por nome (products.category) por ID forte (products.category_id)

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Backfill: Vincular produtos existentes às suas categorias pelo nome (compatibilidade com legado)
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category = c.name AND p.category_id IS NULL;
