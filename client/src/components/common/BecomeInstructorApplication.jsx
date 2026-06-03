import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyApplication,
  submitApplication,
} from "../../redux/slices/applicationsSlice";
import toast from "react-hot-toast";

const BecomeInstructorApplication = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, myApplication } = useSelector(
    (state) => state.applications,
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    expertise: "",
    bio: "",
    contentLink: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState("");

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setResumeError("Only PDF, JPG, or PNG files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File size must be under 5MB.");
      return;
    }
    setResumeError("");
    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, expertise, bio, contentLink } = formData;
    if (!name || !expertise || !bio || !contentLink) {
      toast.error("All fields are required.");
      return;
    }

    const payload = new FormData();
    payload.append("name", name);
    payload.append("expertise", expertise);
    payload.append("bio", bio);
    payload.append("contentLink", contentLink);
    if (resumeFile) payload.append("resume", resumeFile);

    try {
      await dispatch(submitApplication(payload)).unwrap();
      toast.success("Application submitted successfully!");
      navigate("/instructor-application/status");
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : "Failed to submit application.",
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyApplication());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (myApplication)
      navigate("/instructor-application/status", { replace: true });
  }, [myApplication, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <Link
          to="/become-instructor"
          className="inline-flex items-center gap-2 mr-4 text-indigo-400 hover:text-indigo-300 transition mb-8 text-sm font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to overview
        </Link>

        <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 px-4 py-2 text-sm font-semibold tracking-wide mb-4">
          Application Form
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Become an
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 ml-2">
            Instructor
          </span>
        </h2>
        <p className="text-slate-400 text-lg leading-7 max-w-xl">
          Tell us about your teaching experience, your expertise, and share a
          sample content link so we can approve your profile quickly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Your full name
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Area of expertise
              </span>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                placeholder="AI / Web Development / Design"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Brief bio
              </span>
              <textarea
                rows="4"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Share your teaching experience and what makes your classes unique."
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Sample content link (YouTube / Google Drive)
              </span>
              <input
                type="url"
                name="contentLink"
                value={formData.contentLink}
                onChange={handleChange}
                placeholder="https://"
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Resume{" "}
                <span className="text-slate-500 font-normal">
                  (PDF, JPG, PNG — max 5MB)
                </span>
              </span>
              <div className="mt-3">
                <label className="flex flex-col items-center justify-center w-full rounded-3xl border border-dashed border-white/20 bg-slate-950/80 px-4 py-6 cursor-pointer hover:border-indigo-400/50 transition duration-200">
                  <svg
                    className="w-8 h-8 text-slate-500 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                    />
                  </svg>
                  {resumeFile ? (
                    <span className="text-sm text-indigo-300 font-medium">
                      {resumeFile.name}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">
                      Click to upload your resume
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                </label>
                {resumeError && (
                  <p className="mt-2 text-xs text-red-400">{resumeError}</p>
                )}
              </div>
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeInstructorApplication;
