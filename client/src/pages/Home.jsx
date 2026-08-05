import SEO from "../components/common/SEO";
import AISection from "../components/common/AiSection";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

import Footer from "../Layout/Footer";
import Hero from "../components/common/Hero";
import Instructors from "../components/common/Instructors";
import Navbar from "../Layout/Navbar";
import Plans from "../components/common/Plans";
import FeaturedCourses from "../components/common/FeaturedCourses";
import Testimonials from "../components/common/Testimonials";

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div>
      <SEO title="Home" description="Explore Umang Vision Academy - the best place to elevate your skills with top-notch coaching." />
      <Hero />

      <FeaturedCourses />
      <Testimonials />
      {/* <Instructors /> */}
      {/* <Community /> */}
      <AISection />
      <Plans />
    </div>
  );
};

export default Home;
