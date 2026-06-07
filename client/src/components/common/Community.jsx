import { useTranslation } from 'react-i18next';

const Community = () => {
  const { t } = useTranslation();

  const communities = [
    {
      title: t('community.feature1.title'),
      desc: t('community.feature1.desc'),
      icon: '🎤',
    },
    {
      title: t('community.feature2.title'),
      desc: t('community.feature2.desc'),
      icon: '🤖',
    },
    {
      title: t('community.feature3.title'),
      desc: t('community.feature3.desc'),
      icon: '🔒',
    },
  ];

  return (
    <section className="px-6 md:px-10 py-24 bg-[#0B1120] overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-100 sm:h-100 bg-indigo-500/20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-100 sm:h-100 bg-cyan-500/20 blur-3xl rounded-full"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-20">
          <p className="text-indigo-400 font-medium mb-4">
            {t('community.tag')}
          </p>
          <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            {t('community.heading')}
          </h2>
          <p className="text-slate-400 text-lg mt-6 max-w-3xl mx-auto leading-relaxed">
            {t('community.description')}
          </p>
        </div>

        {/* Main Section */}
        <div className="grid gap-10 lg:grid-cols-2 items-stretch mb-16">
          {/* Left Side - Demo Image */}
          <div className="relative h-full">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 blur-3xl rounded-[40px]"></div>
            <div className="relative overflow-hidden rounded-[32px] group ">
              <img
                src="/InstructorCommunityDemo.png"
                alt="Instructor Community Demo"
                className="w-full rounded-[32px] border border-white/10 shadow-2xl transition-all duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 rounded-[32px]"></div>
            </div>
            <div className="mt-8 space-y-4 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  💬
                </div>
                <p className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-200 font-medium backdrop-blur-sm">
                  {t('community.leftItem1')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  🎥
                </div>
                <p className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-200 font-medium backdrop-blur-sm">
                  {t('community.leftItem2')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 ml-2 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  📚
                </div>
                <p className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-200 font-medium backdrop-blur-sm">
                  {t('community.leftItem3')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  🤝
                </div>
                <p className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-200 font-medium backdrop-blur-sm">
                  {t('community.leftItem4')}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Instructor Community */}
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[36px] p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {t('community.cardTitle')}
                  </h3>
                  <p className="text-slate-400 mt-1">
                    {t('community.cardSubtitle')}
                  </p>
                </div>
                <div className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl text-sm">
                  {t('community.premiumBadge')}
                </div>
              </div>

              <div className="bg-[#111827] rounded-3xl p-6 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {t('community.communityName')}
                    </h4>
                    <p className="text-slate-400 mt-2">
                      {t('community.communitySubtitle')}
                    </p>
                  </div>
                  <div className="text-indigo-400 font-bold">
                    {t('community.membersCount')}
                  </div>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full mt-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-3 w-[85%] rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-3xl font-bold text-indigo-400">
                    {t('community.liveSessionsTitle')}
                  </h3>
                  <p className="text-slate-400 mt-2">
                    {t('community.liveSessionsDesc')}
                  </p>
                </div>
                <div className="bg-[#111827] p-6 rounded-3xl border border-white/5">
                  <h3 className="text-3xl font-bold text-cyan-400">
                    {t('community.activeMembersTitle')}
                  </h3>
                  <p className="text-slate-400 mt-2">
                    {t('community.activeMembersDesc')}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl p-6 text-white">
                <h3 className="text-2xl font-bold">
                  {t('community.aiAssistantTitle')}
                </h3>
                <p className="mt-2 text-white/80">
                  {t('community.aiAssistantDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            {t('community.featuresHeading')}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[28px] p-8 hover:-translate-y-2 transition duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mb-6">
                  {community.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {community.title}
                </h3>
                <p className="text-slate-400 mt-4 leading-relaxed">
                  {community.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
