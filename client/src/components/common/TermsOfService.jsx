import React from "react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-8 text-slate-300 leading-7">
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using SkillSphere, you agree to comply with and be
              bound by these Terms of Service. If you do not agree, please
              discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              2. User Accounts
            </h2>
            <p>
              Users are responsible for maintaining the confidentiality of their
              account credentials. Any activity performed under your account is
              your responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              3. Course Access
            </h2>
            <p>
              Purchased or enrolled courses are intended solely for personal,
              non-commercial use. Sharing account credentials or course content
              is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              4. Instructor Responsibilities
            </h2>
            <p>
              Instructors must provide accurate information during the
              application process and ensure that uploaded content does not
              violate intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              5. Payments & Refunds
            </h2>
            <p>
              Payments for courses and subscriptions are processed securely.
              Refund eligibility is subject to the platform's refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              6. Prohibited Conduct
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Sharing copyrighted content without permission.</li>
              <li>Attempting to gain unauthorized access to the platform.</li>
              <li>Harassing, threatening, or abusing other users.</li>
              <li>Uploading malicious software or harmful content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              7. Account Termination
            </h2>
            <p>
              SkillSphere reserves the right to suspend or terminate accounts
              that violate these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              8. Changes to Terms
            </h2>
            <p>
              We may update these Terms periodically. Continued use of the
              platform constitutes acceptance of any revisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              9. Contact Information
            </h2>
            <p>
              For questions regarding these Terms, contact us at
              support@skillsphere.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
