import { Hero } from '@/components/sections/Hero'
import { FeaturedCourses } from '@/components/sections/FeaturedCourses'
import { Categories } from '@/components/sections/Categories'
import { Features } from '@/components/sections/Features'
import { Instructors } from '@/components/sections/Instructors'
import { Testimonials } from '@/components/sections/Testimonials'
import { CTA } from '@/components/sections/CTA'

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCourses />
      <Categories />
      <Features />
      <Instructors />
      <Testimonials />
      <CTA />
    </>
  )
}
