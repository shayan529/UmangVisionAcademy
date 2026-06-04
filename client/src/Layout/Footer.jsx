import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="px-6 md:px-10 py-16 border-t border-slate-800 bg-slate-950">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-indigo-400">SkillSphere</h2>
        </div>

        <div>
          <h3 className="font-bold mb-5">Platform</h3>

          <div className="space-y-3 text-slate-400">
            <Link to="/courses" className="block hover:text-white transition">
              Courses
            </Link>

            {/* <Link to="/community" className="block hover:text-white transition">
              Community
            </Link> */}
          </div>
        </div>

        <div>
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
    </footer>
  );
};

export default Footer;
