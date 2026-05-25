export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          category: string | null
          price: number
          promotional_price: number | null
          stock: number
          status: string
          material: string | null
          weight: number | null
          width: number | null
          height: number | null
          images: string[] | null
          slug: string | null
          is_featured: boolean
          is_made_to_order: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          category?: string | null
          price: number
          promotional_price?: number | null
          stock?: number
          status?: string
          material?: string | null
          weight?: number | null
          width?: number | null
          height?: number | null
          images?: string[] | null
          slug?: string | null
          is_featured?: boolean
          is_made_to_order?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          category?: string | null
          price?: number
          promotional_price?: number | null
          stock?: number
          status?: string
          material?: string | null
          weight?: number | null
          width?: number | null
          height?: number | null
          images?: string[] | null
          slug?: string | null
          is_featured?: boolean
          is_made_to_order?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          created_at: string
          customer_id: string | null
          order_nsu: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          items: Json | null
          subtotal: number | null
          shipping_price: number | null
          total_price: number | null
          payment_status: string | null
          shipping_address: Json | null
          status: string
          capture_method: string | null
          transaction_nsu: string | null
          invoice_slug: string | null
          receipt_url: string | null
          paid_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          customer_id?: string | null
          order_nsu?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          items?: Json | null
          subtotal?: number | null
          shipping_price?: number | null
          total_price?: number | null
          payment_status?: string | null
          shipping_address?: Json | null
          status: string
          capture_method?: string | null
          transaction_nsu?: string | null
          invoice_slug?: string | null
          receipt_url?: string | null
          paid_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          customer_id?: string | null
          order_nsu?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          items?: Json | null
          subtotal?: number | null
          shipping_price?: number | null
          total_price?: number | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string
          capture_method?: string | null
          transaction_nsu?: string | null
          invoice_slug?: string | null
          receipt_url?: string | null
          paid_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          total_spent: number
          orders_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
          total_spent?: number
          orders_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          total_spent?: number
          orders_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          is_admin: boolean
          is_active: boolean
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          is_admin?: boolean
          is_active?: boolean
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          is_admin?: boolean
          is_active?: boolean
          role?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
