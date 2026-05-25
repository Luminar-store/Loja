'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ProductRow } from '@/services/product.service';
import { SelectedOption } from '@/types/product-options';

export interface CartItem extends ProductRow {
  cartItemId: string;
  quantity: number;
  selectedOptions?: SelectedOption[];
}

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: ProductRow, selectedOptions?: SelectedOption[]) => void;
  removeFromCart: (cartItemId: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedCart = localStorage.getItem('@luminar:cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCartItems(parsed);
        } catch (e) {
          console.error('Error parsing cart from localStorage', e);
        }
      }
      setIsClient(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('@luminar:cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isClient]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addToCart = useCallback((product: ProductRow, selectedOptions?: SelectedOption[]) => {
    setCartItems((prevItems) => {
      const optionsKey = selectedOptions && selectedOptions.length > 0 
        ? selectedOptions.map(o => o.value_id).sort().join('-') 
        : 'default';
      const cartItemId = `${product.id}-${optionsKey}`;

      const existingItem = prevItems.find((item) => item.cartItemId === cartItemId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      const modifier = selectedOptions?.reduce((acc, opt) => acc + Number(opt.price_modifier), 0) || 0;
      
      return [...prevItems, { 
        ...product, 
        cartItemId,
        quantity: 1, 
        selectedOptions,
        price: product.price + modifier,
        promotional_price: product.promotional_price ? product.promotional_price + modifier : null
      }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const increaseQuantity = useCallback((cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalItems = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + (item.promotional_price || item.price) * item.quantity,
      0
    );
  }, [cartItems]);

  const value = useMemo(
    () => ({
      cartItems,
      totalItems,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }),
    [
      cartItems,
      totalItems,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
