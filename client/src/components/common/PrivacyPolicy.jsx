import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-slate-300 leading-7">
          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly, including your name,
              email address, account details, and course activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              2. How We Use Information
            </h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Provide and improve our services.</li>
              <li>Personalize learning experiences.</li>
              <li>Process payments and transactions.</li>
              <li>Communicate important updates.</li>
              <li>Maintain platform security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              3. Data Protection
            </h2>
            <p>
              We implement industry-standard security measures to protect
              personal information from unauthorized access or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              4. Cookies
            </h2>
            <p>
              Umang Vision Academy may use cookies and similar technologies to
              enhance user experience, analyze traffic, and improve
              functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              5. Third-Party Services
            </h2>
            <p>
              We may use trusted third-party providers for authentication,
              analytics, hosting, and payment processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              6. User Rights
            </h2>
            <p>
              Users may request access, correction, or deletion of their
              personal information, subject to applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              7. Children's Privacy
            </h2>
            <p>
              Umang Vision Academy is not intended for children under 13 years
              of age. We do not knowingly collect personal information from
              children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              8. Changes to Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically. Changes will be
              posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
              9. Contact Us
            </h2>
            <p>
              For privacy-related questions, contact us at
              privacy@umangvisionacademy.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
