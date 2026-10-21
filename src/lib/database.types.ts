/**
 * TypeScript types auto-derived from supabase-schema.sql
 * Regenerate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:             string;
          wallet_address: string;
          display_name:   string;
          avatar_url:     string | null;
          bio:            string | null;
          status:         "online" | "away" | "offline";
          last_seen:      string;
          created_at:     string;
          updated_at:     string;
        };
        Insert: {
          id?:             string;
          wallet_address: string;
          display_name:   string;
          avatar_url?:     string | null;
          bio?:            string | null;
          status?:         "online" | "away" | "offline";
          last_seen?:      string;
          created_at?:     string;
          updated_at?:     string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };

      conversations: {
        Row: {
          id:              string;
          type:            "private" | "group" | "fund-group";
          name:            string;
          avatar_url:      string | null;
          description:     string | null;
          pool_id:         number | null;
          pool_type:       "event" | "luckydraw" | null;
          created_by:      string | null;
          last_message_at: string | null;
          last_message:    string | null;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id?:              string;
          type:            "private" | "group" | "fund-group";
          name:            string;
          avatar_url?:      string | null;
          description?:     string | null;
          pool_id?:         number | null;
          pool_type?:       "event" | "luckydraw" | null;
          created_by?:      string | null;
          last_message_at?: string | null;
          last_message?:    string | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };

      conversation_participants: {
        Row: {
          conversation_id: string;
          profile_id:      string;
          is_admin:        boolean;
          joined_at:       string;
        };
        Insert: {
          conversation_id: string;
          profile_id:      string;
          is_admin?:       boolean;
          joined_at?:      string;
        };
        Update: Partial<Database["public"]["Tables"]["conversation_participants"]["Insert"]>;
        Relationships: [];
      };

      messages: {
        Row: {
          id:              string;
          conversation_id: string;
          sender_id:       string;
          content:         string;
          message_type:    "text" | "image" | "file" | "system" | "tx";
          file_url:        string | null;
          file_name:       string | null;
          file_size:       number | null;
          tx_hash:         string | null;
          tx_chain_id:     number | null;
          reply_to:        string | null;
          metadata:        Json | null;
          created_at:      string;
        };
        Insert: {
          id?:              string;
          conversation_id: string;
          sender_id:       string;
          content:         string;
          message_type?:    "text" | "image" | "file" | "system" | "tx";
          file_url?:        string | null;
          file_name?:       string | null;
          file_size?:       number | null;
          tx_hash?:         string | null;
          tx_chain_id?:     number | null;
          reply_to?:        string | null;
          metadata?:        Json | null;
          created_at?:      string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };

      pool_members: {
        Row: {
          pool_id:        number;
          profile_id:     string | null;
          wallet_address: string;
          amount_wei:     string;
          tx_hash:        string | null;
          contributed_at: string;
        };
        Insert: {
          pool_id:        number;
          profile_id?:     string | null;
          wallet_address: string;
          amount_wei:     string;
          tx_hash?:        string | null;
          contributed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pool_members"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ── Convenience aliases ─────────────────────────────────────────────────────
export type Profile              = Database["public"]["Tables"]["profiles"]["Row"];
export type Conversation         = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"];
export type Message              = Database["public"]["Tables"]["messages"]["Row"];
export type PoolMember           = Database["public"]["Tables"]["pool_members"]["Row"];

/** Conversation row enriched with sender profile (joined on fetch) */
export type MessageWithSender = Message & {
  sender: Pick<Profile, "id" | "display_name" | "avatar_url" | "wallet_address">;
};

/** Conversation with last-message preview and unread count */
export type ConversationWithMeta = Conversation & {
  unread_count: number;
  participants: Pick<Profile, "id" | "display_name" | "avatar_url" | "status">[];
};
