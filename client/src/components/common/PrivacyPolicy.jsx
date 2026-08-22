import React, { useEffect } from "react";
import {
  ShieldCheck,
  Database,
  Sliders,
  Lock,
  Cookie,
  Server,
  Share2,
  UserCheck,
  Baby,
  Clock,
  Globe,
  RefreshCw,
  Mail,
  Scale,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy | Umang Vision Academy";
  }, []);

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ── Header Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/60 via-[#0d1627] to-[#070c18] border border-indigo-500/20 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-cyan-400" /> Official Policy
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Privacy Policy
            </h1>
            
            <div className="text-sm font-semibold text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Umang Vision Academy</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Last Updated: August 2026</span>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-2 border-t border-slate-800/80">
              <strong>Umang Vision Academy</strong> (“Umang Vision Academy,” “we,” “our,” or “us”) respects your privacy and is committed to protecting the personal information of students, parents/guardians, teachers, employees, and other users of our website, application, and online/offline educational services.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm italic">
              By accessing or using our services, you acknowledge and agree to the practices described in this Privacy Policy.
            </p>
          </div>
        </div>

        {/* ── Content Sections ── */}
        <div className="space-y-6">
          
          {/* Section 1 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-4 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Database size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                1. Information We Collect
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may collect the following information:
            </p>
            <ul className="space-y-2 text-slate-300 text-sm">
              {[
                "Name, email address, mobile number, and other contact details.",
                "Account/login information and profile details.",
                "Student academic information, course enrollment, attendance, test results, performance, and learning activity.",
                "Payment and transaction-related information. Payment details may be processed through authorized third-party payment providers.",
                "Information provided when contacting customer/student support.",
                "Device, browser, IP address, and technical information required for security and platform functionality.",
                "Information collected through cookies and similar technologies.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <ChevronRight size={14} className="text-indigo-400 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs font-medium pt-2 border-t border-slate-800/60">
              We collect only information that is reasonably necessary to provide and improve our services.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-4 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Sliders size={20} className="text-cyan-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                2. How We Use Information
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may use collected information to:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-slate-300 text-sm">
              {[
                "Create and manage user accounts.",
                "Provide courses, classes, tests, assessments, and other educational services.",
                "Personalize and improve the learning experience.",
                "Track academic progress and course activity.",
                "Process payments and transactions.",
                "Communicate important service, academic, administrative, and security updates.",
                "Provide customer and student support.",
                "Analyze platform performance and improve our services.",
                "Prevent fraud, misuse, unauthorized access, and other security risks.",
                "Comply with applicable legal and regulatory requirements.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#0d172c] p-3 rounded-xl border border-slate-800/50">
                  <ChevronRight size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Lock size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. Data Protection and Security
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              We implement reasonable technical, administrative, and organizational security measures designed to protect personal information against unauthorized access, alteration, disclosure, loss, misuse, or destruction.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed bg-[#0d172c] p-3.5 rounded-xl border border-slate-800/50">
              However, no internet-based system can be guaranteed to be completely secure. Users should also maintain the confidentiality of their login credentials and notify us promptly if they suspect unauthorized access to their account.
            </p>
          </div>

          {/* Section 4 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-4 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Cookie size={20} className="text-amber-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                4. Cookies and Similar Technologies
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Umang Vision Academy may use cookies and similar technologies to:
            </p>
            <ul className="space-y-2 text-slate-300 text-sm">
              {[
                "Maintain login sessions.",
                "Remember user preferences.",
                "Improve website and application functionality.",
                "Analyze traffic and usage patterns.",
                "Improve user experience and platform performance.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <ChevronRight size={14} className="text-amber-400 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs pt-2 border-t border-slate-800/60">
              Users may be able to manage or disable cookies through their browser or device settings. Disabling certain cookies may affect some features of the platform.
            </p>
          </div>

          {/* Section 5 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-4 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Server size={20} className="text-violet-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                5. Third-Party Services
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may engage trusted third-party service providers for services such as:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-sm">
              {[
                "Authentication and account management.",
                "Website/application hosting.",
                "Payment processing.",
                "Analytics and performance monitoring.",
                "Communication and notification services.",
                "Technical and security services.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#0d172c] p-2.5 rounded-xl border border-slate-800/50">
                  <ChevronRight size={14} className="text-violet-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs font-medium pt-2 border-t border-slate-800/60">
              Such providers may process information on our behalf and are expected to maintain appropriate safeguards for personal information.
            </p>
          </div>

          {/* Section 6 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-4 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Share2 size={20} className="text-rose-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                6. Sharing and Disclosure of Information
              </h2>
            </div>
            <p className="text-slate-200 text-sm font-semibold">
              We do not sell personal information to third parties.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may disclose information where reasonably necessary:
            </p>
            <ul className="space-y-2 text-slate-300 text-sm">
              {[
                "To authorized service providers supporting our operations.",
                "To comply with applicable laws, regulations, court orders, or legal processes.",
                "To protect the rights, safety, security, and property of Umang Vision Academy, our users, or others.",
                "In connection with a merger, acquisition, restructuring, or transfer of business, subject to applicable law.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <ChevronRight size={14} className="text-rose-400 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 7 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-4 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <UserCheck size={20} className="text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                7. User Rights
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Subject to applicable laws and reasonable verification requirements, users may request:
            </p>
            <ul className="space-y-2 text-slate-300 text-sm">
              {[
                "Access to their personal information.",
                "Correction or updating of inaccurate information.",
                "Deletion of personal information where legally permitted.",
                "Information regarding the processing of their personal information.",
                "Withdrawal of consent where processing is based on consent, subject to applicable legal or contractual requirements.",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <ChevronRight size={14} className="text-blue-400 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-400 text-xs font-medium pt-2 border-t border-slate-800/60">
              Requests may be submitted using the contact details provided in this Privacy Policy.
            </p>
          </div>

          {/* Section 8 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                <Baby size={20} className="text-pink-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                8. Children's Privacy
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Our services may include educational programs for students of different age groups. Where applicable law requires parental or guardian consent for processing a child's personal information, we will seek and rely on such consent.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              We do not knowingly collect personal information from children in circumstances where such collection is prohibited by applicable law.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed bg-[#0d172c] p-3.5 rounded-xl border border-slate-800/50">
              Parents or legal guardians who believe that a child has provided personal information without appropriate authorization may contact us at the email address provided below.
            </p>
          </div>

          {/* Section 9 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-teal-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                9. Data Retention
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              We retain personal information only for as long as reasonably necessary to provide our services, maintain academic and transaction records, meet legitimate business requirements, resolve disputes, maintain security, and comply with applicable legal obligations.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed pt-2 border-t border-slate-800/60">
              When information is no longer required, we may securely delete, anonymize, or otherwise dispose of it in accordance with applicable requirements.
            </p>
          </div>

          {/* Section 10 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Globe size={20} className="text-purple-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                10. Data Transfers
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Where personal information is processed or stored through third-party service providers or infrastructure located outside the user's jurisdiction, such processing will be carried out subject to applicable laws and appropriate safeguards.
            </p>
          </div>

          {/* Section 11 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="text-sky-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                11. Changes to This Privacy Policy
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our services, technology, business practices, or applicable legal requirements.
            </p>
            <p className="text-slate-400 text-xs leading-relaxed pt-2 border-t border-slate-800/60">
              Any updated version will be published on this page with the revised “Last Updated” date. Users are encouraged to review this Privacy Policy periodically.
            </p>
          </div>

          {/* Section 12 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Mail size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                12. Contact Us
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              For privacy-related questions, requests, or concerns, please contact:
            </p>
            <div className="bg-[#0d172c] p-4 rounded-xl border border-indigo-500/20 space-y-1 text-sm">
              <p className="font-bold text-indigo-300 text-base">Umang Vision Academy</p>
              <p className="text-slate-400 text-xs">Empowering Students for Bright Futures</p>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed pt-2 border-t border-slate-800/60">
              We will make reasonable efforts to review and respond to privacy-related requests in accordance with applicable laws and within a reasonable period.
            </p>
          </div>

          {/* Section 13 */}
          <div className="bg-[#0b1324] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg space-y-3 hover:border-slate-700/80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Scale size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                13. Governing Law
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              This Privacy Policy shall be interpreted and governed in accordance with the applicable laws and regulations of India, subject to the jurisdiction of the appropriate courts.
            </p>
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-center text-slate-500 text-xs py-4 border-t border-slate-800">
          © {new Date().getFullYear()} Umang Vision Academy. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
