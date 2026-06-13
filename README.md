# Umang Vision Academy

An AI-powered EdTech platform for Indian students (Classes 1–12) featuring live classes, recorded courses, an AI tutor, instructor dashboards, subscription billing via Razorpay, and admin management.

---

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 18, Redux Toolkit, React Router v6, Tailwind CSS |
| Backend  | Node.js, Express.js                                    |
| Database | MongoDB (Mongoose)                                     |
| Auth     | JWT                                                    |
| Payments | Razorpay                                               |
| Media    | ImageKit (thumbnails, demo videos)                     |
| State    | Redux Toolkit                                          |

---

## Project Structure

```
Umang Vision Academy/
├── client/                          # React frontend
│   ├── public/
│   └── src/
│       ├── config/
│       │   └── api.js               # Axios instance + API_ENDPOINTS map
│       ├── redux/
│       │   ├── store.js
│       │   └── slices/
│       │       ├── authSlice.js
│       │       ├── courseSlice.js   # fetchCourses, fetchEnrolledCourses, fetchAllCoursesAdmin, fetchPublishedCourses
│       │       ├── cartSlice.js     # addToCart, removeFromCart, checkoutAndEnroll
│       │       ├── billingSlice.js  # fetchSubscription, createOrder, verifyPayment, cancelSubscription
│       │       ├── studentSlice.js  # fetchStudents, fetchStudentActivity
│       │       └── usersSlice.js    # fetchUsers, deleteUser
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── AboutUs.jsx
│       │   ├── Signup.jsx
│       │   ├── Login.jsx
│       │   ├── CartPage.jsx
│       │   ├── BillingPage.jsx
│       │   └── CourseDemo.jsx       # Public demo page — /courses/:id/demo
│       └── components/
│           ├── landing/
│           │   ├── Navbar.jsx
│           │   ├── Hero.jsx
│           │   ├── Courses.jsx      # Mock data (Class + Subject filters)
│           │   ├── Plans.jsx        # Redirects to /billing with selected plan
│           │   └── Footer.jsx
│           ├── student/
│           │   ├── StudentDashboard.jsx
│           │   ├── DashboardHome.jsx
│           │   ├── MyCourses.jsx
│           │   ├── Sidebar.jsx
│           │   └── ...
│           ├── instructor/
│           │   ├── InstructorDashboard.jsx
│           │   ├── InstructorCourses.jsx
│           │   ├── InstructorHome.jsx
│           │   ├── InstructorStudents.jsx
│           │   ├── InstructorSessions.jsx
│           │   ├── InstructorAnalytics.jsx
│           │   ├── InstructorAI.jsx
│           │   ├── InstructorSettings.jsx
│           │   ├── InstructorData.js
│           │   └── InstructorUi.jsx  # Shared UI — Toast, AddCourseModal, Btn
│           └── admin/
│               ├── AdminDashboard.jsx
│               ├── AdminOverview.jsx
│               ├── AdminCourses.jsx
│               ├── AdminStudents.jsx
│               ├── AdminInstructors.jsx
│               ├── AdminLeaderboard.jsx
│               ├── AdminApplications.jsx
│               └── AdminSidebar.jsx
│
└── server/                          # Express backend
    ├── .env
    ├── server.js
    ├── models/
    │   ├── courses.model.js         # Course schema (demoVideoUrl, students[], lessons[])
    │   └── user.model.js            # User schema (roles[], subscription{}, enrolledCourses[])
    ├── controllers/
    │   ├── course.controller.js
    │   ├── billing.controller.js
    │   ├── student.controller.js
    │   ├── user.controller.js
    │   ├── instructorApplication.controller.js
    │   └── session.controller.js
    ├── routes/
    │   ├── course.routes.js
    │   ├── billing.routes.js
    │   ├── student.routes.js
    │   ├── user.routes.js
    │   ├── instructorApplication.routes.js
    │   └── session.routes.js
    └── middleware/
        └── auth.middleware.js       # protect, isAdmin
```

---

## Environment Variables

### Server — `server/.env`

````env
# ── Server ────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── MongoDB ───────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/Umang Vision Academy

# ── JWT ───────────────────────────────────────────
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# ── Razorpay ──────────────────────────────────────
# Get these from https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# ── ImageKit ──────────────────────────────────────
# Get these from https://imagekit.io/dashboard/developer/api-keys
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# ── CORS ──────────────────────────────────────────
CLIENT_URL=http://localhost:5173
---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Razorpay account (test mode keys are fine for development)
- ImageKit account (free tier works)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/Umang Vision Academy.git
cd Umang Vision Academy

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
````

### Running Locally

```bash
# Terminal 1 — start the backend
cd server
npm run dev          # runs on http://localhost:5000

# Terminal 2 — start the frontend
cd client
npm run dev          # runs on http://localhost:5173
```
