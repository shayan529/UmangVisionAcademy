import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { clearError, login } from "../../redux/slices/authSlice";

/* ── Animated particle canvas ── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const NODES = Array.from({ length: 55 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 900,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 0.8,
      alpha: Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      const W = canvas.width,
        H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
          const dx = NODES[i].x - NODES[j].x;
          const dy = NODES[i].y - NODES[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 145) {
            ctx.beginPath();
            ctx.moveTo(NODES[i].x, NODES[i].y);
            ctx.lineTo(NODES[j].x, NODES[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${(1 - dist / 145) * 0.16})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      NODES.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147,210,255,${n.alpha})`;
        ctx.fill();
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.65 }}
    />
  );
};

/* ── Login ── */
const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const dispatch = useDispatch();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await dispatch(login(formData)).unwrap(); // unwrap throws on rejection
      toast("Welcome!", { icon: "👋" });

      const isAdmin = user?.roles?.includes("admin");
      const isInstructor = user?.roles?.includes("instructor");

      const from = location.state?.from;

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (isAdmin) navigate("/admin-dashboard");
      else if (isInstructor) navigate("/instructor-dashboard");
      else navigate("/student-dashboard");
    } catch (error) {
      toast.error(error); // rejectWithValue already returns the message string
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (name) =>
    `w-full bg-white/5 border rounded-2xl px-5 py-3.5 text-white text-sm outline-none transition-all duration-300 placeholder-slate-500 ${
      focused === name
        ? "border-cyan-400/70 shadow-[0_0_0_3px_rgba(34,211,238,0.1)]"
        : "border-white/10 hover:border-white/20"
    }`;

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=DM+Sans:wght@400;500&display=swap');
        .df { font-family:'Outfit',sans-serif; }
        body, * { font-family:'DM Sans',sans-serif; }
        @keyframes pulse-orb { 0%,100%{transform:scale(1);opacity:.2} 50%{transform:scale(1.1);opacity:.32} }
        @keyframes pulse-orb2 { 0%,100%{transform:scale(1);opacity:.14} 50%{transform:scale(1.08);opacity:.22} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes spin-rev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes twinkle { 0%,100%{opacity:.15;transform:scale(.7)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes bar-load { from{width:0%} to{width:100%} }

        .orb1 { animation:pulse-orb 9s ease-in-out infinite; }
        .orb2 { animation:pulse-orb2 13s ease-in-out infinite 3s; }
        .orb3 { animation:pulse-orb 16s ease-in-out infinite 6s; }
        .ring1 { animation:spin-slow 24s linear infinite; transform-origin:center; }
        .ring2 { animation:spin-rev 34s linear infinite; transform-origin:center; }
        .floaty { animation:float 6s ease-in-out infinite; }
        .star  { animation:twinkle var(--d,3s) ease-in-out infinite var(--del,0s); }
        .su  { animation:slide-up .65s cubic-bezier(.22,1,.36,1) both; }
        .fi  { animation:fade-in .5s ease both; }

        .shimmer-txt {
          background:linear-gradient(90deg,#e2e8f0 0%,#67e8f9 40%,#818cf8 60%,#e2e8f0 100%);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:shimmer 4s linear infinite;
        }
        .card-glow {
          box-shadow:0 0 0 1px rgba(99,179,237,.12),0 25px 60px rgba(0,0,0,.55),0 0 80px rgba(56,189,248,.05),inset 0 1px 0 rgba(255,255,255,.06);
        }
        .btn-grad {
          background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);
          box-shadow:0 4px 24px rgba(14,165,233,.35),inset 0 1px 0 rgba(255,255,255,.12);
          transition:all .25s ease;
        }
        .btn-grad:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(14,165,233,.45),inset 0 1px 0 rgba(255,255,255,.18); }
        .btn-grad:active { transform:translateY(0); }
      `}</style>

      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0B1120] to-[#0d1635]" />
        <ParticleCanvas />

        {/* Glow orbs */}
        <div
          className="orb1 absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(56,189,248,.22) 0%,transparent 70%)",
          }}
        />
        <div
          className="orb2 absolute -bottom-36 -right-24 w-[620px] h-[620px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)",
          }}
        />
        <div
          className="orb3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle,rgba(14,165,233,.06) 0%,transparent 70%)",
          }}
        />

        {/* Orbit rings */}
        <div
          className="ring1 absolute top-[8%] right-[4%] w-[350px] h-[350px] rounded-full opacity-[0.07]"
          style={{ border: "1px solid rgba(147,210,255,.9)" }}
        />
        <div
          className="ring2 absolute top-[5%] right-[2%] w-[420px] h-[420px] rounded-full opacity-[0.04]"
          style={{ border: "1px dashed rgba(147,210,255,.9)" }}
        />

        {/* Grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.025]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="g"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M60 0L0 0 0 60"
                fill="none"
                stroke="rgba(147,210,255,1)"
                strokeWidth=".5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>

        {/* Stars */}
        {[
          { t: "7%", l: "10%", d: "2.8s", del: "0s" },
          { t: "14%", l: "73%", d: "3.5s", del: ".7s" },
          { t: "32%", l: "4%", d: "4s", del: "1.2s" },
          { t: "54%", l: "90%", d: "3.1s", del: ".3s" },
          { t: "72%", l: "18%", d: "2.5s", del: "1.8s" },
          { t: "83%", l: "58%", d: "3.8s", del: ".9s" },
          { t: "46%", l: "48%", d: "5s", del: "2.1s" },
          { t: "22%", l: "38%", d: "2.2s", del: ".4s" },
        ].map((s, i) => (
          <div
            key={i}
            className="star absolute w-1 h-1 rounded-full bg-white"
            style={{ top: s.t, left: s.l, "--d": s.d, "--del": s.del }}
          />
        ))}

        {/* Floating shapes */}
        <div
          className="floaty absolute top-[20%] left-[7%] w-14 h-14 opacity-[.15]"
          style={{ animationDelay: "1s" }}
        >
          <svg viewBox="0 0 56 56">
            <polygon
              points="28,4 52,48 4,48"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div
          className="floaty absolute bottom-[20%] right-[9%] w-10 h-10 opacity-[.12]"
          style={{ animationDelay: "3s" }}
        >
          <svg viewBox="0 0 40 40">
            <rect
              x="6"
              y="6"
              width="28"
              height="28"
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.5"
              transform="rotate(20 20 20)"
            />
          </svg>
        </div>
        <div
          className="floaty absolute top-[62%] left-[2%] w-8 h-8 opacity-[.18]"
          style={{ animationDelay: "2s" }}
        >
          <svg viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* ── Navbar ── */}
      {/* <nav className="fi relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/[0.06]"
        style={{ backdropFilter:"blur(12px)", animationDelay:".1s" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#0ea5e9,#6366f1)" }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="df text-lg font-black text-white tracking-tight">
            AI<span className="text-cyan-400">Coach</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          {["Courses","Test Series","Resources"].map(n => (
            <span key={n} className="hover:text-cyan-300 cursor-pointer transition-colors">{n}</span>
          ))}
        </div>
        <Link to="/signup"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-400/20 hover:border-cyan-400/40 px-4 py-1.5 rounded-xl">
          Sign Up
        </Link>
      </nav> */}

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-5xl flex items-center gap-14">
          {/* Left hero */}
          <div
            className="hidden lg:flex flex-col flex-1 gap-8 su"
            style={{ animationDelay: ".2s" }}
          >
            <div className="floaty relative">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-20"
                style={{
                  background: "radial-gradient(circle,#38bdf8,transparent 70%)",
                }}
              />
              <svg viewBox="0 0 300 320" className="w-72 h-72 drop-shadow-2xl">
                {[
                  { x: 30, y: 20, f: "#38bdf8", r: 20 },
                  { x: 200, y: 10, f: "#6366f1", r: 45 },
                  { x: 250, y: 50, f: "#0ea5e9", r: -15 },
                  { x: 10, y: 150, f: "#818cf8", r: 30 },
                ].map((c, i) => (
                  <rect
                    key={i}
                    x={c.x}
                    y={c.y}
                    width="9"
                    height="9"
                    fill={c.f}
                    transform={`rotate(${c.r} ${c.x + 4.5} ${c.y + 4.5})`}
                    rx="1"
                    opacity=".8"
                  />
                ))}
                <path d="M270 130L278 115 286 130Z" fill="#38bdf8" />
                <path d="M15 80L22 67 29 80Z" fill="#6366f1" />
                <path
                  d="M240 70l3 9h9l-7 5 3 9-8-5-8 5 3-9-7-5h9z"
                  fill="#38bdf8"
                  opacity=".9"
                />
                <circle cx="150" cy="180" r="90" fill="rgba(14,165,233,.05)" />
                <circle cx="150" cy="100" r="35" fill="#0d1f3c" />
                <circle cx="150" cy="100" r="28" fill="#f5c5a3" />
                <circle cx="141" cy="96" r="3" fill="#1a1a2e" />
                <circle cx="159" cy="96" r="3" fill="#1a1a2e" />
                <path
                  d="M141 108Q150 116 159 108"
                  stroke="#1a1a2e"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect
                  x="128"
                  y="72"
                  width="44"
                  height="8"
                  fill="#0d1f3c"
                  rx="1"
                />
                <polygon points="150,58 128,72 172,72" fill="#0d1f3c" />
                <rect x="172" y="74" width="3" height="14" fill="#0d1f3c" />
                <circle cx="173.5" cy="90" r="5" fill="#38bdf8" />
                <path
                  d="M110 135Q120 128 150 130Q180 128 190 135L200 240 100 240Z"
                  fill="#0d1f3c"
                />
                <path
                  d="M135 130L150 155 165 130"
                  fill="#0ea5e9"
                  opacity=".9"
                />
                <path
                  d="M188 145Q210 130 225 110"
                  stroke="#f5c5a3"
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="225" cy="110" r="10" fill="#f5c5a3" />
                <rect
                  x="195"
                  y="95"
                  width="32"
                  height="22"
                  fill="#e8f4ff"
                  rx="3"
                />
                <path
                  d="M200 102h22M200 108h16M200 114h20"
                  stroke="#aac"
                  strokeWidth="1.5"
                />
                <path
                  d="M112 145Q95 175 90 200"
                  stroke="#0d1f3c"
                  strokeWidth="14"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect
                  x="125"
                  y="235"
                  width="20"
                  height="55"
                  fill="#0d1f3c"
                  rx="4"
                />
                <rect
                  x="155"
                  y="235"
                  width="20"
                  height="55"
                  fill="#0d1f3c"
                  rx="4"
                />
                <ellipse cx="135" cy="292" rx="18" ry="8" fill="#060d1f" />
                <ellipse cx="165" cy="292" rx="18" ry="8" fill="#060d1f" />
              </svg>
            </div>

            <div>
              <p className="text-cyan-400/70 text-xs font-semibold tracking-[.2em] uppercase mb-3">
                AI-Powered Learning
              </p>
              <h1 className="df text-5xl font-black leading-[1.1] text-white">
                Discover.
                <br />
                Prepare. <span className="shimmer-txt">Succeed.</span>
              </h1>
              <p className="text-slate-400 mt-4 text-sm leading-relaxed max-w-xs">
                Premier AI coaching for classes 1 to 12 and more — personalised
                to your pace, designed for your success.
              </p>
              <div className="mt-7 flex items-center gap-7">
                {[
                  ["50K+", "Students"],
                  ["200+", "Courses"],
                  ["98%", "Pass Rate"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <p className="df text-xl font-black text-white">{n}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right card */}
          <div
            className="w-full max-w-md su"
            style={{ animationDelay: ".35s" }}
          >
            <div
              className="h-[2px] w-full rounded-t-full mb-[-2px] relative z-10"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#38bdf8,#6366f1,transparent)",
              }}
            />

            <div
              className="card-glow rounded-3xl p-9"
              style={{
                background:
                  "linear-gradient(160deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 100%)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="text-center mb-8">
                {/* <div className="inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-4"
                  style={{ background:"linear-gradient(135deg,rgba(14,165,233,.2),rgba(99,102,241,.2))", border:"1px solid rgba(56,189,248,.25)" }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#38bdf8" strokeWidth="1.8"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div> */}
                <h2 className="df text-3xl font-black text-white">
                  Welcome Back
                </h2>
                <p className="text-slate-400 mt-1.5 text-sm">
                  Continue your learning journey
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    placeholder="you@example.com"
                    required
                    className={inputCls("email")}
                  />
                </div>

                {/* Role */}
                {/* <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 tracking-widest uppercase">Role</label>
                  <select name="role" value={formData.role} onChange={handleChange}
                    onFocus={() => setFocused("role")} onBlur={() => setFocused("")}
                    required className={inputCls("role")} style={{ colorScheme:"dark" }}>
                    <option value="" disabled>Select your role</option>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div> */}

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 tracking-widest uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder="••••••••••"
                      required
                      className={inputCls("password") + " pr-12"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mb-1.5">
                  <button
                    type="button"
                    className="text-xs cursor-pointer mb-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-grad w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 mt-1 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="rgba(255,255,255,.3)"
                          strokeWidth="3"
                        />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none">
                        <path
                          d="M4 10h12M10 4l6 6-6 6"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-500 text-sm mt-6">
                New here?{" "}
                <Link
                  to="/signup"
                  onClick={() => dispatch(clearError())}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
