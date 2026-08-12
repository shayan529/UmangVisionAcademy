import {
  BookOpen,
  Trophy,
  Medal,
  Award,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getCustomRole,
  hasBaseRole,
  hasPermission,
} from '../../utils/permissions';

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n) => (n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`);
const pct = (n, max) => Math.min(100, Math.round((n / (max || 1)) * 100));
const hue = (name = '?') => {
  const palette = [
    '#7c3aed',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#14b8a6',
  ];
  return palette[name.charCodeAt(0) % palette.length];
};

/* ─── Avatar ──────────────────────────────────────────── */
const Av = ({ name = '?', size = 32 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: hue(name),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 800,
      color: '#fff',
      flexShrink: 0,
      letterSpacing: '-0.02em',
    }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

/* ─── Rank badge ──────────────────────────────────────── */
const Rank = ({ r }) => {
  if (r === 1)
    return <Trophy size={15} className="text-amber-500 fill-amber-500" />;
  if (r === 2)
    return <Medal size={15} className="text-slate-400 fill-slate-400" />;
  if (r === 3)
    return <Award size={15} className="text-amber-700 fill-amber-700" />;
  return (
    <span className="text-xs font-bold text-slate-500 min-w-[16px] text-center">
      #{r}
    </span>
  );
};

/* ─── Stat Card ───────────────────────────────────────── */
const StatCard = ({ value, label, accentColorClass }) => (
  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
    <p
      className={`text-2xl md:text-3xl font-extrabold ${accentColorClass} leading-none`}
    >
      {value}
    </p>
    <p className="text-xs text-slate-400 mt-2 font-medium">{label}</p>
  </div>
);



const MODULE_LABELS = {
  courses: 'Courses',
  users: 'Users',
  payments: 'Payments',
  moderation: 'Moderation',
  notes: 'Notes Moderation',
  reels: 'Reels Moderation',
  mock_tests: 'Mock Tests',
  question_bank: 'Question Bank',
  sessions: 'Sessions',
  ai_tutor: 'AI Tutor',
  wallet: 'Wallet',
  references: 'References',
  student_assignment: 'Student Assignment',
  applications: 'Applications',
};

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  reject: 'Reject',
  refund: 'Refund',
  export: 'Export',
  flag: 'Flag',
  remove: 'Remove',
  ban: 'Ban',
  // mock_tests / question_bank
  assign: 'Assign',
  publish: 'Publish',
  import: 'Import',
  // ai_tutor
  access: 'Access',
  // wallet
  credit: 'Credit',
  debit: 'Debit',
  manage_settings: 'Manage Settings',
  // student_assignment
  assign_instructor: 'Assign Instructor',
  reassign: 'Reassign',
  unenroll: 'Unenroll',
};

const getGrantedPermissions = (user) => {
  const grouped = new Map();
  const permissionsList =
    (user?.role && typeof user.role === "object" && Array.isArray(user.role.permissions)
      ? user.role.permissions
      : null) ||
    (Array.isArray(user?.permissions) ? user.permissions : null) ||
    (Array.isArray(user?.basePermissions) ? user.basePermissions : null) ||
    (getCustomRole(user)?.permissions);

  if (Array.isArray(permissionsList)) {
    permissionsList.forEach((permission) => {
      const current = grouped.get(permission.module) || new Set();
      (permission.actions || []).forEach((action) => current.add(action));
      grouped.set(permission.module, current);
    });
  }

  // Also include modules granted via dashboardModules as "view"
  const dashMods = user?.dashboardModules ?? user?.role?.dashboardModules;
  if (Array.isArray(dashMods)) {
    dashMods.forEach((mod) => {
      if (mod && mod !== "overview") {
        const current = grouped.get(mod) || new Set();
        current.add("view");
        grouped.set(mod, current);
      }
    });
  }

  return [...grouped.entries()].map(([module, actions]) => ({
    module,
    actions: [...actions],
  }));
};

const AdminOverview = ({
  user,
  students = [],
  instructors = [],
  courses = [],
  totalEnrollments = 0,
  sortedInstructors = [],
}) => {
  const { t } = useTranslation();
  const maxRev = Math.max(...sortedInstructors.map((i) => i.rev), 1);

  // This view is shared by the full admin dashboard and the Staff dashboard's
  // Overview tab — a Staff member with limited permissions should never see
  // copy that addresses them as "Admin" or implies abilities (like approving
  // instructor applications) they may not actually have been granted.
  const isFullAdmin = hasBaseRole(user, 'admin');
  const firstName = user?.name?.split(' ')[0];
  const greetingName = isFullAdmin ? 'Admin' : firstName || 'Admin';

  // Get the role name safely — guard against unpopulated ObjectId strings
  const rawRoleName = getCustomRole(user)?.name;
  const isObjectId = rawRoleName && /^[a-f0-9]{24}$/i.test(rawRoleName);
  const roleLabel = isObjectId
    ? (isFullAdmin ? 'Administrator' : 'Staff Member')
    : rawRoleName || (isFullAdmin ? 'Administrator' : 'Staff Member');

  const grantedPermissions = getGrantedPermissions(user);
  const canViewUsers = hasPermission(user, 'users', 'view');
  const canViewCourses = hasPermission(user, 'courses', 'view');

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fadeIn">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden bg-slate-900/60 border border-indigo-900/30 rounded-2xl p-6 md:p-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-6 shadow-md shadow-indigo-950/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-violet-500/10 rounded-full blur-xl" />

        <div className="relative z-10">
          <p className="text-xs text-indigo-400 font-bold tracking-wider uppercase mb-2">
            Umang Vision Academy{' '}
            {isFullAdmin
              ? t("adminOverview.workspaceAdmin")
              : `${roleLabel} ${t("adminOverview.workspaceStaff")}`}
          </p>
          <p className="text-sm text-indigo-300 font-medium mb-1">
            {t("adminOverview.welcomeBack", { name: greetingName })}
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
            {isFullAdmin ? "Admin Dashboard" : "Staff Dashboard"}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            {isFullAdmin
              ? t("adminOverview.adminDesc")
              : t("adminOverview.staffDesc")}
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-[1.02] transition duration-200 text-white font-bold text-xs px-5 py-3 shadow-lg shadow-indigo-500/20">
            {t("adminOverview.systemWorkspaceActive")}
          </span>
        </div>
      </div>

      {!isFullAdmin && grantedPermissions.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            {t("adminOverview.grantedAccess")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grantedPermissions.map((permission) => (
              <div
                key={permission.module}
                className="rounded-xl border border-slate-800 bg-slate-950/30 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">
                  {MODULE_LABELS[permission.module] || permission.module}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {permission.actions.map((action) => (
                    <span
                      key={action}
                      className="rounded-md border border-emerald-900/40 bg-emerald-950/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300"
                    >
                      {ACTION_LABELS[action] || action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={students.length}
          label={t("adminOverview.enrolledStudents")}
          accentColorClass="text-indigo-400"
        />
        <StatCard
          value={`${Math.round(totalEnrollments / (courses.length || 1))}`}
          label={t("adminOverview.avgEnrollments")}
          accentColorClass="text-cyan-400"
        />
        <StatCard
          value={instructors.length}
          label={t("adminOverview.activeInstructors")}
          accentColorClass="text-pink-400"
        />
      </div>

      {/* Detail Rows (Top Instructors + Recent Courses) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Instructors Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            {t("adminOverview.topInstructors")}
          </h3>
          <div className="flex flex-col gap-3">
            {sortedInstructors.slice(0, 5).map((inst, i) => (
              <div
                key={inst._id}
                className="flex items-center gap-3 p-2 bg-slate-950/40 border border-slate-900 rounded-xl transition duration-150 hover:border-slate-800"
              >
                <div className="w-6 shrink-0 flex items-center justify-center">
                  <Rank r={i + 1} />
                </div>
                <Av name={inst.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {inst.name}
                    </p>
                    <span className="text-xs font-extrabold text-indigo-400 shrink-0">
                      {fmt(inst.rev)}
                    </span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct(inst.rev, maxRev)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {sortedInstructors.length === 0 && (
              <p className="text-slate-500 text-xs py-4 text-center">
                {t("adminOverview.noInstructorRankings")}
              </p>
            )}
          </div>
        </div>

        {/* Recent Courses Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            {t("adminOverview.recentCourses")}
          </h3>
          <div className="flex flex-col gap-2.5">
            {courses.slice(0, 5).map((c) => (
              <div
                key={c._id}
                className="flex items-between justify-between gap-4 p-2 bg-slate-950/40 border border-slate-900 rounded-xl transition duration-150 hover:border-slate-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <BookOpen size={14} className="text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {c.title || 'Untitled Course'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      By {c.instructor?.name || 'Anonymous'} ·{' '}
                      {c.studentsCount ?? c.students?.length ?? 0} students
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  <span className="text-xs font-extrabold text-emerald-400">
                    {fmt(
                      (c.price || 0) *
                        (c.studentsCount ?? c.students?.length ?? 0),
                    )}
                  </span>
                  {c.rating && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Star
                        size={8}
                        className="text-amber-500 fill-amber-500"
                      />
                      <span className="text-[9px] font-bold text-slate-500">
                        {c.rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <p className="text-slate-500 text-xs py-4 text-center">
                {t("adminOverview.noCoursesLaunched")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
