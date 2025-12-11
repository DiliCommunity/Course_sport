'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Course, Category, Instructor, Lesson, User, Enrollment } from '@/types/database'

// Supabase client singleton
const supabase = createClient()

// Courses hooks
export function useCourses(options?: {
  categoryId?: string
  difficulty?: string
  limit?: number
  search?: string
}) {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCourses() {
      try {
        setIsLoading(true)
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('students_count', { ascending: false })

        if (options?.categoryId) {
          query = query.eq('category_id', options.categoryId)
        }

        if (options?.difficulty) {
          query = query.eq('difficulty', options.difficulty)
        }

        if (options?.search) {
          query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
        }

        if (options?.limit) {
          query = query.limit(options.limit)
        }

        const { data, error: queryError } = await query

        if (queryError) throw queryError
        setCourses(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [options?.categoryId, options?.difficulty, options?.limit, options?.search])

  return { courses, isLoading, error }
}

export function useCourse(id: string) {
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCourse() {
      try {
        setIsLoading(true)
        const { data, error: queryError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .eq('is_published', true)
          .single()

        if (queryError) throw queryError
        setCourse(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchCourse()
  }, [id])

  return { course, isLoading, error }
}

// Categories hooks
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true)
        const { data, error: queryError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (queryError) throw queryError
        setCategories(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, isLoading, error }
}

// Instructors hooks
export function useInstructors(limit?: number) {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchInstructors() {
      try {
        setIsLoading(true)
        let query = supabase
          .from('instructors')
          .select('*')
          .order('rating', { ascending: false })

        if (limit) {
          query = query.limit(limit)
        }

        const { data, error: queryError } = await query

        if (queryError) throw queryError
        setInstructors(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstructors()
  }, [limit])

  return { instructors, isLoading, error }
}

// Lessons hooks
export function useLessons(courseId: string) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLessons() {
      try {
        setIsLoading(true)
        const { data, error: queryError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index')

        if (queryError) throw queryError
        setLessons(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    if (courseId) fetchLessons()
  }, [courseId])

  return { lessons, isLoading, error }
}

// User hooks
export function useUser(telegramId?: string) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const createOrUpdateUser = useCallback(async (userData: {
    telegramId: string
    name: string
    username?: string
  }) => {
    try {
      const { data, error: upsertError } = await supabase
        .from('users')
        .upsert({
          telegram_id: userData.telegramId,
          name: userData.name,
          telegram_username: userData.username,
        }, {
          onConflict: 'telegram_id'
        })
        .select()
        .single()

      if (upsertError) throw upsertError
      setUser(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }, [])

  useEffect(() => {
    async function fetchUser() {
      if (!telegramId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error: queryError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramId)
          .single()

        if (queryError && queryError.code !== 'PGRST116') throw queryError
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [telegramId])

  return { user, isLoading, error, createOrUpdateUser }
}

// Enrollments hooks
export function useEnrollments(userId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const enroll = useCallback(async (courseId: string) => {
    if (!userId) throw new Error('User not authenticated')

    try {
      const { data, error: insertError } = await supabase
        .from('enrollments')
        .insert({ user_id: userId, course_id: courseId })
        .select()
        .single()

      if (insertError) throw insertError
      setEnrollments(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    }
  }, [userId])

  useEffect(() => {
    async function fetchEnrollments() {
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error: queryError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', userId)

        if (queryError) throw queryError
        setEnrollments(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchEnrollments()
  }, [userId])

  return { enrollments, isLoading, error, enroll }
}

