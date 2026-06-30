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
          category_id: string | null
          price: number
          promotional_price: number | null
          stock: number
          status: string
          material: string | null
          weight: number | null
          width: number | null
          height: number | null
          images: string[] | null
          image_url: string | null
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
          category_id?: string | null
          price: number
          promotional_price?: number | null
          stock?: number
          status?: string
          material?: string | null
          weight?: number | null
          width?: number | null
          height?: number | null
          images?: string[] | null
          image_url?: string | null
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
          category_id?: string | null
          price?: number
          promotional_price?: number | null
          stock?: number
          status?: string
          material?: string | null
          weight?: number | null
          width?: number | null
          height?: number | null
          images?: string[] | null
          image_url?: string | null
          slug?: string | null
          is_featured?: boolean
          is_made_to_order?: boolean
        }
        Relationships: []
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          quantity: number
          unit_price: number
          created_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          quantity?: number
          unit_price: number
          created_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          status: string
          payment_status: string
          shipping_status: string
          subtotal: number
          shipping_price: number
          total_price: number
          gateway: string
          gateway_reference: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          shipping_address: Json
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          status?: string
          payment_status?: string
          shipping_status?: string
          subtotal: number
          shipping_price: number
          total_price: number
          gateway?: string
          gateway_reference?: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          shipping_address: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          status?: string
          payment_status?: string
          shipping_status?: string
          subtotal?: number
          shipping_price?: number
          total_price?: number
          gateway?: string
          gateway_reference?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          shipping_address?: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          product_snapshot: Json
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
          product_snapshot: Json
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          product_snapshot?: Json
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          gateway: string
          transaction_id: string
          status: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          gateway?: string
          transaction_id: string
          status: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          gateway?: string
          transaction_id?: string
          status?: string
          payload?: Json | null
          created_at?: string
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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          image_url: string | null
          seo_title: string | null
          seo_description: string | null
          is_featured: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          image_url?: string | null
          seo_title?: string | null
          seo_description?: string | null
          is_featured?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          image_url?: string | null
          seo_title?: string | null
          seo_description?: string | null
          is_featured?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          position: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          position?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          position?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          desktop_image_url: string
          mobile_image_url: string
          link_url: string | null
          button_text: string
          position: number
          is_active: boolean
          hide_overlay: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          desktop_image_url: string
          mobile_image_url: string
          link_url?: string | null
          button_text?: string
          position?: number
          is_active?: boolean
          hide_overlay?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          desktop_image_url?: string
          mobile_image_url?: string
          link_url?: string | null
          button_text?: string
          position?: number
          is_active?: boolean
          hide_overlay?: boolean
          created_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
          type: string
          group: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          type?: string
          group?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          type?: string
          group?: string
          updated_at?: string
        }
        Relationships: []
      }
      storefront_sections: {
        Row: {
          id: string
          section_key: string
          position: number
          is_active: boolean
          payload: Json
          updated_at: string
        }
        Insert: {
          id?: string
          section_key: string
          position?: number
          is_active?: boolean
          payload?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          section_key?: string
          position?: number
          is_active?: boolean
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      cart_recovery: {
        Row: {
          id: string
          session_id: string
          customer_email: string | null
          customer_phone: string | null
          customer_name: string | null
          cart_items: Json
          status: string
          checkout_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_name?: string | null
          cart_items: Json
          status?: string
          checkout_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_name?: string | null
          cart_items?: Json
          status?: string
          checkout_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          reviewer_name: string
          reviewer_email: string
          rating: number
          comment: string | null
          is_verified_buyer: boolean
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          reviewer_name: string
          reviewer_email: string
          rating: number
          comment?: string | null
          is_verified_buyer?: boolean
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          reviewer_name?: string
          reviewer_email?: string
          rating?: number
          comment?: string | null
          is_verified_buyer?: boolean
          is_approved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      order_timeline: {
        Row: {
          id: string
          order_id: string
          step_key: string
          title: string
          description: string | null
          is_completed: boolean
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          step_key: string
          title: string
          description?: string | null
          is_completed?: boolean
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          step_key?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          completed_at?: string | null
          updated_at?: string
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
