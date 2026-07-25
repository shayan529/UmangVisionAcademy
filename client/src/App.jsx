import React, { Suspense, lazy } from "react";
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
import Courses from "./components/common/Courses";
import Instructors from "./components/common/Instructors";
import Plans from "./components/common/Plans";
import Login from "./components/common/Login";
import Signup from "./components/common/Signup";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { SpeedInsights } from "@vercel/speed-insights/react";

// --- Lazy Loaded Components ---
const MobileChat = lazy(() => import("./components/mobile/MobileChat"));
const MobileNotes = lazy(() => import("./components/mobile/MobileNotes"));
const MobileReels = lazy(() => import("./components/mobile/MobileReels"));
const ReelsFeed = lazy(() => import("./components/reels/ReelsFeed"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Faq = lazy(() => import("./pages/Faq"));
const CartPage = lazy(() => import("./pages/CartPage"));
const InstructorDetails = lazy(() => import("./pages/InstructorDetails"));
const BillingPage = lazy(() => import("./pages/BillingPage"));

const Community = lazy(() => import("./components/common/Community"));
const BecomeInstructor = lazy(() => import("./components/common/BecomeInstructor"));
const BecomeInstructorApplication = lazy(() => import("./components/common/BecomeInstructorApplication"));

/* Student Dashboard */
const StudentDashboard = lazy(() => import("./components/student/StudentDashboard"));
const DashboardHome = lazy(() => import("./components/student/StudentDashboard").then(module => ({ default: module.DashboardHome })));
const MyCoursesSection = lazy(() => import("./components/student/MyCoursesSection"));
const AITutor = lazy(() => import("./components/student/AITutor"));
const CommunitySection = lazy(() => import("./components/student/CommunitySection"));
const CertificatesSection = lazy(() => import("./components/student/CertificatesSection"));
const Achievements = lazy(() => import("./components/student/Achievements"));
const SettingsSection = lazy(() => import("./components/student/SettingsSection"));
const LeaderBoard = lazy(() => import("./components/student/LeaderBoard"));
const StudentNotifications = lazy(() => import("./components/student/StudentNotifications"));
const StudentSessions = lazy(() => import("./components/student/StudentSessions"));
const StudentWallet = lazy(() => import("./components/student/StudentWallet"));
const ReferralPage = lazy(() => import("./components/student/ReferralPage"));
const StudentReferences = lazy(() => import("./components/student/StudentReferences"));

/* Mock Tests */
const MockTestsLayout = lazy(() => import("./components/student/MockTestsIndex"));
const AvailableMockTests = lazy(() => import("./components/student/AvailableMockTests"));
const MockTestPlayer = lazy(() => import("./components/student/MockTestPlayer"));

/* Instructor Dashboard */
const InstructorDashboard = lazy(() => import("./components/instructor/InstructorDashboard"));
const InstructorHome = lazy(() => import("./components/instructor/InstructorHome"));
const InstructorCourses = lazy(() => import("./components/instructor/InstructorCourses"));
const InstructorStudents = lazy(() => import("./components/instructor/InstructorStudents"));
const InstructorSessions = lazy(() => import("./components/instructor/InstructorSessions"));
const InstructorAnalytics = lazy(() => import("./components/instructor/InstructorAnalytics"));
const InstructorAI = lazy(() => import("./components/instructor/InstructorAI"));
const InstructorNotifications = lazy(() => import("./components/instructor/InstructorNotifications"));
const InstructorSettings = lazy(() => import("./components/instructor/InstructorSettings"));
const InstructorMockTests = lazy(() => import("./components/instructor/InstructorMockTests"));

/* Admin Dashboard */
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const StaffDashboard = lazy(() => import("./components/admin/StaffDashboard"));
const AdminOverview = lazy(() => import("./components/admin/AdminOverview"));
const AdminStudents = lazy(() => import("./components/admin/AdminStudents"));
const AdminInstructors = lazy(() => import("./components/admin/AdminInstructors"));
const AdminApplications = lazy(() => import("./components/admin/AdminApplications"));
const AdminCourses = lazy(() => import("./components/admin/AdminCourses"));
const AdminLeaderboard = lazy(() => import("./components/admin/AdminLeaderboard"));
const AdminReels = lazy(() => import("./components/admin/AdminReels"));
const MyReels = lazy(() => import("./components/reels/MyReels"));
const InstructorApplicationStatus = lazy(() => import("./components/common/InstructorApplicationStatus"));
const PrivacyPolicy = lazy(() => import("./components/common/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/common/TermsOfService"));
const RefundPolicy = lazy(() => import("./components/common/RefundPolicy"));
const CourseDemo = lazy(() => import("./components/course/CourseDemo"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const QuestionBank = lazy(() => import("./components/common/QuestionBank"));
const Blogs = lazy(() => import("./components/common/Blogs"));
const BoardCourses = lazy(() => import("./components/Boards/BoardCourses"));
const CoursePage = lazy(() => import("./components/course/CoursePage"));
const ProgressPage = lazy(() => import("./components/student/ProgressPage"));
const PurchaseHistory = lazy(() => import("./components/student/PurchaseHistory"));
const InstructorAboutPage = lazy(() => import("./components/common/InstructorAboutPage"));

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
    if (user.role === "admin") return "/admin-dashboard";
    // Custom role object → staff dashboard
    if (user.role && typeof user.role === "object") return "/staff-dashboard";
    if (user.role === "staff") return "/staff-dashboard";
    if (user.role === "instructor") return "/instructor-dashboard";
    return "/student-dashboard/settings";
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
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-purple-600 rounded-full animate-spin mb-4" />
              <p className="text-sm">Loading page...</p>
            </div>
          }>
            <Outlet />
          </Suspense>
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
    // If we already have a cached user, fire /users/me silently in the
    // background to pick up any server-side changes (role changes, bans,
    // subscription updates). The UI renders immediately from the cache —
    // no spinner — and updates once the refresh resolves.
    // If there is no cached user but a token exists, we must wait (loading=true).
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
          <Route path="refund-policy" element={<RefundPolicy />} />
          <Route path="refunds" element={<RefundPolicy />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="courses/:id/demo" element={<CourseDemo />} />
          <Route path="question-bank" element={<QuestionBank />} />

          <Route path="blogs" element={<Blogs />} />
          <Route path="courses/:id" element={<CoursePage />} />
          <Route path="boards/:board" element={<BoardCourses />} />
          <Route path="instructors/:id" element={<InstructorAboutPage />} />
          <Route
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          >
            <Route
              path="become-instructor/apply"
              element={<BecomeInstructorApplication />}
            />
            <Route
              path="instructor-application/status"
              element={<InstructorApplicationStatus />}
            />
          </Route>
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
            <Route path="billing" element={<BillingPage />} />
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

            {/* ── Mock Tests ── */}
            <Route path="mock-tests" element={<MockTestsLayout />}>
              <Route index element={<AvailableMockTests />} />
              <Route path="result/:attemptId" element={<AvailableMockTests />} />
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
