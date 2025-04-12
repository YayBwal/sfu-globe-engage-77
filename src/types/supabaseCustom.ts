
import { Database as GeneratedDatabase } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Define the notification table types that may be missing from the auto-generated types
export interface NotificationTable {
  Row: {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    source: string;
    is_read: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    title: string;
    message: string;
    type?: string;
    source: string;
    is_read?: boolean;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    title?: string;
    message?: string;
    type?: string;
    source?: string;
    is_read?: boolean;
    created_at?: string;
  };
}

// Extend the generated Database type with our custom tables
export interface Database extends GeneratedDatabase {
  public: GeneratedDatabase['public'] & {
    Tables: GeneratedDatabase['public']['Tables'] & {
      notifications: NotificationTable;
    };
  };
}

// Define a type for our typed Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;
