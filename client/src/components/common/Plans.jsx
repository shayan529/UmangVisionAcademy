import { useEffect, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchSubscription } from '../../redux/slices/billingSlice';

const BillingPage = lazy(() => import('../../pages/BillingPage'));

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
      features: Array.isArray(t('plans.base.features', { returnObjects: true }))
        ? t('plans.base.features', { returnObjects: true })
        : [
            "Select one Class (Class 9 to 12)",
            "Access all subjects of that class",
            "Live Lessons and Resources",
            "AI Tutor & Quizzes",
            "Progress Tracking",
          ],
      button: t('plans.base.button'),
      highlight: false,
      color: '#6366f1',
    },
    {
      id: 'premium',
      title: t('plans.premium.title', { defaultValue: 'Premium' }),
      price: t('plans.premium.price', { defaultValue: '₹500' }),
      period: t('plans.premium.period', { defaultValue: 'year' }),
      amount: 50000, // ₹500.00
      desc: t('plans.premium.desc', {
        defaultValue:
          'Everything in Base, plus live support and deeper personalization for serious exam prep.',
      }),
      features: Array.isArray(
        t('plans.premium.features', {
          returnObjects: true,
          defaultValue: [
            'Everything in Base plan',
            'Live doubt-clearing sessions with instructors',
            'Personalized AI-powered study plan',
            'Priority instructor support',
            'Advanced mock test analytics & performance insights',
          ],
        }),
      )
        ? t('plans.premium.features', {
            returnObjects: true,
            defaultValue: [
              'Everything in Base plan',
              'Live doubt-clearing sessions with instructors',
              'Personalized AI-powered study plan',
              'Priority instructor support',
              'Advanced mock test analytics & performance insights',
            ],
          })
        : [
            'Everything in Base plan',
            'Live doubt-clearing sessions with instructors',
            'Personalized AI-powered study plan',
            'Priority instructor support',
            'Advanced mock test analytics & performance insights',
          ],
      button: t('plans.premium.button', { defaultValue: 'Go Premium' }),
      highlight: true,
      color: '#a78bfa',
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { subscription } = useSelector((s) => s.billing);

  useEffect(() => {
    if (user) {
      dispatch(fetchSubscription());
    }
  }, [user, dispatch]);

  if (subscription?.status === 'active' || subscription?.status === 'cancelled') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading Billing Info...</div>}>
        <BillingPage />
      </Suspense>
    );
  }

  const handlePlanClick = (plan) => {
    if (!user) {
      // Not logged in — send to login, come back here after
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    // Logged in — go to billing with the chosen plan
    navigate('/student-dashboard/billing', { state: { plan } });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-[32px] p-8 border transition duration-300 hover:-translate-y-2
                ${plan.highlight
                  ? 'bg-gradient-to-b from-indigo-600 to-purple-700 border-indigo-400 shadow-2xl shadow-indigo-500/20 md:scale-105'
                  : 'bg-white/5 border-white/10 backdrop-blur-xl'
                }`}
            >
              {plan.highlight && (
                <div className="absolute top-5 right-5 bg-white text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">
                  {t('plans.mostPopular')}
                </div>
              )}

              <h3
                className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-white'
                  }`}
              >
                {plan.title}
              </h3>

              <h2 className="text-5xl font-extrabold text-white mt-6">
                {plan.price}
                <span
                  className={`text-xl font-medium ${plan.highlight ? 'text-slate-300' : 'text-slate-400'
                    }`}
                >
                  /{plan.period}
                </span>
              </h2>

              <p
                className={`mt-5 leading-relaxed ${plan.highlight ? 'text-slate-200' : 'text-slate-400'
                  }`}
              >
                {plan.desc}
              </p>

              <div className="mt-8 space-y-4">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 ${plan.highlight
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-green-500/10 text-green-400'
                        }`}
                    >
                      ✓
                    </div>
                    <p
                      className={
                        plan.highlight ? 'text-slate-100' : 'text-slate-300'
                      }
                    >
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePlanClick(plan)}
                className={`mt-10 w-full py-4 rounded-2xl font-semibold transition duration-300 cursor-pointer
                  ${plan.highlight
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