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

You can run the frontend, backend API, and background worker concurrently from the root directory:

```bash
npm run dev
```

Alternatively, you can run them in separate terminals:

```bash
# Terminal 1 — start the backend API
cd server
npm run dev          # runs on http://localhost:5000

# Terminal 2 — start the frontend client
cd client
npm run dev          # runs on http://localhost:5173

# Terminal 3 — start the background worker
cd worker
npm run dev          # runs on http://localhost:3001
```

---

## Background Worker Service (`/worker`)

To support serverless deployment for the API (e.g., Vercel) while keeping asynchronous queues alive, the **BullMQ Background Worker** is separated into a standalone service located in the `/worker` directory.

### Local Development
1. Create a `worker/.env` file containing `MONGO_URI`, `REDIS_URL` (standard TCP/TLS endpoint like `redis://127.0.0.1:6379`), and dashboard basic auth credentials (`BULL_BOARD_USER`, `BULL_BOARD_PASSWORD`).
2. Run the worker locally with `npm run dev` inside the `/worker` folder.

### Separate Deployment
Since Vercel serverless functions cannot host long-running background workers:
- **API Serverless App**: Deployed on Vercel. Enqueues tasks to BullMQ (producing jobs).
- **Background Worker**: Deployed separately on a persistent platform (e.g., Railway, Fly.io, or VM). It runs the persistent Node process that executes jobs, updates database models, and caches leaderboard rankings. It also hosts the Bull Board dashboard on port `3001` (protected by HTTP Basic Auth).

The worker's container configuration is defined in [Dockerfile](file:///c:/AICoachingPlatform/worker/Dockerfile). Set `IS_WORKER=true` on the worker hosting platform to trigger the actual nodemailer/SMS notifications.

---

## Production & Scaling (5 Lakh+ Users)

The platform is designed to scale horizontally to support **500,000+ active users**. 

For complete documentation on the production infrastructure setup, caching strategies, WebSockets synchronization, background jobs, database indexing, and scaling configurations, see the [SCALING.md](file:///c:/AICoachingPlatform/SCALING.md) guide.

