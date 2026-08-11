import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";
import {
  Heart,
  BookOpen,
  Sparkles,
  Award,
  ShieldCheck,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe,
  ArrowRight,
  FileText,
  DollarSign,
  Gift,
  Smile,
  Zap,
  HelpCircle,
} from "lucide-react";

// 5 High Quality Carousel Images of Village Children Studying
const carouselSlides = [
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    title: "Bringing Free AI-Powered Education to Remote Village Classrooms",
    subtitle: "Empowering rural children with digital learning tools and interactive AI coaching.",
    badge: "Digital Education Initiative",
  },
  {
    url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
    title: "Distributing Free Study Material, Books & Printed Notes",
    subtitle: "Hand-delivering NCERT guides, formula sheets, and stationery to underprivileged students.",
    badge: "Resource Distribution",
  },
  {
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
    title: "Bridging the Opportunity Gap for Every Aspiring Village Learner",
    subtitle: "Ensuring no child drops out of school due to financial hardship or lack of guidance.",
    badge: "Equal Opportunity",
  },
  {
    url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    title: "Sponsoring Exam Fees & Higher Education Coaching",
    subtitle: "Funding JEE, NEET, and Board Examination fees for meritorious village youth.",
    badge: "Scholarships & Exam Grants",
  },
  {
    url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80",
    title: "Building Solar-Powered Digital Learning Hubs in Villages",
    subtitle: "Equipping rural communities with tablets, power backups, and internet connectivity.",
    badge: "Smart Village Centers",
  },
];

const donationTiers = [
  {
    amount: 500,
    title: "Sponsor 2 Village Students",
    impact: "Provides 1 month of free AI Coaching, digital notes & practice quizzes for 2 rural students.",
    popular: false,
  },
  {
    amount: 1500,
    title: "Study Material Kit",
    impact: "Sponsors printed NCERT books, question banks & stationery supplies for a Board aspirant.",
    popular: true,
  },
  {
    amount: 5000,
    title: "Full Year Scholarship",
    impact: "Covers complete 1-year coaching, test series & competitive exam registration fees.",
    popular: false,
  },
  {
    amount: 10000,
    title: "Village Digital Hub",
    impact: "Equips a remote village learning center with a tablet device & high-speed internet.",
    popular: false,
  },
];

const objectives = [
  {
    icon: Sparkles,
    title: "Free AI Coaching & Digital Content",
    desc: "We provide 100% free access to our AI Tutor, video lectures, and practice quizzes to children in remote villages with no local coaching centers.",
    color: "#38bdf8",
  },
  {
    icon: BookOpen,
    title: "Distribution of Printed Books & Notes",
    desc: "We print and hand-deliver NCERT revision notes, formula booklets, and essential school supplies directly to rural village doorsteps.",
    color: "#4ade80",
  },
  {
    icon: Award,
    title: "Exam Registration Fee Sponsorship",
    desc: "We cover registration fees for JEE, NEET, and State Board entrance examinations for talented students from low-income families.",
    color: "#facc15",
  },
  {
    icon: Globe,
    title: "Rural Village Digital Learning Centers",
    desc: "We establish community digital learning hubs equipped with tablets and solar power in village panchayats so children can study uninterrupted.",
    color: "#c084fc",
  },
  {
    icon: Users,
    title: "Volunteer Expert Career Mentorship",
    desc: "We connect educators, counsellors, and industry experts with rural youth for free guidance on career options and competitive exam strategies.",
    color: "#fb7185",
  },
  {
    icon: Heart,
    title: "Nutritional & Wellness Support",
    desc: "We partner with local village schools to offer healthy snacks and study kits during exam preparation months.",
    color: "#2dd4bf",
  },
];

const testimonials = [
  {
    quote: "Without Umang Vision Academy's free notes & AI tutor support, I couldn't afford coaching in my village. Now I scored 94% in my Board exams!",
    name: "Priya Sharma",
    role: "Class 12 Student, MP Village",
    img: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote: "The digital tablet center set up in our village panchayat brought hope to 60+ children who had no school teachers nearby. Thank you donors!",
    name: "Ramesh Patel",
    role: "Village Sarpanch, Gujarat",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  },
];

