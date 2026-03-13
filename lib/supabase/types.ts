/**
 * Supabase database types (auto-generated from Supabase project or maintained manually).
 * Matches database/schema.sql tables.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          code: string;
          location: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string;
          branch_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          sla_days: number;
          notes: string | null;
          branch_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["suppliers"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
      };
      spare_parts: {
        Row: {
          id: string;
          part_name: string;
          category: string | null;
          brand: string | null;
          model: string | null;
          compatible_devices: string | null;
          sku: string | null;
          unit_price: number;
          supplier_id: string | null;
          current_stock: number;
          minimum_stock: number;
          reorder_level: number;
          notes: string | null;
          image_url: string | null;
          branch_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["spare_parts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["spare_parts"]["Insert"]>;
      };
      assets: {
        Row: {
          id: string;
          asset_tag: string;
          serial_number: string | null;
          device_type: string;
          brand: string | null;
          model: string | null;
          purchase_date: string | null;
          warranty_start: string | null;
          warranty_end: string | null;
          status: string;
          assigned_user_name: string | null;
          assigned_user_email: string | null;
          department: string | null;
          location: string | null;
          notes: string | null;
          branch_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["assets"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["assets"]["Insert"]>;
      };
      stock_transactions: {
        Row: {
          id: string;
          spare_part_id: string;
          transaction_type: "IN" | "OUT";
          quantity: number;
          transaction_date: string;
          related_asset_id: string | null;
          performed_by_id: string | null;
          notes: string | null;
          branch_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stock_transactions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_transactions"]["Insert"]>;
      };
      purchase_requests: {
        Row: {
          id: string;
          request_number: string;
          spare_part_id: string;
          quantity: number;
          supplier_id: string;
          requested_by_id: string | null;
          request_date: string;
          expected_delivery_date: string | null;
          actual_delivery_date: string | null;
          status: string;
          notes: string | null;
          branch_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["purchase_requests"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_requests"]["Insert"]>;
      };
      supplier_followups: {
        Row: {
          id: string;
          supplier_id: string;
          purchase_request_id: string | null;
          last_contact_date: string | null;
          next_followup_date: string | null;
          status: string | null;
          remarks: string | null;
          branch_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["supplier_followups"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["supplier_followups"]["Insert"]>;
      };
      asset_history: {
        Row: {
          id: string;
          asset_id: string;
          action_type: string;
          description: string | null;
          installed_part_id: string | null;
          old_value: string | null;
          new_value: string | null;
          performed_by_id: string | null;
          performed_at: string;
          branch_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["asset_history"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["asset_history"]["Insert"]>;
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          requester_name: string;
          employee_id: string | null;
          email: string;
          department: string | null;
          issue_type: string | null;
          description: string;
          priority: string;
          status: string;
          assigned_to_id: string | null;
          asset_id: string | null;
          branch_id: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tickets"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tickets"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          message: string | null;
          module: string | null;
          related_record_id: string | null;
          related_record_type: string | null;
          priority: string;
          read_at: string | null;
          branch_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      asset_attachments: {
        Row: {
          id: string;
          asset_id: string;
          file_url: string;
          file_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["asset_attachments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["asset_attachments"]["Insert"]>;
      };
    };
  };
}
