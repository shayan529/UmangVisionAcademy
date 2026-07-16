import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchMyApplication,
  submitApplication,
} from '../../redux/slices/applicationsSlice';
import { uploadFile } from '../../utils/uploadFile.js';
import toast from 'react-hot-toast';

const BecomeInstructorApplication = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, myApplication } = useSelector(
    (state) => state.applications
  );
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    expertise: '',
    bio: '',
    contentLink: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const [resumeError, setResumeError] = useState('');

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setResumeError(t('becomeInstructorApplication.onlyPdfJpgPng'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError(t('becomeInstructorApplication.max5mb'));
      return;
    }

    setResumeError('');
    setResumeFile(file);
    setResumeUploading(true);
    setResumeUploadProgress(0);

    try {
      const data = await uploadFile({
        file,
        folder: '/instructor-resumes',
        onUploadProgress: (event) =>
          setResumeUploadProgress(
            Math.round((event.loaded / event.total) * 100)
          ),
      });
      setResumeUrl(data.url);
    } catch (uploadError) {
      setResumeError(
        uploadError.response?.data?.message ||
        uploadError.message ||
        'Upload failed. Please try again.'
      );
      setResumeFile(null);
      setResumeUrl('');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, expertise, bio, contentLink } = formData;
    if (!name || !expertise || !bio || !contentLink) {
      toast.error(t('becomeInstructorApplication.allFieldsRequired'));
      return;
    }
    if (!resumeUrl) {
      toast.error('Please upload your resume before submitting');
      return;
    }
    const payload = new FormData();
    payload.append('name', name);
    payload.append('expertise', expertise);
    payload.append('bio', bio);
    payload.append('contentLink', contentLink);
    if (resumeUrl) {
      payload.append('resumeUrl', resumeUrl);
    } else if (resumeFile) {
      payload.append('resume', resumeFile);
    }

    try {
      await dispatch(submitApplication(payload)).unwrap();
      toast.success(t('becomeInstructorApplication.submitted'));
      navigate('/instructor-application/status');
    } catch (err) {
      toast.error(
        typeof err === 'string'
          ? err
          : t('becomeInstructorApplication.failedSubmit')
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyApplication());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (myApplication)
      navigate('/instructor-application/status', { replace: true });
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
          {t('becomeInstructorApplication.backToOverview')}
        </Link>

        <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 px-4 py-2 text-sm font-semibold tracking-wide mb-4">
          {t('becomeInstructorApplication.formBadge')}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          {t('becomeInstructorApplication.titleStart')}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 ml-2">
            {t('becomeInstructorApplication.titleHighlight')}
          </span>
        </h2>
        <p className="text-slate-400 text-lg leading-7 max-w-xl">
          {t('becomeInstructorApplication.description')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                {t('becomeInstructorApplication.fullNameLabel')}
              </span>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t('becomeInstructorApplication.namePlaceholder')}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                {t('becomeInstructorApplication.expertiseLabel')}
              </span>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                required
                onChange={handleChange}
                placeholder={t(
                  'becomeInstructorApplication.expertisePlaceholder'
                )}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

             <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                {t('becomeInstructorApplication.bioLabel')}
              </span>
              <textarea
                rows="4"
                name="bio"
                value={formData.bio}
                required
                onChange={handleChange}
                placeholder={t('becomeInstructorApplication.bioPlaceholder')}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
              <span className="text-xs text-slate-500 mt-2 block">
                *This will show on your profile
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                {t('becomeInstructorApplication.contentLinkLabel')}
              </span>
              <input
                type="url"
                name="contentLink"
                value={formData.contentLink}
                required
                onChange={handleChange}
                placeholder={t('becomeInstructorApplication.urlPlaceholder')}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition duration-200"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                {t('becomeInstructorApplication.resumeLabel')}
                <span className="text-red-400 ml-0.5">*</span>
                <span className="text-slate-500 font-normal">
                  {` ${t('becomeInstructorApplication.resumeHint')}`}
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
                      {t('becomeInstructorApplication.uploadPrompt')}
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleResumeChange}
                    className="hidden"
                  />
                </label>
                {resumeUploading && (
                  <div className="mt-3 rounded-2xl bg-slate-950/90 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Uploading resume</span>
                      <span>{resumeUploadProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${resumeUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {resumeUrl && !resumeUploading && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-950/90 px-4 py-3 text-sm text-slate-200">
                    <span>Resume uploaded</span>
                    <button
                      type="button"
                      className="text-indigo-300 hover:text-indigo-200"
                      onClick={() => {
                        setResumeFile(null);
                        setResumeUrl('');
                        setResumeUploadProgress(0);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {resumeError && (
                  <p className="mt-2 text-xs text-red-400">{resumeError}</p>
                )}
              </div>
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || resumeUploading}
                className="w-full rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || resumeUploading
                  ? t('becomeInstructorApplication.submitting')
                  : t('becomeInstructorApplication.submitButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeInstructorApplication;
