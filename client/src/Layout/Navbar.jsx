import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-lg border-b border-white/10">
      <div className="w-full px-4 md:px-12 py-4 md:py-5 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4 md:gap-10">
          {/* Logo */}

          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-indigo-500/30">
              S
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide">
                Skill<span className="text-indigo-400">Sphere</span>
              </h1>

              <p className="text-[11px] text-slate-400 -mt-1">
                AI Powered Learning
              </p>
            </div>
          </Link>

          {/* Navigation */}

          <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-300">
            <Link
              to="/courses"
              className="hover:text-indigo-300 transition duration-300"
            >
              Courses
            </Link>

          

            <Link
              to="/community"
              className="hover:text-indigo-300 transition duration-300"
            >
              Community
            </Link>

            <Link
              to="/plans"
              className="hover:text-indigo-300 transition duration-300"
            >
              Plans
            </Link>

            <Link
              to="/become-instructor"
              className="hover:text-indigo-300 transition duration-300"
            >
              Become Instructor
            </Link>
          </div>
        </div>

        {/* Right Section */}

        <div className="flex items-center gap-3 ml-auto justify-end">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-white hover:bg-white/5 transition"
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>

          {!user && (
            <>
              <Link
                to="/login"
                className="hidden md:inline-flex items-center text-white hover:text-indigo-300 transition"
              >
                Login
              </Link>

              <Link
                to="/become-instructor"
                className="hidden md:inline-flex items-center bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
              >
                Get Started
              </Link>
            </>
          )}

          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-semibold">Welcome</p>
                <p className="text-slate-400 text-xs break-all">{user?.name}</p>
              </div>

              <Link
                to={
                  user?.role === "instructor"
                    ? "/instructor-dashboard"
                    : "/student-dashboard"
                }
                className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap bg-gradient-to-r from-indigo-400 to-indigo-500 hover:scale-105 transition duration-300 text-black font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
              >
                Dashboard
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap bg-gradient-to-r from-red-500 to-rose-500 hover:scale-105 transition duration-300 text-black font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-rose-500/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`md:hidden bg-[#0f172a] border-t border-white/10 px-4 pb-4 transition-all duration-300 ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div className="space-y-3 pt-4">
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white hover:text-indigo-300 transition"
          >
            Courses
          </Link>
         
          <Link
            to="/community"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white hover:text-indigo-300 transition"
          >
            Community
          </Link>
          <Link
            to="/plans"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white hover:text-indigo-300 transition"
          >
            Plans
          </Link>
          <Link
            to="/become-instructor"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-white hover:text-indigo-300 transition"
          >
            Become Instructor
          </Link>

          {!user ? (
            <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-500 px-4 py-3 text-black font-semibold shadow-lg shadow-indigo-500/20 transition duration-300"
              >
                Login
              </Link>
              <Link
                to="/become-instructor"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-500 px-4 py-3 text-black font-semibold shadow-lg shadow-indigo-500/20 transition duration-300"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
              <Link
                to={
                  user?.role === "instructor"
                    ? "/instructor-dashboard"
                    : "/student-dashboard"
                }
                onClick={() => setMobileMenuOpen(false)}
               className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-400 to-indigo-500 px-4 py-3 text-black font-semibold shadow-lg shadow-indigo-500/20 transition duration-300"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate("/");
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 text-black font-semibold"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
