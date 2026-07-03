import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Plans = () => {
  const { t } = useTranslation();

  const plans = [
    {
      id: 'base',
      title: t('plans.base.title'),
      price: t('plans.base.price'),
      period: t('plans.base.period'),
      amount: 10000, // ₹100.00
      desc: t('plans.base.desc'),
      features: t('plans.base.features', { returnObjects: true }) || [],
      button: t('plans.base.button'),
      highlight: true,
      color: '#6366f1',
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);

  const handlePlanClick = (plan) => {
    if (!user) {
      // Not logged in — send to login, come back here after
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    // Logged in — go to billing with the chosen plan
    navigate('/billing', { state: { plan } });
  };

  return (
    <section className="px-6 md:px-10 py-24 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-medium mb-3">
            {t('plans.flexiblePricing')}
          </p>
          <h2 className="text-5xl font-bold text-white">
            {t('plans.heading')}
          </h2>
          <p className="text-slate-400 text-lg mt-5 max-w-2xl mx-auto">
            {t('plans.subtitle')}
          </p>
        </div>

        {/* Cards */}
        <div className="max-w-md mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-[32px] p-8 border transition duration-300 hover:-translate-y-2
                ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-indigo-600 to-purple-700 border-indigo-400 shadow-2xl shadow-indigo-500/20'
                    : 'bg-white/5 border-white/10 backdrop-blur-xl'
                }`}
            >
              {plan.highlight && (
                <div className="absolute top-5 right-5 bg-white text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">
                  {t('plans.mostPopular')}
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
                      ? 'bg-white text-indigo-700 hover:bg-slate-100'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
              >
                {user ? plan.button : t('plans.loginToContinue')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;
