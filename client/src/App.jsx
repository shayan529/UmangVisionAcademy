import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadCurrentUser } from "./redux/slices/authSlice";
import { fetchCart } from "./redux/slices/cartSlice";

import Navbar from "./Layout/Navbar";
import Footer from "./Layout/Footer";

import Home from "./pages/Home";
import Contact from "./pages/Contact";
import HelpCenter from "./pages/HelpCenter";
import Faq from "./pages/Faq";
import CartPage from "./pages/CartPage";
import InstructorDetails from "./pages/InstructorDetails";
import NotFound from "./pages/NotFound";
import BillingPage from "./pages/BillingPage";

import Courses from "./components/common/Courses";
import Community from "./components/common/Community";
import Instructors from "./components/common/Instructors";
import BecomeInstructor from "./components/common/BecomeInstructor";
import BecomeInstructorApplication from "./components/common/BecomeInstructorApplication";
import Login from "./components/common/Login";
import Signup from "./components/common/Signup";
import Plans from "./components/common/Plans";

import ProtectedRoute from "./components/common/ProtectedRoute";

/* Student Dashboard */
import StudentDashboard, {
  DashboardHome,
} from "./components/student/StudentDashboard";
import MyCoursesSection from "./components/student/MyCoursesSection";
import AITutor from "./components/student/AITutor";
import CommunitySection from "./components/student/CommunitySection";
import CertificatesSection from "./components/student/CertificatesSection";
import SettingsSection from "./components/student/SettingsSection";
import LeaderBoard from "./components/student/LeaderBoard";
import StudentNotifications from "./components/student/StudentNotifications";
import StudentSessions from "./components/student/StudentSessions";

/* Mock Tests */
import MockTestsLayout from "./components/student/MockTestsIndex";
import AvailableMockTests from "./components/student/AvailableMockTests";
import MockTestPlayer from "./components/student/MockTestPlayer";
import MockTestResultsAnalytics from "./components/student/MockTestResultsAnalytics";
import MockTestLeaderboard from "./components/student/MockTestLeaderboard";

/* Instructor Dashboard */
import InstructorDashboard from "./components/instructor/InstructorDashboard";
import InstructorHome from "./components/instructor/InstructorHome";
import InstructorCourses from "./components/instructor/InstructorCourses";
import InstructorStudents from "./components/instructor/InstructorStudents";
import InstructorSessions from "./components/instructor/InstructorSessions";
import InstructorAnalytics from "./components/instructor/InstructorAnalytics";
import InstructorAI from "./components/instructor/InstructorAI";
import InstructorNotifications from "./components/instructor/InstructorNotifications";
import InstructorSettings from "./components/instructor/InstructorSettings";
import InstructorMockTests from "./components/instructor/InstructorMockTests";

/* Admin Dashboard */
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminOverview from "./components/admin/AdminOverview";
import AdminStudents from "./components/admin/AdminStudents";
import AdminInstructors from "./components/admin/AdminInstructors";
import AdminApplications from "./components/admin/AdminApplications";
import AdminCourses from "./components/admin/AdminCourses";
import AdminLeaderboard from "./components/admin/AdminLeaderboard";
import InstructorApplicationStatus from "./components/common/InstructorApplicationStatus";
import PrivacyPolicy from "./components/common/PrivacyPolicy";
import TermsOfService from "./components/common/TermsOfService";
import CourseDemo from "./components/course/CourseDemo";
import AboutUs from "./pages/AboutUs";
import QuestionBank from "./components/common/QuestionBank";
import Blogs from "./components/common/Blogs";
import BoardCourses from "./components/Boards/BoardCourses";
import CoursePage from "./components/course/CoursePage";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Layout = () => (
  <div className="bg-slate-950 text-slate-100 min-h-screen">
    <Navbar />
    <Outlet />
    <Footer />
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(loadCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [user, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          {/* ── Public ── */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="courses" element={<Courses />} />
          <Route path="community" element={<Community />} />
          <Route path="instructors" element={<Instructors />} />
          <Route path="become-instructor" element={<BecomeInstructor />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="courses/:id/demo" element={<CourseDemo />} />
          <Route path="question-bank" element={<QuestionBank />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="courses/:id" element={<CoursePage />} />
          <Route path="boards/:board" element={<BoardCourses />} />
          <Route
            path="become-instructor/apply"
            element={<BecomeInstructorApplication />}
          />
          <Route
            path="instructor-application/status"
            element={<InstructorApplicationStatus />}
          />
          <Route path="plans" element={<Plans />} />
          <Route path="contact" element={<Contact />} />
          <Route path="help-center" element={<HelpCenter />} />
          <Route path="faq" element={<Faq />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="instructor-details" element={<InstructorDetails />} />

          {/* ========================= */}
          {/* STUDENT DASHBOARD         */}
          {/* ========================= */}
          <Route
            path="student-dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="courses" element={<Courses />} />
            <Route path="my-courses" element={<MyCoursesSection />} />
            <Route path="ai-tutor" element={<AITutor />} />
            <Route path="community" element={<CommunitySection />} />
            <Route path="settings" element={<SettingsSection />} />
            <Route path="leaderboard" element={<LeaderBoard />} />
            <Route path="sessions" element={<StudentSessions />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="certificates" element={<CertificatesSection />} />

            {/* ── Mock Tests (nested layout with sub-nav) ── */}
            <Route path="mock-tests" element={<MockTestsLayout />}>
              <Route index element={<AvailableMockTests />} />
              <Route path="results" element={<MockTestResultsAnalytics />} />
              <Route path="leaderboard" element={<MockTestLeaderboard />} />
            </Route>
          </Route>

          {/* ── Mock Test full-screen routes (no sidebar sub-nav during test) ── */}
          <Route
            path="student-dashboard/mock-tests/take/:testId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MockTestPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="student-dashboard/mock-tests/result/:attemptId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MockTestResultsAnalytics />
              </ProtectedRoute>
            }
          />

          {/* ========================= */}
          {/* INSTRUCTOR DASHBOARD      */}
          {/* ========================= */}
          <Route
            path="instructor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["instructor"]}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<InstructorHome />} />
            <Route path="courses" element={<InstructorCourses />} />
            <Route path="students" element={<InstructorStudents />} />
            <Route path="sessions" element={<InstructorSessions />} />
            <Route path="analytics" element={<InstructorAnalytics />} />
            <Route path="mock-tests" element={<InstructorMockTests />} />
            <Route path="ai" element={<InstructorAI />} />
            <Route path="notifications" element={<InstructorNotifications />} />
            <Route path="settings" element={<InstructorSettings />} />
          </Route>

          {/* ========================= */}
          {/* ADMIN DASHBOARD           */}
          {/* ========================= */}
          <Route
            path="admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
          </Route>

          {/* ── Legacy redirects ── */}
          <Route
            path="ai-tutor"
            element={<Navigate to="/student-dashboard/ai-tutor" replace />}
          />
          <Route
            path="my-courses"
            element={<Navigate to="/student-dashboard/my-courses" replace />}
          />
          <Route
            path="certificates"
            element={<Navigate to="/student-dashboard/certificates" replace />}
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