const Donate = () => {
  const { t } = useTranslation();
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Form State
  const [selectedAmount, setSelectedAmount] = useState(1500);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState("one-time");
  const [donorForm, setDonorForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    panNumber: "",
    state: "",
    city: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastDonation, setLastDonation] = useState(null);

  // Auto Slider Timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setDonorForm((prev) => ({ ...prev, [name]: value }));
  };

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleDonateSubmit = (e) => {
    e.preventDefault();

    if (!donorForm.fullName.trim()) {
      toast.error("Please enter your Full Name.");
      return;
    }
    if (!donorForm.email.trim()) {
      toast.error("Please enter your Email Address.");
      return;
    }
    if (!donorForm.phone.trim() || donorForm.phone.replace(/\D/g, "").length !== 10) {
      toast.error("Please enter a valid 10-digit Mobile Number.");
      return;
    }
    if (effectiveAmount < 100) {
      toast.error("Minimum donation amount is ₹100.");
      return;
    }

    setIsSubmitting(true);

    // Simulate Payment Gateway Process
    setTimeout(() => {
      setIsSubmitting(false);
      const donationData = {
        txId: `UVA-DON-${Date.now()}`,
        amount: effectiveAmount,
        frequency,
        name: donorForm.fullName,
        email: donorForm.email,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
      setLastDonation(donationData);
      setShowReceiptModal(true);
      toast.success("Thank you for your generous contribution!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-x-clip py-8 lg:py-16">
      <SEO
        title="Donation & Charity - Empower Rural Students"
        description="Support Umang Vision Academy's Free Student Guidance & Rural Education Initiative. Donate to provide free AI coaching, books, exam fees, and digital tools to underprivileged village children across India."
      />

      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-600/15 blur-[120px] rounded-full transform-gpu" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-amber-600/15 blur-[120px] rounded-full transform-gpu" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-16 lg:space-y-24 relative z-10">

        {/* ── 1. HERO & 5-IMAGE SLIDING CAROUSEL BANNER ── */}
        <section className="space-y-6">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Heart size={14} className="text-rose-400 fill-rose-400 animate-pulse" />
              <span>FREE STUDENT EDUCATION & CHARITY INITIATIVE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              EMPOWER RURAL CHILDREN THROUGH{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400">
                EDUCATION & CHARITY
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Your contribution brings free AI coaching, printed books, exam fee grants, and digital learning devices to underprivileged children in remote Indian villages.
            </p>
          </div>

          {/* 5-Image Interactive Carousel Box */}
          <div
            className="relative rounded-[32px] border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl group h-[380px] sm:h-[460px] md:h-[520px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {carouselSlides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                {/* Background Image */}
                <img
                  src={slide.url}
                  alt={slide.title}
                  className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000"
                />
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/60 to-transparent" />

                {/* Slide Caption Banner */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 z-20 space-y-3 max-w-3xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
                    ✦ {slide.badge}
                  </span>
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
                    {slide.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            ))}

            {/* Slider Navigation Buttons */}
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous Slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-slate-950/70 border border-white/20 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl backdrop-blur-md cursor-pointer"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next Slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-11 w-11 rounded-full bg-slate-950/70 border border-white/20 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl backdrop-blur-md cursor-pointer"
            >
              <ChevronRight size={22} />
            </button>

            {/* Slide Position Indicator Dots */}
            <div className="absolute top-6 right-6 z-30 flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              {carouselSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide ? "w-7 bg-emerald-400" : "w-2.5 bg-white/40 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. IMPACT STATS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-[28px] border border-slate-800 bg-[#111827]/90 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-1 p-2">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">15,000+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Village Children Supported</div>
          </div>
          <div className="text-center space-y-1 p-2 border-l border-slate-800">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400">120+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rural Villages Reached</div>
          </div>
          <div className="text-center space-y-1 p-2 border-l border-slate-800">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400">100%</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Direct Impact (₹0 Admin Fee)</div>
          </div>
          <div className="text-center space-y-1 p-2 border-l border-slate-800">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-teal-400">80G</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tax Exemption Certified</div>
          </div>
        </div>

        {/* ── 3. OUR CHARITY OBJECTIVES ── */}
        <section className="space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
              OUR CHARITY MISSION
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Our Core Charity & Education Objectives
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Every rupee donated is directly deployed to break the cycle of poverty through high-impact educational initiatives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((obj, i) => {
              const Icon = obj.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl border border-slate-800/80 bg-[#111827]/90 hover:-translate-y-1 hover:border-emerald-500/40 transition-all duration-200 space-y-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                    <Icon size={24} style={{ color: obj.color }} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-white text-base group-hover:text-emerald-300 transition-colors">
                      {obj.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {obj.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. INTERACTIVE DONATION FORM & TIERS ── */}
        <section id="donate-form" className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
          
          {/* Left: Donation Tiers & Form */}
          <div className="rounded-[32px] border border-slate-800 bg-[#111827]/95 p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="space-y-2 border-b border-slate-800 pb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Gift size={14} className="text-emerald-400" />
                <span>MAKE A DIFFERENCE TODAY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Choose Your Contribution
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Select an impact tier or specify a custom amount to sponsor rural children.
              </p>
            </div>

            {/* Donation Frequency Toggle */}
            <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setFrequency("one-time")}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  frequency === "one-time"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Give One-Time
              </button>
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  frequency === "monthly"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Give Monthly (Recurring)
              </button>
            </div>

            {/* Preset Amount Tiers */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {donationTiers.map((tier) => (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(tier.amount);
                    setCustomAmount("");
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    selectedAmount === tier.amount && !customAmount
                      ? "border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2.5 right-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                      MOST POPULAR
                    </span>
                  )}
                  <div className="text-xl font-black text-white">₹{tier.amount.toLocaleString()}</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">{tier.title}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {tier.impact}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Or Enter Custom Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 pl-8 pr-4 py-3.5 text-white font-bold placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            {/* Donor Personal Information Form */}
            <form onSubmit={handleDonateSubmit} className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Donor Details (For 80G Tax Exemption Receipt)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="fullName"
                  required
                  value={donorForm.fullName}
                  onChange={handleFormChange}
                  placeholder="Full Name *"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={donorForm.email}
                  onChange={handleFormChange}
                  placeholder="Email Address *"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="tel"
                  name="phone"
                  required
                  value={donorForm.phone}
                  onChange={handleFormChange}
                  placeholder="10-digit WhatsApp Mobile *"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <input
                  type="text"
                  name="panNumber"
                  value={donorForm.panNumber}
                  onChange={handleFormChange}
                  placeholder="PAN Card No. (Optional for Tax Receipt)"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white uppercase placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 px-6 py-4 text-base font-extrabold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-emerald-500/20 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
              >
                {isSubmitting
                  ? "PROCESSING DONATION..."
                  : `PROCEED TO DONATE ₹${effectiveAmount.toLocaleString()} (${frequency === "monthly" ? "MONTHLY" : "ONE-TIME"})`}
              </button>
            </form>
          </div>

          {/* Right: Trust, 80G Certificate & Transparency */}
          <div className="space-y-6">
            
            {/* 80G Tax Benefit Banner */}
            <div className="rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <ShieldCheck size={28} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded">
                  TAX BENEFIT CERTIFIED
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  50% Tax Exemption Under Section 80G
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                All monetary contributions made to Umang Vision Academy's Charity Trust are eligible for 50% deduction under Section 80G of the Income Tax Act. Instant 80G receipts are emailed after donation.
              </p>
            </div>

            {/* Transparency Guarantees */}
            <div className="rounded-[32px] border border-slate-800 bg-[#111827]/90 p-6 sm:p-8 shadow-xl space-y-5">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                Our 100% Transparency Commitment
              </h3>
              
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-base">•</span>
                  <span><strong>Zero Admin Fee Deduction:</strong> 100% of your donation directly goes towards student study materials, exam fees, and digital tools.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-base">•</span>
                  <span><strong>Quarterly Impact Reports:</strong> Donors receive photos, video clips, and academic progress cards of village students supported by their funds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-base">•</span>
                  <span><strong>Third-Party Audited:</strong> Annual financial statements and audits are published transparently on our portal.</span>
                </li>
              </ul>
            </div>

            {/* Inspiring Testimonials */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Stories of Impact
              </h3>
              {testimonials.map((t, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
                    <img src={t.img} alt={t.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-white">{t.name}</div>
                      <div className="text-[10px] text-emerald-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* ── DONATION ACKNOWLEDGEMENT MODAL ── */}
      {showReceiptModal && lastDonation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-slate-900 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                DONATION ACKNOWLEDGEMENT
              </span>
              <h3 className="text-2xl font-black text-white">Thank You, {lastDonation.name}!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your generous contribution of <strong className="text-emerald-400">₹{lastDonation.amount.toLocaleString()}</strong> will bring education & hope to village children.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Transaction ID:</span>
                <span className="font-mono text-slate-200">{lastDonation.txId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date:</span>
                <span className="text-slate-200">{lastDonation.date}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>80G Tax Exemption:</span>
                <span className="text-emerald-400 font-bold">Receipt Sent to Email</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success("Downloading Official 80G Receipt PDF...");
                  setTimeout(() => setShowReceiptModal(false), 800);
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white transition cursor-pointer shadow-lg"
              >
                Download Official 80G Tax Receipt (PDF)
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donate;
