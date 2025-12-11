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
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name: string
          avatar_url?: string | null
          telegram_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string
          avatar_url?: string | null
          telegram_id?: string | null
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

