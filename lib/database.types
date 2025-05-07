export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      dreams: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          mood: string | null
          created_at: string
          interpretation: Json | null
          has_artwork: boolean
          has_affirmation: boolean
          artwork_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          mood?: string | null
          created_at?: string
          interpretation?: Json | null
          has_artwork?: boolean
          has_affirmation?: boolean
          artwork_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          mood?: string | null
          created_at?: string
          interpretation?: Json | null
          has_artwork?: boolean
          has_affirmation?: boolean
          artwork_url?: string | null
        }
      }
      dream_tags: {
        Row: {
          id: string
          dream_id: string
          tag: string
        }
        Insert: {
          id?: string
          dream_id: string
          tag: string
        }
        Update: {
          id?: string
          dream_id?: string
          tag?: string
        }
      }
      dream_shares: {
        Row: {
          id: string
          dream_id: string | null
          share_type: string
          content: string
          title: string
          created_at: string
          expires_at: string
          views: number
        }
        Insert: {
          id?: string
          dream_id?: string | null
          share_type: string
          content: string
          title?: string
          created_at?: string
          expires_at?: string
          views?: number
        }
        Update: {
          id?: string
          dream_id?: string | null
          share_type?: string
          content?: string
          title?: string
          created_at?: string
          expires_at?: string
          views?: number
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          subscription_tier: "free" | "starter" | "pro"
          dreams_count: number
          dreams_limit: number
          created_at: string
          avatar_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          subscription_tier?: "free" | "starter" | "pro"
          dreams_count?: number
          dreams_limit?: number
          created_at?: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          subscription_tier?: "free" | "starter" | "pro"
          dreams_count?: number
          dreams_limit?: number
          created_at?: string
          avatar_url?: string | null
        }
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
  }
}
