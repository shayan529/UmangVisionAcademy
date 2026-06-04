import React from 'react';

const AboutUs = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About AI Coaching Platform
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto">
            Empowering individuals and businesses with AI-driven coaching,
            personalized learning experiences, and expert guidance to achieve
            their goals faster.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
        <p className="text-gray-600 text-lg leading-relaxed text-center max-w-4xl mx-auto">
          AI Coaching Platform was created with a vision to make professional
          coaching accessible, scalable, and effective for everyone. By
          combining artificial intelligence with expert coaching methodologies,
          we help learners, professionals, and organizations unlock their full
          potential.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          <div className="shadow-lg rounded-xl p-8">
            <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
            <p className="text-gray-600">
              To provide intelligent coaching solutions that inspire growth,
              improve skills, and help individuals and businesses achieve
              measurable success.
            </p>
          </div>

          <div className="shadow-lg rounded-xl p-8">
            <h3 className="text-2xl font-semibold mb-4">Our Vision</h3>
            <p className="text-gray-600">
              To become the leading AI-powered coaching ecosystem, transforming
              how people learn, develop, and reach their goals worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-3">
              Personalized Coaching
            </h3>
            <p className="text-gray-600">
              AI-driven recommendations tailored to individual goals and
              learning styles.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Expert Instructors</h3>
            <p className="text-gray-600">
              Learn from experienced professionals and industry specialists.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Business Solutions</h3>
            <p className="text-gray-600">
              Comprehensive coaching and training programs designed for teams
              and organizations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Your Growth Journey Today
          </h2>
          <p className="mb-8 text-lg">
            Join thousands of learners and businesses leveraging AI-powered
            coaching to achieve their goals.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
