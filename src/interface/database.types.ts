export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaign: {
        Row: {
          campaign_id: string
          catalog_id: number
          created_at: string | null
          delivery_method: Database["public"]["Enums"]["campaign_method"][]
          description: string | null
          id: number
          message: string
          name: string
          status: Database["public"]["Enums"]["campaign_status"] | null
          subject: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          catalog_id: number
          created_at?: string | null
          delivery_method: Database["public"]["Enums"]["campaign_method"][]
          description?: string | null
          id?: number
          message: string
          name: string
          status?: Database["public"]["Enums"]["campaign_status"] | null
          subject?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          catalog_id?: number
          created_at?: string | null
          delivery_method?: Database["public"]["Enums"]["campaign_method"][]
          description?: string | null
          id?: number
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["campaign_status"] | null
          subject?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalog"
            referencedColumns: ["catalog_id"]
          },
        ]
      }
      campaign_recipient: {
        Row: {
          campaign_id: string
          client_id: number
          created_at: string | null
          delivered_at: string | null
          delivery_method: string
          id: number
          recipient_id: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          client_id: number
          created_at?: string | null
          delivered_at?: string | null
          delivery_method: string
          id?: number
          recipient_id: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          client_id?: number
          created_at?: string | null
          delivered_at?: string | null
          delivery_method?: string
          id?: number
          recipient_id?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipient_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_recipient_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["client_id"]
          },
        ]
      }
      catalog: {
        Row: {
          catalog_id: number
          created_at: string
          name: string
          status: Database["public"]["Enums"]["catalog_status"]
          theme_id: number | null
          updated_at: string
        }
        Insert: {
          catalog_id?: number
          created_at?: string
          name: string
          status?: Database["public"]["Enums"]["catalog_status"]
          theme_id?: number | null
          updated_at?: string
        }
        Update: {
          catalog_id?: number
          created_at?: string
          name?: string
          status?: Database["public"]["Enums"]["catalog_status"]
          theme_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      catalog_transitions: {
        Row: {
          catalog_id: number
          catalog_transition_id: number
          created_at: string
          item_id: number
          updated_at: string
        }
        Insert: {
          catalog_id: number
          catalog_transition_id?: number
          created_at?: string
          item_id: number
          updated_at?: string
        }
        Update: {
          catalog_id?: number
          catalog_transition_id?: number
          created_at?: string
          item_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalog"
            referencedColumns: ["catalog_id"]
          },
          {
            foreignKeyName: "catalog_item_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item"
            referencedColumns: ["item_id"]
          },
        ]
      }
      client: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          client_id: number
          country: string | null
          created_at: string
          email: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          whatsapp_phone: string | null
          zip: number | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_id?: number
          country?: string | null
          created_at?: string
          email: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
          zip?: number | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_id?: number
          country?: string | null
          created_at?: string
          email?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
          zip?: number | null
        }
        Relationships: []
      }
      item: {
        Row: {
          category_id: number | null
          cost_price: number
          created_at: string
          description: string | null
          image_url: string | null
          is_catalog_visible: boolean
          item_id: number
          name: string
          retail_price: number
          stock_quantity: number
          updated_at: string
          wholesale_price: number
        }
        Insert: {
          category_id?: number | null
          cost_price: number
          created_at?: string
          description?: string | null
          image_url?: string | null
          is_catalog_visible?: boolean
          item_id?: number
          name: string
          retail_price: number
          stock_quantity?: number
          updated_at?: string
          wholesale_price: number
        }
        Update: {
          category_id?: number | null
          cost_price?: number
          created_at?: string
          description?: string | null
          image_url?: string | null
          is_catalog_visible?: boolean
          item_id?: number
          name?: string
          retail_price?: number
          stock_quantity?: number
          updated_at?: string
          wholesale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_category"
            referencedColumns: ["category_id"]
          },
        ]
      }
      item_category: {
        Row: {
          category_id: number
          created_at: string
          icon: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: number
          created_at?: string
          icon?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: number
          created_at?: string
          icon?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      order: {
        Row: {
          catalog_id: number
          client_id: number
          created_at: string
          order_id: number
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_notes: string | null
          shipping_state: string | null
          shipping_zip: number | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          catalog_id: number
          client_id: number
          created_at?: string
          order_id?: number
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_notes?: string | null
          shipping_state?: string | null
          shipping_zip?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          catalog_id?: number
          client_id?: number
          created_at?: string
          order_id?: number
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_notes?: string | null
          shipping_state?: string | null
          shipping_zip?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalog"
            referencedColumns: ["catalog_id"]
          },
          {
            foreignKeyName: "order_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["client_id"]
          },
        ]
      }
      order_transactions: {
        Row: {
          created_at: string
          item_id: number
          order_id: number
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          item_id: number
          order_id: number
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          item_id?: number
          order_id?: number
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_transactions_item_id_fkey1"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_transitions"
            referencedColumns: ["catalog_transition_id"]
          },
          {
            foreignKeyName: "order_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["order_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      campaign_method: "email" | "whatsapp" | "sms"
      campaign_status: "Draft" | "Active" | "Completed" | "Cancelled"
      catalog_status: "enabled" | "disabled" | "draft"
      order_status:
        | "Pending"
        | "Confirmed"
        | "Shipped"
        | "Delivered"
        | "Cancelled"
      order_status_enum:
        | "Pending"
        | "Shipped"
        | "Rejected"
        | "Confirmed"
        | "Delivered"
        | "Cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_method: ["email", "whatsapp", "sms"],
      campaign_status: ["Draft", "Active", "Completed", "Cancelled"],
      catalog_status: ["enabled", "disabled", "draft"],
      order_status: [
        "Pending",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      order_status_enum: [
        "Pending",
        "Shipped",
        "Rejected",
        "Confirmed",
        "Delivered",
        "Cancelled",
      ],
    },
  },
} as const
