import { z } from 'zod';

// Validação de CEP brasileiro
const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().length(8, 'CEP deve ter 8 dígitos'));

// Validação de telefone brasileiro
const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().min(10, 'Telefone inválido').max(11, 'Telefone inválido'));

// Schema do cliente
const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  phone: phoneSchema,
});

// Schema do endereço
const shippingAddressSchema = z.object({
  cep: cepSchema,
  street: z.string().min(3, 'Endereço inválido').max(200),
  number: z.string().min(1, 'Número obrigatório').max(20),
  complement: z.string().max(100).optional().default(''),
  neighborhood: z.string().max(100).optional().default(''),
  city: z.string().max(100).optional().default(''),
  state: z.string().max(2).optional().default(''),
});

// Schema de item do carrinho
const cartItemSchema = z.object({
  id: z.string().uuid('ID de produto inválido'),
  quantity: z.number().int().min(1, 'Quantidade mínima: 1').max(99, 'Quantidade máxima: 99'),
  options: z
    .array(
      z.object({
        option_id: z.string(),
        option_name: z.string(),
        value_id: z.string(),
        value_name: z.string(),
        price_modifier: z.number().default(0),
      })
    )
    .optional()
    .default([]),
});

// Schema do frete selecionado
const shippingSchema = z.object({
  id: z.string().or(z.number()),
  name: z.string(),
  price: z.union([z.string(), z.number()]).transform(Number),
  delivery_time: z.union([z.string(), z.number()]).transform(Number).optional(),
});

// Schema completo do checkout
export const checkoutSchema = z.object({
  cartItems: z.array(cartItemSchema).min(1, 'Carrinho vazio'),
  customer: customerSchema,
  shipping: shippingSchema,
  shippingAddress: shippingAddressSchema,
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
