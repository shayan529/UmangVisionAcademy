import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect } from "react"
import Navbar from "./Layout/Navbar"
import Footer from "./Layout/Footer"
import Home from "./pages/Home"
import Courses from "./components/Courses"
import Community from "./components/Community"
import Instructors from "./components/Instructors"
import BecomeInstructor from "./components/BecomeInstructor"
import BecomeInstructorApplication from "./components/BecomeInstructorApplication"
import Login from "./components/Login"
import Signup from "./components/Signup"
import  { DashboardHome } from "./components/student/StudentDashboard"
import AITutor from "./components/student/AITutor"
import MyCoursesSection from "./components/student/MyCoursesSection"
import CommunitySection from "./components/student/CommunitySection"
import CertificatesSection from "./components/student/CertificatesSection"
import SettingsSection from "./components/student/SettingsSection"
import InstructorDashboard from "./components/instructor/InstructorDashboard"
import Plans from "./components/Plans"
import Contact from "./pages/Contact"
import HelpCenter from "./pages/HelpCenter"
import Faq from "./pages/Faq"
import AdminDashboard from "./components/admin/AdminDashboard"
import CartPage from "./pages/CartPage"
import InstructorDetails from "./pages/InstructorDetails"
import StudentDashboard from "./components/student/StudentDashboard"
import LeaderBoard from "./components/student/LeaderBoard"

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const Layout = () => {
  const user = typeof window !== "undefined" ? localStorage.getItem("user") : null

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<><ScrollToTop /><Home /></>} />
        <Route path="login" element={<><ScrollToTop /><Login /></>} />
        <Route path="signup" element={<><ScrollToTop /><Signup /></>} />
        <Route path="courses" element={<><ScrollToTop /><Courses /></>} />
       
        <Route path="community" element={<><ScrollToTop /><Community /></>} />
        <Route path="become-instructor" element={<><ScrollToTop /><BecomeInstructor /></>} />
        <Route path="become-instructor/apply" element={<><ScrollToTop /><BecomeInstructorApplication /></>} />
        <Route path="student-dashboard" element={<StudentDashboard />}>
          <Route index element={<><ScrollToTop /><DashboardHome /></>} />
          <Route path="courses" element={<><ScrollToTop /><Courses /></>} />
          <Route path="my-courses" element={<><ScrollToTop /><MyCoursesSection /></>} />
          <Route path="ai-tutor" element={<><ScrollToTop /><AITutor /></>} />
          <Route path="community" element={<><ScrollToTop /><CommunitySection /></>} />
          <Route path="certificates" element={<><ScrollToTop /><CertificatesSection /></>} />
          <Route path="settings" element={<><ScrollToTop /><SettingsSection /></>} />
          <Route path="leaderboard" element={<><ScrollToTop /><LeaderBoard /></>} />
        </Route>
        <Route path="admin-dashboard" element={<><ScrollToTop /><AdminDashboard /></>} />
        <Route path="plans" element={<><ScrollToTop /><Plans /></>} />
        <Route path="contact" element={<><ScrollToTop /><Contact /></>} />
        <Route path="ai-tutor" element={<Navigate to="/student-dashboard/ai-tutor" replace />} />
        <Route path="instructor-dashboard" element={<><ScrollToTop /><InstructorDashboard /></>} />
        <Route path="my-courses" element={<Navigate to="/student-dashboard/my-courses" replace />} />
        <Route path="certificates" element={<Navigate to="/student-dashboard/certificates" replace />} />
       
        <Route path="help-center" element={<><ScrollToTop /><HelpCenter /></>} /> 
        <Route path="faq" element={<><ScrollToTop /><Faq/></>} />
        <Route path="/cart" element={<><ScrollToTop /><CartPage /></>} />
        <Route path="/instructor-details" element={<><ScrollToTop /><InstructorDetails /></>} />
        <Route path="*" element={<><ScrollToTop /><Home /></>} />

      </Route>
    </Routes>
  )
}

export default App