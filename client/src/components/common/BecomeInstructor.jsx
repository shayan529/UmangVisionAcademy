import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMyApplication } from '../../redux/slices/applicationsSlice';

const steps = [
  {
    titleKey: 'becomeInstructor.steps.apply.title',
    descriptionKey: 'becomeInstructor.steps.apply.description',
  },
  {
    titleKey: 'becomeInstructor.steps.upload.title',
    descriptionKey: 'becomeInstructor.steps.upload.description',
  },
  {
    titleKey: 'becomeInstructor.steps.teach.title',
    descriptionKey: 'becomeInstructor.steps.teach.description',
  },
];

const BecomeInstructor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { myApplication, loading } = useSelector((state) => state.applications);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyApplication());
  }, [isAuthenticated, dispatch]);

  // Already an instructor — no need to be here
  useEffect(() => {
    if (user?.roles?.includes('instructor'))
      navigate('/instructor-dashboard', { replace: true });
  }, [user, navigate]);

  const handleBecomeInstructor = () => {
    if (!isAuthenticated) return navigate('/login');
    if (myApplication) return navigate('/instructor-application/status');
    navigate('/become-instructor/apply');
  };

  const buttonLabel = loading
    ? t('becomeInstructor.buttonChecking')
    : myApplication
      ? t('becomeInstructor.buttonStatus')
      : t('becomeInstructor.buttonBecome');



  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 px-4 py-2 text-sm font-semibold tracking-wide">
              {t('becomeInstructor.tag')}
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              {t('becomeInstructor.headlinePart1')}
              <span className="ml-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                {t('becomeInstructor.headlinePart2')}
              </span>
            </h1>

            <p className="max-w-2xl text-slate-400 text-lg leading-8">
              {t('becomeInstructor.subtitle')}
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-500/10 flex flex-col justify-between">
            <div className="space-y-4 mb-6">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
                {t('becomeInstructor.applyNow')}
              </p>
              <h2 className="text-3xl font-bold text-white">
                {t('becomeInstructor.startJourney')}
              </h2>
              <p className="text-slate-400 leading-7">
                {t('becomeInstructor.cardBody')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBecomeInstructor}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20 w-full text-center disabled:opacity-50"
            >
              {buttonLabel}
            </button>
          </div>
        </div>

        <section className="mt-16 grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-lg shadow-indigo-500/5">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
                {t('becomeInstructor.howItWorks')}
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white">
                {t('becomeInstructor.howItWorksHeading')}
              </h2>
              <p className="mt-4 text-slate-400 leading-7">
                {t('becomeInstructor.howItWorksBody')}
              </p>

              <div className="mt-8 space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300 text-lg font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {t(step.titleKey)}
                      </h3>
                      <p className="mt-2 text-slate-400 leading-6">
                        {t(step.descriptionKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/10 flex flex-col justify-center items-center text-center">
            <div className="space-y-6 max-w-md my-auto">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
                {t('becomeInstructor.readyToJoin')}
              </p>
              <h2 className="text-3xl font-bold text-white">
                {t('becomeInstructor.applyToTeach')}
              </h2>
              <p className="text-slate-400 leading-7">
                {t('becomeInstructor.readyBody')}
              </p>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleBecomeInstructor}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20 w-full text-center disabled:opacity-50"
                >
                  {buttonLabel}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BecomeInstructor;
