// pages/student/MockTests/index.jsx
// This is the route index — renders Outlet with a sub-nav for mock tests
import { NavLink, Outlet } from "react-router-dom";
import { FaClipboardList, FaChartBar, FaTrophy } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function MockTestsLayout() {
  const { t } = useTranslation();

  const subNav = [
    {
      label: t("studentMockTests.availableTests"),
      to: "/student-dashboard/mock-tests",
      icon: FaClipboardList,
      end: true,
    },
    {
      label: t("studentMockTests.resultsAnalytics"),
      to: "/student-dashboard/mock-tests/results",
      icon: FaChartBar,
    },
    {
      label: t("studentMockTests.leaderboard"),
      to: "/student-dashboard/mock-tests/leaderboard",
      icon: FaTrophy,
    },
  ];

  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
