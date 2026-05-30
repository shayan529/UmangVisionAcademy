import AISection from "../components/AiSection"

import Community from "../components/Community"
import Footer from "../Layout/Footer"
import Hero from "../components/Hero"
import Instructors from "../components/Instructors"
import Navbar from "../Layout/Navbar"
import Plans from "../components/Plans"
import FeaturedCourses from "../components/FeaturedCourses"
import Testimonials from "../components/Testimonials"

const Home = () => {
  return (
    <div>
      <Hero />
      
      <FeaturedCourses />
      <Testimonials />
      <Instructors />
      <Community />
      <AISection />
      <Plans />
      
    </div>
  )
}

export default Home