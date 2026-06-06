import AISection from "../components/common/AiSection";

import Community from "../components/common/Community";
import Footer from "../Layout/Footer";
import Hero from "../components/common/Hero";
import Instructors from "../components/common/Instructors";
import Navbar from "../Layout/Navbar";
import Plans from "../components/common/Plans";
import FeaturedCourses from "../components/common/FeaturedCourses";
import Testimonials from "../components/common/Testimonials";

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
  );
};

export default Home;
