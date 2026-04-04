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
      notebooks: {
        Row: {
          id: string
          owner_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          color?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          notebook_id: string
          owner_id: string
          title: string
          content: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          notebook_id: string
          owner_id: string
          title?: string
          content?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          notebook_id?: string
          title?: string
          content?: Json
          updated_at?: string
        }
      }
      note_shares: {
        Row: {
          id: string
          note_id: string
          shared_with_user_id: string
          permission: 'read' | 'edit'
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          shared_with_user_id: string
          permission?: 'read' | 'edit'
          created_at?: string
        }
        Update: {
          permission?: 'read' | 'edit'
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Convenience types
export type Notebook = Database['public']['Tables']['notebooks']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type NoteShare = Database['public']['Tables']['note_shares']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
