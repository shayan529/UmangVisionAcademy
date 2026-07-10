import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadCurrentUser } from "./redux/slices/authSlice";
import { fetchCart } from "./redux/slices/cartSlice";

import Navbar from "./Layout/Navbar";
import Footer from "./Layout/Footer";
import MobileBottomBar from "./Layout/MobileBottomBar";
import { isNativeApp } from "./utils/appEnvironment";

import Home from "./pages/Home";
import MobileChat from "./components/mobile/MobileChat";
import MobileNotes from "./components/mobile/MobileNotes";
import MobileReels from "./components/mobile/MobileReels";
import ReelsFeed from "./components/reels/ReelsFeed";
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
import { SpeedInsights } from "@vercel/speed-insights/react"

import ProtectedRoute from "./components/common/ProtectedRoute";

/* Student Dashboard */
import StudentDashboard, {
  DashboardHome,
} from "./components/student/StudentDashboard";
import MyCoursesSection from "./components/student/MyCoursesSection";
import AITutor from "./components/student/AITutor";
import CommunitySection from "./components/student/CommunitySection";
import CertificatesSection from "./components/student/CertificatesSection";
import Achievements from "./components/student/Achievements";
import SettingsSection from "./components/student/SettingsSection";
import LeaderBoard from "./components/student/LeaderBoard";
import StudentNotifications from "./components/student/StudentNotifications";
import StudentSessions from "./components/student/StudentSessions";
import StudentWallet from "./components/student/StudentWallet";
import ReferralPage from "./components/student/ReferralPage";
import StudentReferences from "./components/student/StudentReferences";

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
import StaffDashboard from "./components/admin/StaffDashboard";
import AdminOverview from "./components/admin/AdminOverview";
import AdminStudents from "./components/admin/AdminStudents";
import AdminInstructors from "./components/admin/AdminInstructors";
import AdminApplications from "./components/admin/AdminApplications";
import AdminCourses from "./components/admin/AdminCourses";
import AdminLeaderboard from "./components/admin/AdminLeaderboard";
import AdminReels from "./components/admin/AdminReels";
import MyReels from "./components/reels/MyReels";
import InstructorApplicationStatus from "./components/common/InstructorApplicationStatus";
import PrivacyPolicy from "./components/common/PrivacyPolicy";
import TermsOfService from "./components/common/TermsOfService";
import CourseDemo from "./components/course/CourseDemo";
import AboutUs from "./pages/AboutUs";
import QuestionBank from "./components/common/QuestionBank";
import Blogs from "./components/common/Blogs";
import BoardCourses from "./components/Boards/BoardCourses";
import CoursePage from "./components/course/CoursePage";
import ProgressPage from "./components/student/ProgressPage";
import PurchaseHistory from "./components/student/PurchaseHistory";
import InstructorAboutPage from "./components/common/InstructorAboutPage";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Layout = () => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const nativeApp = isNativeApp();
  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth < 768;
  const showMobileBottomBar = nativeApp || isMobileViewport;

  // Show Navbar and Footer for all non-native app users, regardless of auth status
  const showNavbarAndFooter = nativeApp ? isAuthenticated : true;

  return (
    <div className={`bg-slate-950 text-slate-100 min-h-screen ${showMobileBottomBar ? 'pb-[calc(5rem+env(safe-area-inset-bottom))]' : 'pb-0'} md:pb-0`}>
      {showNavbarAndFooter && <Navbar />}
      <div className={showNavbarAndFooter ? "pb-8" : ""}>
        <Outlet />
      </div>
      {showMobileBottomBar && <MobileBottomBar />}
      {showNavbarAndFooter && <Footer />}
    </div>
  );
};

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((s) => s.auth);
  const location = useLocation();

  useEffect(() => {
    dispatch(loadCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [user, dispatch]);

  const nativeApp = isNativeApp();
  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth < 768;
  const showMobileNav = nativeApp || isMobileViewport;

  // ── Loading state (to prevent flash of unauthenticated content) ───────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1120",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #1e293b",
              borderTopColor: "#7c3aed",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Unauthenticated APK Redirect Logic ────────────────────────────────────
  if (nativeApp && !isAuthenticated) {
    const publicAuthRoutes = ["/login", "/signup", "/privacy", "/terms"];
    // If we are NOT on a public auth page, force redirect to login
    if (!publicAuthRoutes.includes(location.pathname)) {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          {/* ── Mobile-Only Navigation Views ── */}
          {showMobileNav && (
            <>
              <Route path="mobile/chat" element={<MobileChat />} />
              <Route path="mobile/notes" element={<MobileNotes />} />
              <Route path="mobile/reels" element={<MobileReels />} />
              <Route path="reels" element={<ReelsFeed />} />
            </>
          )}

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
          <Route path="instructors/:id" element={<InstructorAboutPage />} />
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
            <Route path="notes" element={<MobileNotes />} />
            <Route path="ai-tutor" element={<AITutor />} />
            <Route path="community" element={<CommunitySection />} />
            <Route path="settings" element={<SettingsSection />} />
            <Route path="leaderboard" element={<LeaderBoard />} />
            <Route path="referral" element={<ReferralPage />} />
            <Route path="references" element={<StudentReferences />} />
            <Route path="sessions" element={<StudentSessions />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="certificates" element={<CertificatesSection />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="wallet" element={<StudentWallet />} />
            <Route path="reels" element={<ReelsFeed />} />
            <Route path="my-reels" element={<MyReels />} />
            <Route path="purchase-history" element={<PurchaseHistory />} />

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
            <Route path="reels" element={<AdminReels />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
          </Route>

          {/* ========================= */}
          {/* STAFF DASHBOARD           */}
          {/* ========================= */}
          <Route
            path="staff-dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

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
