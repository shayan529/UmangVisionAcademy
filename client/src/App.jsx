import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadCurrentUser } from "./redux/slices/authSlice";
import { fetchCart } from "./redux/slices/cartSlice";

import Navbar from "./Layout/Navbar";
import Footer from "./Layout/Footer";
import MobileBottomBar from "./Layout/MobileBottomBar";
import { isNativeApp } from "./utils/appEnvironment";
import { useSwipeable } from "react-swipeable";

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
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();
  
  const nativeApp = isNativeApp();
  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth < 768;
  const showMobileBottomBar = nativeApp || isMobileViewport;

  const showNavbarAndFooter = nativeApp ? isAuthenticated : true;

  // --- Mobile Swipe Navigation Logic ---
  const [slideAnim, setSlideAnim] = useState("");
  const prevTabRef = useRef(null);

  const getProfileLink = () => {
    if (!user) return "/login";
    const hasAdminRole = user.roles?.includes("admin");
    const hasCustomRole = user.roles?.some((r) => typeof r === "object");
    const hasInstructorRole = user.roles?.includes("instructor");
    return hasAdminRole
      ? "/admin-dashboard"
      : hasCustomRole
        ? "/staff-dashboard"
        : hasInstructorRole
          ? "/instructor-dashboard"
          : "/student-dashboard/settings";
  };

  const tabs = [
    "/",
    "/mobile/chat",
    "/mobile/notes",
    "/mobile/reels",
    getProfileLink(),
  ];

  const getTabIndex = (path) => {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i] === "/") {
        if (path === "/") return i;
      } else if (path.startsWith(tabs[i])) {
        return i;
      } else if (i === 4 && path.startsWith("/student-dashboard")) {
        return i;
      } else if (i === 4 && path.startsWith("/instructor-dashboard")) {
        return i;
      }
    }
    return -1;
  };

  const currentTabIndex = getTabIndex(location.pathname);

  useEffect(() => {
    if (showMobileBottomBar && prevTabRef.current !== null && currentTabIndex !== -1 && prevTabRef.current !== currentTabIndex) {
      setSlideAnim(currentTabIndex > prevTabRef.current ? "animate-slide-in-right" : "animate-slide-in-left");
      const timer = setTimeout(() => {
        setSlideAnim("");
      }, 300);
      return () => clearTimeout(timer);
    }
    prevTabRef.current = currentTabIndex;
  }, [currentTabIndex, showMobileBottomBar]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (eventData.event.target.closest('.overflow-x-auto, .overflow-x-scroll')) return;
      if (currentTabIndex !== -1 && currentTabIndex < tabs.length - 1) {
        navigate(tabs[currentTabIndex + 1]);
      }
    },
    onSwipedRight: (eventData) => {
      if (eventData.event.target.closest('.overflow-x-auto, .overflow-x-scroll')) return;
      if (currentTabIndex > 0) {
        navigate(tabs[currentTabIndex - 1]);
      }
    },
    delta: 50,
    trackMouse: false,
  });

  return (
    <div className={`bg-slate-950 text-slate-100 min-h-screen ${showMobileBottomBar ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] overflow-x-hidden' : 'pb-0'} md:pb-0`}>
      <style>{`
        @keyframes slideInRight {
          0% { transform: translateX(30%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          0% { transform: translateX(-30%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 250ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 250ms cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
      `}</style>
      
      {showNavbarAndFooter && <Navbar />}
      
      <div 
        {...(showMobileBottomBar ? swipeHandlers : {})} 
        className={showNavbarAndFooter ? "pb-8" : ""}
      >
        <div className={showMobileBottomBar ? slideAnim : ""}>
          <Outlet />
        </div>
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
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="plans" element={<Plans />} />
            <Route path="become-instructor" element={<BecomeInstructor />} />
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
              <Route path="leaderboard/:testId" element={<MockTestLeaderboard />} />
              <Route path="result/:attemptId" element={<MockTestResultsAnalytics />} />
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
