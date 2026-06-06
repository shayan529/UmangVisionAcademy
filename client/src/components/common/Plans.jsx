import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

const plans = [
  {
    id: "base",
    title: "Base Plan",
    price: "₹499",
    period: "month",
    amount: 49900, // paise for Razorpay
    desc: "Everything you need to start learning — structured courses, AI tools, and progress tracking.",
    features: [
      "Classes 1–12 Courses",
      "Recorded Classes & Resources",
      "AI Tutor Assistance",
      "Practice Quizzes & Tests",
      "Assignment Grading",
      "Student Progress Tracking",
    ],
    button: "Get Started",
    highlight: false,
    color: "#6366f1",
  },
  {
    id: "premium",
    title: "Premium",
    price: "₹999",
    period: "month",
    amount: 99900,
    desc: "Unlimited access to courses, quizzes, assignments and AI-powered learning.",
    features: [
      "Classes 1–12 Courses",
      "AI Tutor Assistance",
      "Recorded Classes & Resources",
      "Practice Quizzes & Tests",
      "Personalized Learning Paths",
      "Live Interactive Classes",
    ],
    button: "Start Learning",
    highlight: true,
    color: "#a78bfa",
  },
];

const Plans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);

  const handlePlanClick = (plan) => {
    if (!user) {
      // Not logged in — send to login, come back here after
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    // Logged in — go to billing with the chosen plan
    navigate("/billing", { state: { plan } });
  };

  return (
    <section className="px-6 md:px-10 py-24 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-medium mb-3">Flexible Pricing</p>
          <h2 className="text-5xl font-bold text-white">Subscription Plans</h2>
          <p className="text-slate-400 text-lg mt-5 max-w-2xl mx-auto">
            Choose the perfect plan for learning, team training.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-[32px] p-8 border transition duration-300 hover:-translate-y-2
                ${
                  plan.highlight
                    ? "bg-gradient-to-b from-indigo-600 to-purple-700 border-indigo-400 shadow-2xl shadow-indigo-500/20"
                    : "bg-white/5 border-white/10 backdrop-blur-xl"
                }`}
            >
              {plan.highlight && (
                <div className="absolute top-5 right-5 bg-white text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-3xl font-bold text-white">{plan.title}</h3>

              <h2 className="text-5xl font-extrabold text-white mt-6">
                {plan.price}
                <span className="text-xl font-medium text-slate-300">
                  /{plan.period}
                </span>
              </h2>

              <p className="text-slate-200 mt-5 leading-relaxed">{plan.desc}</p>

              <div className="mt-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm shrink-0">
                      ✓
                    </div>
                    <p className="text-slate-100">{feature}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePlanClick(plan)}
                className={`mt-10 w-full py-4 rounded-2xl font-semibold transition duration-300 cursor-pointer
                  ${
                    plan.highlight
                      ? "bg-white text-indigo-700 hover:bg-slate-100"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
              >
                {user ? plan.button : "Log in to continue"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;
