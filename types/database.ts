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
      courses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string
          short_description: string
          price: number
          original_price: number | null
          image_url: string
          category_id: string
          instructor_id: string
          duration_minutes: number
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          is_published: boolean
          students_count: number
          rating: number
          lessons_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          short_description: string
          price: number
          original_price?: number | null
          image_url: string
          category_id: string
          instructor_id: string
          duration_minutes: number
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          is_published?: boolean
          students_count?: number
          rating?: number
          lessons_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          short_description?: string
          price?: number
          original_price?: number | null
          image_url?: string
          category_id?: string
          instructor_id?: string
          duration_minutes?: number
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          is_published?: boolean
          students_count?: number
          rating?: number
          lessons_count?: number
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
          description: string
          icon: string
          color: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          description: string
          icon: string
          color: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          description?: string
          icon?: string
          color?: string
        }
      }
      instructors: {
        Row: {
          id: string
          created_at: string
          name: string
          bio: string
          avatar_url: string
          specialization: string
          experience_years: number
          students_count: number
          courses_count: number
          rating: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          bio: string
          avatar_url: string
          specialization: string
          experience_years: number
          students_count?: number
          courses_count?: number
          rating?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          bio?: string
          avatar_url?: string
          specialization?: string
          experience_years?: number
          students_count?: number
          courses_count?: number
          rating?: number
        }
      }
      lessons: {
        Row: {
          id: string
          created_at: string
          course_id: string
          title: string
          description: string
          video_url: string | null
          duration_minutes: number
          order_index: number
          is_free: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          course_id: string
          title: string
          description: string
          video_url?: string | null
          duration_minutes: number
          order_index: number
          is_free?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          course_id?: string
          title?: string
          description?: string
          video_url?: string | null
          duration_minutes?: number
          order_index?: number
          is_free?: boolean
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string
          avatar_url: string | null
          telegram_id: string | null
          phone: string | null
          is_admin: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name: string
          avatar_url?: string | null
          telegram_id?: string | null
          phone?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string
          avatar_url?: string | null
          telegram_id?: string | null
          phone?: string | null
          is_admin?: boolean
        }
      }
      enrollments: {
        Row: {
          id: string
          created_at: string
          user_id: string
          course_id: string
          progress: number
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          course_id: string
          progress?: number
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          course_id?: string
          progress?: number
          completed_at?: string | null
        }
      }
      user_balance: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          created_at: string
          referrer_id: string
          referred_id: string
          referral_code: string
          status: 'pending' | 'active' | 'completed'
          earned_amount: number
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          referrer_id: string
          referred_id: string
          referral_code: string
          status?: 'pending' | 'active' | 'completed'
          earned_amount?: number
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          referrer_id?: string
          referred_id?: string
          referral_code?: string
          status?: 'pending' | 'active' | 'completed'
          earned_amount?: number
          completed_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: 'earned' | 'withdrawn' | 'spent' | 'refund'
          amount: number
          description: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: 'earned' | 'withdrawn' | 'spent' | 'refund'
          amount: number
          description: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: 'earned' | 'withdrawn' | 'spent' | 'refund'
          amount?: number
          description?: string
          reference_id?: string | null
          reference_type?: string | null
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

export type Course = Database['public']['Tables']['courses']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Instructor = Database['public']['Tables']['instructors']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type UserBalance = Database['public']['Tables']['user_balance']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']

