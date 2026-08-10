export const FREE_YEAR = 2025;
export const PYQ_PRICE = 20;
export const FREE_PAPERS_COUNT = 1;

export const getPYQAccessResult = ({
  year,
  purchasedPYQs = [],
  enrolledCourses = [],
  className,
  subject,
  board,
  subscription = null,
  selectedClass = null,
}) => {
  if (year === FREE_YEAR || year === String(FREE_YEAR)) {
    return { access: true, reason: "free_year", price: PYQ_PRICE };
  }

  const pyqIdVariants = [
    [board, className, subject, year],
    [className, subject, year],
    [subject, year],
  ]
    .map((parts) =>
      parts
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .join("_"),
    )
    .filter(Boolean);

  if (pyqIdVariants.some((candidate) => purchasedPYQs?.includes(candidate))) {
    return { access: true, reason: "purchased", price: PYQ_PRICE };
  }

  const yearNum = Number(year);
  const isFreePaper =
    Number.isFinite(yearNum) && yearNum === FREE_YEAR - (FREE_PAPERS_COUNT - 1);
  if (isFreePaper) {
    return { access: true, reason: "free_year", price: PYQ_PRICE };
  }

  // ── Plan-based Question Bank Access (3 Years for Basic, 10 Years for Premium/Elite) ──
  if (subscription?.status === "active" && subscription?.plan) {
    const plan = subscription.plan.toLowerCase();
    const currentYear = new Date().getFullYear();
    const isBasic = plan === "basic" || plan === "base";
    const isPremiumOrElite = plan === "premium" || plan === "elite";
    const maxYears = isPremiumOrElite ? 10 : isBasic ? 3 : 0;

    const classMatches = !selectedClass || !className || selectedClass.toLowerCase() === className.toLowerCase();

    if (maxYears > 0 && Number.isFinite(yearNum) && yearNum >= currentYear - maxYears && classMatches) {
      return { access: true, reason: "subscription_plan", plan: subscription.plan, price: PYQ_PRICE };
    }
  }

  const hasCourse = enrolledCourses?.some((c) => {
    const courseCategory = c.category?.toLowerCase();
    const courseTitle = c.title?.toLowerCase();
    const wantedCategory = className?.toLowerCase();
    const wantedTitle = subject?.toLowerCase();
    return courseCategory === wantedCategory && courseTitle === wantedTitle;
  });

  if (hasCourse) {
    return { access: true, reason: "course_enrolled", price: PYQ_PRICE };
  }

  return { access: false, reason: "purchase_required", price: PYQ_PRICE };
};
