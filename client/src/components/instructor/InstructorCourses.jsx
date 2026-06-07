import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../../redux/slices/courseSlice';
import { uploadToImageKit } from '../../utils/imagekitUpload.js';
import ChapterManager from '../course/ChapterManager.jsx';

// ── constants ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  subject: '',
  className: '',
  board: '',
  description: '',
  content: '',
  lessons: [],
  price: '',
  thumbnailUrl: '',
  demoVideoUrl: '',
};

const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const BOARDS = ['CBSE', 'ICSE', 'MP Board'];
const DRAFT_STORAGE_KEY = 'instructorCourseDraft';

const isDraftForm = (form) =>
  Boolean(
    form.subject?.trim() ||
    form.className?.trim() ||
    form.board?.trim() ||
    form.description?.trim() ||
    form.content?.trim() ||
    form.thumbnailUrl?.trim() ||
    form.demoVideoUrl?.trim() ||
    (Array.isArray(form.lessons) && form.lessons.length > 0) ||
    Number(form.price) > 0
  );

const statusStyle = (published) =>
  published
    ? { bg: '#052e16', text: '#4ade80', label: 'Published' }
    : { bg: '#1c1003', text: '#fbbf24', label: 'Draft' };

// ── FileUploader ──────────────────────────────────────────────────────────────
const FileUploader = ({
  accept,
  label,
  hint,
  folder,
  onUploaded,
  currentUrl,
  icon,
}) => {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(currentUrl ? 'done' : 'idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(currentUrl || null);
  const [errMsg, setErrMsg] = useState('');
  const isImage = accept.includes('image');

  const handleFile = async (file) => {
    if (!file) return;
    if (isImage) setPreview(URL.createObjectURL(file));
    setStatus('uploading');
    setProgress(0);
    setErrMsg('');
    try {
      const data = await uploadToImageKit({
        file,
        folder,
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      setStatus('done');
      onUploaded(data.url);
      if (!isImage) setPreview(null);
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || err.message || 'Upload failed.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const clear = () => {
    setStatus('idle');
    setPreview(null);
    setProgress(0);
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'block',
          marginBottom: 8,
        }}
      >
        {label}
        {hint && (
          <span
            style={{
              color: '#475569',
              fontWeight: 400,
              textTransform: 'none',
              letterSpacing: 0,
              marginLeft: 6,
            }}
          >
            {hint}
          </span>
        )}
      </label>

      <div
        onClick={() => status !== 'uploading' && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: `2px dashed ${status === 'done' ? '#16a34a' : status === 'error' ? '#dc2626' : '#334155'}`,
          borderRadius: 12,
          padding: 16,
          cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
          background: '#0b1120',
          minHeight: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
      >
        {isImage && preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: '100%',
              maxHeight: 120,
              objectFit: 'cover',
              borderRadius: 8,
            }}
          />
        )}
        {status === 'idle' && !preview && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Click or drag & drop
            </p>
            <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
              {hint}
            </p>
          </div>
        )}
        {status === 'uploading' && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Uploading… {progress}%
            </p>
            <div
              style={{
                width: '100%',
                height: 6,
                background: '#1e293b',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg,#7c3aed,#06b6d4)',
                  borderRadius: 4,
                  transition: 'width 0.2s',
                }}
              />
            </div>
          </div>
        )}
        {status === 'done' && !preview && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
              {isImage ? 'Image' : 'Video'} uploaded
            </p>
          </div>
        )}
        {status === 'error' && (
          <p style={{ fontSize: 13, color: '#f87171' }}>❌ {errMsg}</p>
        )}
      </div>

      <div
        style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}
      >
        {status !== 'uploading' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#818cf8',
              background: 'none',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {status === 'done' ? 'Replace' : 'Choose file'}
          </button>
        )}
        {(status === 'done' || preview) && (
          <button
            type="button"
            onClick={clear}
            style={{
              fontSize: 11,
              color: '#64748b',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
};

// ── shared field/input primitives ─────────────────────────────────────────────
const iStyle = {
  padding: '10px 14px',
  background: '#0b1120',
  border: '1px solid #1e293b',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
const focus = (e) => (e.target.style.borderColor = '#7c3aed');
const blur = (e) => (e.target.style.borderColor = '#1e293b');

const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      {label}
      {hint && (
        <span
          style={{
            color: '#475569',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 0,
            marginLeft: 6,
          }}
        >
          {hint}
        </span>
      )}
    </label>
    {children}
  </div>
);
const Input = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={iStyle}
    onFocus={focus}
    onBlur={blur}
  />
);
const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }}
    onFocus={focus}
    onBlur={blur}
  />
);
const Sel = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    style={iStyle}
    onFocus={focus}
    onBlur={blur}
  >
    {options.map((o) => (
      <option
        key={o.value ?? o}
        value={o.value ?? o}
        style={{ background: '#0b1120' }}
      >
        {o.label ?? o}
      </option>
    ))}
  </select>
);

