import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/slices/authSlice';

const Navbar = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isInstructorDashboard = pathname.startsWith('/instructor-dashboard');

  const role = user?.roles;
  const hasInstructorRole = role?.includes('instructor');
  const hasStudentRole = role?.includes('student');
  const hasAdminRole = role?.includes('admin');
  const isMultiRole = hasInstructorRole && hasStudentRole && !hasAdminRole;

  const dashboardPath = hasAdminRole
    ? '/admin-dashboard'
    : hasInstructorRole
      ? '/instructor-dashboard'
      : '/student-dashboard';

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className="w-full sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-lg border-b border-white/10">
      <div className="w-full px-4 md:px-12 py-4 md:py-5 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold text-lg md:text-xl shadow-lg shadow-indigo-500/30">
            S
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              Umang Vision<span className="text-indigo-400"> Academy</span>
            </h1>
          </div>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-300 mx-8">
          <Link
            to="/courses"
            className="hover:text-indigo-300 transition duration-300"
          >
            Courses
          </Link>
          {/* <Link
            to="/community"
            className="hover:text-indigo-300 transition duration-300"
          >
            Community
          </Link> */}
          <Link
            to="/plans"
            className="hover:text-indigo-300 transition duration-300"
          >
            Plans
          </Link>
          {!hasInstructorRole && !hasAdminRole && (
            <Link
              to="/become-instructor"
              className="hover:text-indigo-300 transition duration-300"
            >
              Become Instructor
            </Link>
          )}
        </div>

        {/* ── Desktop right section ── */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {loading ? (
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">
                Verifying session...
              </span>
            </div>
          ) : !user ? (
            <>
              <Link
                to="/login"
                className="text-white hover:text-indigo-300 transition"
              >
                Login
              </Link>
              <Link
                to="/become-instructor"
                className="bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <div className="text-right">
                <p className="text-white text-sm font-semibold">Welcome</p>
                <p className="text-slate-400 text-xs">{user?.name}</p>
              </div>
              {isMultiRole ? (
                <Link
                  to={
                    isInstructorDashboard
                      ? '/student-dashboard'
                      : '/instructor-dashboard'
                  }
                  className="whitespace-nowrap bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  {isInstructorDashboard
                    ? 'Go to Student Dashboard'
                    : 'Go to Instructor Dashboard'}
                </Link>
              ) : (
                <Link
                  to={dashboardPath}
                  className="whitespace-nowrap bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  dispatch(logoutUser());
                  navigate('/');
                }}
                className="whitespace-nowrap bg-gradient-to-r from-red-500 to-rose-500 hover:scale-105 transition duration-300 text-black font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/20"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden ml-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white hover:bg-white/5 transition text-lg"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={`md:hidden border-t border-white/10 overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-screen' : 'max-h-0'}`}
      >
        <div className="px-4 pt-3 pb-4 space-y-1">
          {/* Nav links — compact text rows */}
          {[
            { to: '/courses', label: 'Courses' },
            // { to: "/community", label: "Community" },
            { to: '/plans', label: 'Plans' },
            ...(!hasInstructorRole && !hasAdminRole
              ? [{ to: '/become-instructor', label: 'Become Instructor' }]
              : []),
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              {label}
            </Link>
          ))}

          {/* Divider */}
          <div className="border-t border-white/10 my-2" />

          {/* Auth section */}
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-slate-400 text-sm">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              Verifying session...
            </div>
          ) : !user ? (
            <div className="flex gap-2 pt-1">
              <Link
                to="/login"
                onClick={closeMobile}
                className="flex-1 text-center text-sm font-semibold py-2 px-3 rounded-lg border border-indigo-400/40 text-indigo-300 hover:bg-indigo-400/10 transition"
              >
                Login
              </Link>
              <Link
                to="/become-instructor"
                onClick={closeMobile}
                className="flex-1 text-center text-sm font-semibold py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-500 text-black shadow-md transition"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <>
              {/* User info row */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold text-xs shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">
                    {user.name}
                  </p>
                  <p className="text-slate-500 text-[10px] leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Action buttons — side by side, compact */}
              <div className="flex gap-2 pt-1">
                {isMultiRole ? (
                  <Link
                    to={
                      isInstructorDashboard
                        ? '/student-dashboard'
                        : '/instructor-dashboard'
                    }
                    onClick={closeMobile}
                    className="flex-1 text-center text-xs font-semibold py-2 px-2 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-500 text-black shadow-md transition"
                  >
                    {isInstructorDashboard
                      ? 'Go to Student Dashboard'
                      : 'Go to Instructor Dashboard'}
                  </Link>
                ) : (
                  <Link
                    to={dashboardPath}
                    onClick={closeMobile}
                    className="flex-1 text-center text-xs font-semibold py-2 px-2 rounded-lg bg-gradient-to-r from-indigo-400 to-indigo-500 text-black shadow-md transition"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    closeMobile();
                    dispatch(logoutUser());
                    navigate('/');
                  }}
                  className="flex-1 text-xs font-semibold py-2 px-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-black shadow-md transition"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
