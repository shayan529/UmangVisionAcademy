import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Instructor = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      title: t('instructor.benefit1.title'),
      desc: t('instructor.benefit1.desc'),
      icon: '🤖',
    },
    {
      title: t('instructor.benefit2.title'),
      desc: t('instructor.benefit2.desc'),
      icon: '🎥',
    },
    {
      title: t('instructor.benefit3.title'),
      desc: t('instructor.benefit3.desc'),
      icon: '📊',
    },
  ];

  return (
    <div className="bg-[#0B1120] text-white min-h-screen">
      {/* Hero Section */}

      <section className="px-6 md:px-10 py-24 relative overflow-hidden">
        {/* Background Glow */}

        <div className="absolute top-0 left-0 w-64 h-64 sm:w-100 sm:h-100 bg-indigo-500/20 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-100 sm:h-100 bg-cyan-500/20 blur-3xl rounded-full"></div>

        <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-2 items-center relative z-10">
          {/* Left Content */}

          <div>
            <p className="text-indigo-400 font-medium mb-5">
              {t('instructor.tag')}
            </p>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              {t('instructor.headingLine1')}
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
                {t('instructor.headingGradient')}
              </span>
            </h1>

            <p className="text-slate-400 text-lg md:text-xl mt-8 leading-relaxed">
              {t('instructor.description')}
            </p>

            {/* Buttons */}

            <div className="flex flex-wrap gap-5 mt-10">
              <Link
                to="/become-instructor"
                className="bg-indigo-600 hover:bg-indigo-700 transition duration-300 px-8 py-4 rounded-2xl text-white font-semibold shadow-xl shadow-indigo-500/20 inline-flex items-center justify-center"
              >
                {t('instructor.startTeaching')}
              </Link>

              <Link to="/instructor-details">
                <button className="border cursor-pointer border-white/10 hover:border-indigo-400 hover:bg-indigo-500/10 transition duration-300 px-8 py-4 rounded-2xl text-white font-semibold">
                  {t('instructor.learnMore')}
                </button>
              </Link>
            </div>
          </div>

          {/* Right Dashboard */}

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[36px] p-8 shadow-2xl">
              {/* Header */}

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">
                    {t('instructor.dashboardTitle')}
                  </h2>

                  <p className="text-slate-400 mt-1">
                    {t('instructor.dashboardSubtitle')}
                  </p>
                </div>

                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm">
                  {t('instructor.statusActive')}
                </div>
              </div>

              {/* Stats */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-3xl font-bold text-indigo-400">12K+</h3>

                  <p className="text-slate-400 mt-2">
                    {t('instructor.studentsTitle')}
                  </p>
                </div>

                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-3xl font-bold text-cyan-400">4.9</h3>

                  <p className="text-slate-400 mt-2">
                    {t('instructor.ratingTitle')}
                  </p>
                </div>
              </div>

              {/* AI Tools */}

              <div className="mt-6 bg-linear-to-r from-indigo-500 to-cyan-500 rounded-3xl p-6">
                <h3 className="text-2xl font-bold">
                  {t('instructor.assistantTitle')}
                </h3>

                <p className="mt-2 text-white/80">
                  {t('instructor.assistantDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}

      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 font-medium mb-3">
              {t('instructor.benefitsTag')}
            </p>

            <h2 className="text-5xl font-bold">
              {t('instructor.benefitsHeading')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[28px] p-8 hover:-translate-y-2 transition duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-6">
                  {benefit.icon}
                </div>

                <h3 className="text-2xl font-bold">{benefit.title}</h3>

                <p className="text-slate-400 mt-4 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Instructor;
