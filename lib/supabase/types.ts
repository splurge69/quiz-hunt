export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RoomStatus = 'lobby' | 'playing' | 'finished' | 'cancelled'
export type Difficulty = 'easy' | 'medium' | 'hard'

// Question pack structure (stored as JSONB in Supabase)
export type PackQuestion = {
  text: string
  options: [string, string, string, string]
  correctIndex: number
}

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          code: string
          host_name: string
          status: RoomStatus
          locked: boolean
          prompt: string | null
          difficulty: Difficulty | null
          question_count: number | null
          current_q_index: number
          question_ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          host_name: string
          status?: RoomStatus
          locked?: boolean
          prompt?: string | null
          difficulty?: Difficulty | null
          question_count?: number | null
          current_q_index?: number
          question_ends_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          host_name?: string
          status?: RoomStatus
          locked?: boolean
          prompt?: string | null
          difficulty?: Difficulty | null
          question_count?: number | null
          current_q_index?: number
          question_ends_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          room_id: string
          q_index: number
          text: string
          options: string[]
          correct_index: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          q_index: number
          text: string
          options: string[]
          correct_index: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          q_index?: number
          text?: string
          options?: string[]
          correct_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'questions_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      players: {
        Row: {
          id: string
          room_id: string
          name: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          score?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'players_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      answers: {
        Row: {
          id: string
          room_id: string
          player_id: string
          q_index: number
          selected_index: number
          submitted_at: string
          is_correct: boolean | null
          points_awarded: number
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          q_index: number
          selected_index: number
          submitted_at?: string
          is_correct?: boolean | null
          points_awarded?: number
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          q_index?: number
          selected_index?: number
          submitted_at?: string
          is_correct?: boolean | null
          points_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: 'answers_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'answers_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          }
        ]
      }
      question_packs: {
        Row: {
          id: string
          name: string
          description: string | null
          difficulty: Difficulty
          questions: PackQuestion[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          difficulty: Difficulty
          questions: PackQuestion[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          difficulty?: Difficulty
          questions?: PackQuestion[]
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
      room_status: RoomStatus
      difficulty: Difficulty
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Room = Database['public']['Tables']['rooms']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Answer = Database['public']['Tables']['answers']['Row']

export type RoomInsert = Database['public']['Tables']['rooms']['Insert']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type AnswerInsert = Database['public']['Tables']['answers']['Insert']
export type QuestionPack = Database['public']['Tables']['question_packs']['Row']