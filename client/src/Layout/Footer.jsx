import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="px-6 md:px-10 py-16 border-t border-slate-800 bg-slate-950">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-10 w-full">
        {/* Logo Section */}
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center">
            <img src="/Logo.png" alt="Logo" />
          </div>

          <h2 className="text-2xl font-bold">
            Umang Vision <span className="text-blue-500"> Academy</span>
          </h2>
        </div>

        {/* Right Side Links */}
        <div className="flex flex-col sm:flex-row gap-12 md:gap-20">
          <div className="m-10">
            <h3 className="font-bold mb-5">Platform</h3>

            <div className="space-y-3 text-slate-400">
              <Link to="/courses" className="block hover:text-white transition">
                Courses
              </Link>

              <Link
                to="/about-us"
                className="block hover:text-white transition"
              >
                About Us
              </Link>
            </div>
          </div>

          <div className="m-10">
            <h3 className="font-bold mb-5">Support</h3>

            <div className="space-y-3 text-slate-400">
              <Link to="/contact" className="block hover:text-white transition">
                Contact
              </Link>

              <Link
                to="/help-center"
                className="block hover:text-white transition"
              >
                Help Center
              </Link>

              <Link to="/faq" className="block hover:text-white transition">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