// ── CourseForm ────────────────────────────────────────────────────────────────
const CourseForm = ({ form, setForm, onSave, onCancel, saving, mode }) => {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Subject" hint="*">
          <Input
            value={form.subject}
            onChange={set('subject')}
            placeholder="e.g. Mathematics"
          />
        </Field>
        <Field label="Class" hint="*">
          <Sel
            value={form.className}
            onChange={set('className')}
            options={[
              { value: '', label: 'Select class' },
              ...CLASSES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Board" hint="*">
          <Sel
            value={form.board}
            onChange={set('board')}
            required
            options={[
              { value: '', label: 'Select board' },
              ...BOARDS.map((b) => ({ value: b, label: b })),
            ]}
          />
        </Field>
        <Field label="Price" hint="(₹ — 0 for free)">
          <Input
            value={form.price}
            onChange={set('price')}
            placeholder="0"
            type="number"
          />
        </Field>
      </div>
      <ChapterManager
        lessons={form.lessons ?? []}
        onChange={(lessons) => setForm((f) => ({ ...f, lessons }))}
      />
      <Field label="Description" hint="* (course summary)">
        <Textarea
          value={form.description}
          onChange={set('description')}
          placeholder="Brief description"
          rows={3}
        />
      </Field>
      <Field label="Course Content" hint="(chapters, topics)">
        <Textarea
          value={form.content}
          onChange={set('content')}
          placeholder={'Chapter 1: Algebra\nChapter 2: Geometry'}
          rows={5}
        />
      </Field>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 16,
        }}
      >
        <FileUploader
          label="Thumbnail"
          hint="JPG, PNG, WEBP"
          accept="image/jpeg,image/png,image/webp,image/gif"
          folder="skillsphere/thumbnails"
          icon="🖼️"
          currentUrl={form.thumbnailUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
        />
        <FileUploader
          label="Demo Video"
          hint="MP4, WEBM — max 200 MB"
          accept="video/mp4,video/webm,video/quicktime"
          folder="skillsphere/demos"
          icon="🎬"
          currentUrl={form.demoVideoUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, demoVideoUrl: url }))}
        />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          paddingTop: 8,
          borderTop: '1px solid #1e293b',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid #334155',
            background: 'transparent',
            color: '#94a3b8',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(false)}
          disabled={saving}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid #334155',
            background: 'transparent',
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          Save as Draft
        </button>
        <button
          onClick={() => onSave(true)}
          disabled={saving}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 4px 16px rgba(124,58,237,.25)',
          }}
        >
          {saving
            ? 'Saving…'
            : mode === 'create'
              ? 'Publish Course'
              : 'Save & Publish'}
        </button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function InstructorCourses({ showToast }) {
  const dispatch = useDispatch();
  const { courses = [], loading, error } = useSelector((s) => s.courses);

  const [view, setView] = useState('list');
  const [expandedId, setExpandedId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [createForm, setCreateForm] = useState(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDraft) return EMPTY_FORM;
    try {
      return { ...EMPTY_FORM, ...JSON.parse(savedDraft) };
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return EMPTY_FORM;
    }
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const loadSavedDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft);
      if (isDraftForm(parsed)) {
        setCreateForm({ ...EMPTY_FORM, ...parsed });
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  useEffect(() => {
    const saveDraft = () => {
      if (isDraftForm(createForm)) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(createForm));
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    };

    saveDraft();

    const handleBeforeUnload = (event) => {
      if (view === 'create' && isDraftForm(createForm)) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(createForm));
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      saveDraft();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [createForm, view]);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'published'
          ? c.published
          : !c.published;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: courses.length,
    published: courses.filter((c) => c.published).length,
    draft: courses.filter((c) => !c.published).length,
  };

  const openEdit = (course) => {
    setExpandedId(course._id);
    setEditForm({
      subject: course.title ?? '',
      className: course.category ?? '',
      board: course.board ?? '',
      description: course.summary ?? '',
      lessons: course.lessons ?? [],
      content: course.description ?? '',
      thumbnailUrl: course.thumbnailUrl ?? '',
      demoVideoUrl: course.demoVideoUrl ?? '',
      price: course.price ?? 0,
    });
    setView('list');
  };
  const closeEdit = () => setExpandedId(null);

  const buildPayload = (form, published) => ({
    title: form.subject.trim(),
    summary: form.description.trim(),
    description: form.content?.trim() || '',
    category: form.className,
    board: form.board,
    lessons: form.lessons ?? [],
    price: Number(form.price) || 0,
    thumbnailUrl: form.thumbnailUrl || '',
    demoVideoUrl: form.demoVideoUrl || '',
    published,
  });

  const validateForPublish = (form) => {
    const requiredFields = [
      { key: 'subject', label: 'Subject' },
      { key: 'className', label: 'Class' },
      { key: 'board', label: 'Board' },
      { key: 'description', label: 'Description' },
      { key: 'content', label: 'Course Content' },
      { key: 'thumbnailUrl', label: 'Thumbnail' },
      { key: 'demoVideoUrl', label: 'Demo Video' },
    ];

    for (const field of requiredFields) {
      const value = form[field.key];

      if (value === undefined || value === null || value === '') {
        showToast?.(`${field.label} is required before publishing`);
        return false;
      }
    }

    return true;
  };

  const handleCreate = async (publish) => {
    if (publish && !validateForPublish(createForm)) {
      return;
    }

    setSaving(true);

    const resultAction = await dispatch(
      createCourse(buildPayload(createForm, publish))
    );

    setSaving(false);
    if (createCourse.fulfilled.match(resultAction)) {
      setCreateForm(EMPTY_FORM);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setFilterStatus(publish ? filterStatus : 'draft');
      setView('list');
      showToast?.(publish ? 'Course published!' : 'Saved as draft.');
    } else {
      showToast?.(
        resultAction.payload ||
          'Failed to save course. Your draft is preserved.'
      );
    }
  };

  const handleEdit = async (publish) => {
    if (publish && !validateForPublish(editForm)) {
      return;
    }

    setSaving(true);

    await dispatch(
      updateCourse({
        id: expandedId,
        courseData: buildPayload(editForm, publish),
      })
    );

    setSaving(false);
    closeEdit();

    showToast?.(publish ? 'Course updated & published!' : 'Saved as draft.');
  };

  const handleTogglePublish = async (course) => {
    await dispatch(
      updateCourse({
        id: course._id,
        courseData: { published: !course.published },
      })
    );
    showToast?.(course.published ? 'Course unpublished.' : 'Course published!');
  };

  const handleDelete = async (id) => {
    await dispatch(deleteCourse(id));
    setDeleteId(null);
    if (expandedId === id) closeEdit();
    showToast?.('Course deleted.');
  };

  return (
    <>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
        .ic-row:hover { border-color:#334155 !important; }
        .ic-btn:hover { opacity:.8; }
        select option { background:#0b1120; color:#f1f5f9; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: 900,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#818cf8',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Course Management
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>
              {view === 'create' ? 'Create New Course' : 'Your Courses'}
            </h2>
          </div>
          {view === 'list' ? (
            <button
              onClick={() => {
                loadSavedDraft();
                setView('create');
                closeEdit();
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(124,58,237,.3)',
                whiteSpace: 'nowrap',
              }}
            >
              + New Course
            </button>
          ) : (
            <button
              onClick={() => setView('list')}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ← Back to Courses
            </button>
          )}
        </div>

        {/* Create view */}
        {view === 'create' && (
          <div
            style={{
              background: '#111827',
              border: '1px solid #1e293b',
              borderRadius: 18,
              padding: 28,
              animation: 'slideDown 0.3s ease',
            }}
          >
            <CourseForm
              form={createForm}
              setForm={setCreateForm}
              onSave={handleCreate}
              onCancel={() => setView('list')}
              saving={saving}
              mode="create"
            />
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <>
            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 12,
              }}
            >
              {[
                { label: 'Total', value: counts.total, color: '#818cf8' },
                {
                  label: 'Published',
                  value: counts.published,
                  color: '#4ade80',
                },
                { label: 'Drafts', value: counts.draft, color: '#fbbf24' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#111827',
                    border: '1px solid #1e293b',
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}
                >
                  <div
                    style={{ fontSize: 26, fontWeight: 800, color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Search + filter */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses…"
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: '9px 14px',
                  background: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  color: '#f1f5f9',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {['all', 'published', 'draft'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1px solid ${filterStatus === f ? '#7c3aed' : '#1e293b'}`,
                    background: filterStatus === f ? '#7c3aed' : 'transparent',
                    color: filterStatus === f ? '#fff' : '#64748b',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {error && (
              <div
                style={{
                  background: '#2d0a0a',
                  border: '1px solid #7f1d1d',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#f87171',
                  fontSize: 13,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Course rows */}
            {loading && courses.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 80,
                    background: '#111827',
                    borderRadius: 16,
                    animation: 'pulse 1.4s infinite',
                  }}
                />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: '#64748b', fontWeight: 600 }}>
                  {courses.length === 0
                    ? 'No courses yet. Create your first one!'
                    : 'No courses match your filter.'}
                </p>
              </div>
            ) : (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {filtered.map((course) => {
                  const st = statusStyle(course.published);
                  const isOpen = expandedId === course._id;
                  return (
                    <div
                      key={course._id}
                      style={{ animation: 'fadeIn 0.25s ease' }}
                    >
                      <div
                        className="ic-row"
                        style={{
                          background: '#111827',
                          border: `1px solid ${isOpen ? '#7c3aed40' : '#1e293b'}`,
                          borderRadius: isOpen ? '18px 18px 0 0' : 18,
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          transition: 'border-color 0.15s',
                        }}
                      >
                        {/* Thumb */}
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            background: '#1e293b',
                            flexShrink: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                        >
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt=""
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            '📚'
                          )}
                        </div>

                        {/* Meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#f1f5f9',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '30ch',
                              }}
                            >
                              {course.title || 'Untitled'}
                            </p>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 20,
                                background: st.bg,
                                color: st.text,
                                flexShrink: 0,
                              }}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: 12,
                              marginTop: 4,
                              flexWrap: 'wrap',
                            }}
                          >
                            {course.category && (
                              <span style={{ fontSize: 11, color: '#64748b' }}>
                                {course.category}
                              </span>
                            )}
                            {course.board && (
                              <span style={{ fontSize: 11, color: '#64748b' }}>
                                📋 {course.board}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              👥 {course.enrolledCount ?? 0}
                            </span>
                            {course.price > 0 && (
                              <span style={{ fontSize: 11, color: '#64748b' }}>
                                ₹{course.price}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Buttons */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexShrink: 0,
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            className="ic-btn"
                            onClick={() => handleTogglePublish(course)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: `1px solid ${course.published ? '#334155' : '#16a34a40'}`,
                              background: course.published
                                ? 'transparent'
                                : '#052e16',
                              color: course.published ? '#64748b' : '#4ade80',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                          >
                            {course.published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            className="ic-btn"
                            onClick={() =>
                              isOpen ? closeEdit() : openEdit(course)
                            }
                            style={{
                              padding: '6px 14px',
                              borderRadius: 8,
                              border: `1px solid ${isOpen ? '#7c3aed' : '#334155'}`,
                              background: isOpen ? '#2e1065' : 'transparent',
                              color: isOpen ? '#a78bfa' : '#e2e8f0',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isOpen ? '✕ Close' : 'Edit / Manage'}
                          </button>
                          <button
                            className="ic-btn"
                            onClick={() => setDeleteId(course._id)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: '1px solid #7f1d1d30',
                              background: '#2d0a0a',
                              color: '#f87171',
                              fontSize: 11,
                              cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      {/* Inline edit panel */}
                      {isOpen && (
                        <div
                          style={{
                            background: '#0f172a',
                            border: '1px solid #7c3aed40',
                            borderTop: 'none',
                            borderRadius: '0 0 18px 18px',
                            padding: '24px 24px 28px',
                            animation: 'slideDown 0.25s ease',
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#a78bfa',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              marginBottom: 20,
                            }}
                          >
                            ✏️ Editing: {course.title}
                          </p>
                          <CourseForm
                            form={editForm}
                            setForm={setEditForm}
                            onSave={handleEdit}
                            onCancel={closeEdit}
                            saving={saving}
                            mode="edit"
                          />

                          {/* Stats strip */}
                          <div
                            style={{
                              marginTop: 20,
                              paddingTop: 16,
                              borderTop: '1px solid #1e293b',
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit,minmax(110px,1fr))',
                              gap: 10,
                            }}
                          >
                            {[
                              {
                                label: 'Enrolled',
                                value: course.enrolledCount ?? 0,
                              },
                              {
                                label: 'Revenue',
                                value: `₹${course.revenue ?? 0}`,
                              },
                              {
                                label: 'Rating',
                                value:
                                  course.ratingAverage > 0
                                    ? `${course.ratingAverage} ★`
                                    : 'No ratings',
                              },
                              {
                                label: 'Lessons',
                                value: course.lessons?.length ?? 0,
                              },
                            ].map((s) => (
                              <div
                                key={s.label}
                                style={{
                                  background: '#111827',
                                  borderRadius: 10,
                                  padding: '12px 14px',
                                  border: '1px solid #1e293b',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#f1f5f9',
                                  }}
                                >
                                  {s.value}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    marginTop: 2,
                                  }}
                                >
                                  {s.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#111827',
              border: '1px solid #334155',
              borderRadius: 20,
              padding: 28,
              maxWidth: 380,
              width: '100%',
              animation: 'slideDown 0.25s ease',
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#f1f5f9',
                marginBottom: 10,
              }}
            >
              Delete Course?
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#94a3b8',
                lineHeight: 1.7,
                marginBottom: 22,
              }}
            >
              This will permanently remove the course and unenroll all students.
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: 'none',
                  background: '#7f1d1d',
                  color: '#fca5a5',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
