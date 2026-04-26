export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      invoice_items: {
        Row: {
          cgst: number
          cost_price: number
          created_at: string
          gst_rate: number
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string
          profit: number
          quantity: number
          selling_price: number
          sgst: number
          total_price: number
        }
        Insert: {
          cgst?: number
          cost_price?: number
          created_at?: string
          gst_rate?: number
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name: string
          profit?: number
          quantity: number
          selling_price?: number
          sgst?: number
          total_price?: number
        }
        Update: {
          cgst?: number
          cost_price?: number
          created_at?: string
          gst_rate?: number
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string
          profit?: number
          quantity?: number
          selling_price?: number
          sgst?: number
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cgst_total: number
          created_at: string
          customer_address: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          discount: number
          due_amount: number
          final_amount: number
          gst_enabled: boolean
          id: string
          invoice_no: string
          owner_id: string
          paid_amount: number
          profit: number
          sgst_total: number
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          cgst_total?: number
          created_at?: string
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number
          due_amount?: number
          final_amount?: number
          gst_enabled?: boolean
          id?: string
          invoice_no: string
          owner_id: string
          paid_amount?: number
          profit?: number
          sgst_total?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          cgst_total?: number
          created_at?: string
          customer_address?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          due_amount?: number
          final_amount?: number
          gst_enabled?: boolean
          id?: string
          invoice_no?: string
          owner_id?: string
          paid_amount?: number
          profit?: number
          sgst_total?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_branch: string | null
          bank_holder: string | null
          bank_ifsc: string | null
          bank_name: string | null
          business_name: string | null
          city: string | null
          created_at: string
          email: string
          gst_number: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          pan_number: string | null
          phone: string | null
          postal_code: string | null
          signature_url: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_holder?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          email: string
          gst_number?: string | null
          id: string
          is_active?: boolean
          logo_url?: string | null
          pan_number?: string | null
          phone?: string | null
          postal_code?: string | null
          signature_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_branch?: string | null
          bank_holder?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          email?: string
          gst_number?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          pan_number?: string | null
          phone?: string | null
          postal_code?: string | null
          signature_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          cost_price: number
          created_at: string
          gst_rate: number | null
          hsn_code: string | null
          id: string
          name: string
          owner_id: string
          selling_price: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          name: string
          owner_id: string
          selling_price?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          gst_rate?: number | null
          hsn_code?: string | null
          id?: string
          name?: string
          owner_id?: string
          selling_price?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_owner: { Args: { _user_id: string }; Returns: boolean }
      next_invoice_no: { Args: { _owner_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "owner"
      invoice_status: "paid" | "unpaid" | "partial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner"],
      invoice_status: ["paid", "unpaid", "partial"],
    },
  },
} as const
