import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Mail,
    MapPin,
    CalendarClock,
    BookOpen,
    Users,
    Star,
    ArrowLeft,
    Loader2,
    GraduationCap,
} from "lucide-react";
import api from "../../config/api";
import CourseCard from "./CourseCard"; // adjust path to match your project

const fmtDate = (d) => {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
};

const hue = (name = "?") => {
    const palette = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];
    return palette[name.charCodeAt(0) % palette.length];
};

const Av = ({ name = "?", size = 88, src }) => {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
                className="flex-shrink-0 shadow-lg"
            />
        );
    }
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: hue(name),
                fontSize: size * 0.36,
            }}
            className="flex items-center justify-center font-extrabold text-white flex-shrink-0 shadow-lg"
        >
            {name.slice(0, 2).toUpperCase()}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`rounded-xl border border-${color}-500/20 bg-${color}-500/10 p-4`}>
        <div className={`flex items-center gap-2 text-${color}-300/80`}>
            <Icon size={14} />
            <p className="text-xs uppercase tracking-wider font-bold">{label}</p>
        </div>
        <p className={`text-2xl font-extrabold text-${color}-300 mt-1.5`}>{value}</p>
    </div>
);

const InstructorAboutPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        api
            .get(`/users/instructors/${id}/public`)
            .then(({ data }) => {
                if (active) setInstructor(data);
            })
            .catch((err) => {
                if (active)
                    setError(
                        err.response?.data?.message ||
                        "Could not load this instructor's profile.",
                    );
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <section className="min-h-screen bg-[#0B1120] flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
            </section>
        );
    }

    if (error || !instructor) {
        return (
            <section className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <GraduationCap size={36} className="text-slate-600" />
                <p className="text-slate-400">{error || "Instructor not found."}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-sm font-semibold"
                >
                    <ArrowLeft size={14} />
                    Go back
                </button>
            </section>
        );
    }

    const courses = instructor.courses ?? [];

    return (
        <section className="min-h-screen bg-[#0B1120] px-6 md:px-10 py-16">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-semibold mb-8"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>

                {/* Header */}
                <div className="rounded-3xl border border-slate-800 bg-[#111827] p-8 flex flex-col md:flex-row gap-6 items-start">
                    <Av name={instructor.name} src={instructor.avatarUrl} size={88} />
                    <div className="flex-1 min-w-0">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                            Instructor
                        </p>
                        <h1 className="text-3xl font-extrabold text-white">
                            {instructor.name}
                        </h1>
                        {instructor.specialization && (
                            <p className="text-slate-400 mt-1">{instructor.specialization}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-400">
                            {(instructor.city || instructor.state) && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    {[instructor.city, instructor.state].filter(Boolean).join(", ")}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <CalendarClock size={14} />
                                Joined {fmtDate(instructor.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                {instructor.bio && (
                    <div className="mt-8 rounded-2xl border border-slate-800 bg-[#111827] p-6">
                        <h2 className="text-lg font-bold text-white mb-2">About</h2>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                            {instructor.bio}
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                    <StatCard icon={BookOpen} label="Courses" value={courses.length} color="emerald" />
                    <StatCard icon={Users} label="Students" value={instructor.totalStudents ?? 0} color="sky" />
                    <StatCard
                        icon={Star}
                        label="Avg Rating"
                        value={
                            instructor.avgRating
                                ? `${instructor.avgRating} ★ (${instructor.ratingCount} ${instructor.ratingCount === 1 ? "review" : "reviews"})`
                                : "No ratings yet"
                        }
                        color="amber"
                    />
                </div>

                {/* Courses */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6">
                        Courses by {instructor.name}
                    </h2>
                    {courses.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {courses.map((course) => (
                                <div
                                    key={course._id}
                                    onClick={() => navigate(`/courses/${course._id}/demo`)}
                                    className="cursor-pointer"
                                >
                                    <CourseCard
                                        course={{
                                            _id: course._id,
                                            title: course.title,
                                            instructor: instructor.name,
                                            instructorId: instructor._id,
                                            rating: course.ratingAverage ?? 0,
                                            reviews: course.reviewCount ?? 0,
                                            price: course.price > 0 ? `₹${course.price}` : "Free",
                                            image: course.thumbnailUrl ?? null,
                                            board: course.board ?? null,
                                            category: course.category ?? null,
                                            students: course.students?.length ?? course.enrolledCount ?? 0,
                                            enrolled: false,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500">
                            Not teaching any published courses yet.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default InstructorAboutPage;