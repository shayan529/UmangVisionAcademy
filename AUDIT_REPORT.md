# MERN LMS Codebase Audit Report

This report outlines the findings from a full codebase audit of the Umang Vision Academy LMS project. The audit checks for bugs, security vulnerabilities, and performance issues across the Node.js/Express backend and React frontend.

## 1. Critical Security Vulnerabilities

### 1.1 Payment Verification Bypass (Razorpay)
- **Location:** `server/controllers/wallet.controller.js` (`verifyDeposit`)
- **Issue:** The endpoint trusts the `amount` passed in the `req.body` and directly credits it to the user's wallet. Razorpay's HMAC signature only covers the `orderId` and `paymentId`, **not** the amount. An attacker could initiate a small payment (e.g., ₹10) but intercept the verification request to send `amount: 100000`, falsely crediting their wallet with ₹10,000.
- **Fix:** Query the Razorpay API (`razorpay.payments.fetch(paymentId)`) during verification to confirm the actual captured amount before crediting the wallet.

### 1.2 NoSQL Injection via Unsanitized Updates
- **Location:** `server/controllers/session.controller.js` (line 227)
- **Issue:** The update object `req.body` is passed directly into `Session.findOneAndUpdate(query, req.body)`. Attackers could inject MongoDB operators like `$set` or `$unset` to bypass validation or overwrite restricted fields (e.g., taking ownership of the session by modifying the `instructor` field).
- **Fix:** Explicitly extract allowed fields from `req.body` or use strict sanitization before passing it to Mongoose updates.

## 2. High Priority Server & Stability Issues

### 2.1 Unhandled Promise Rejections
- **Location:** `server/controllers/cart.controller.js` (All methods: `addToCart`, `getCart`, `removeFromCart`, `clearCart`), `role.controller.js` (`getPermissionModules`), `wallet.controller.js` (`getRefundQueue`).
- **Issue:** Missing `try-catch` blocks in `async` route handlers. If a database query fails (e.g., timeout, connection error), it will result in an `UnhandledPromiseRejection`. In modern Node.js, this crashes the entire server process.
- **Fix:** Wrap all async controller functions in `try-catch` blocks and use `next(error)` or return a `500` status.

### 2.2 Memory Exhaustion (OOM) via File Uploads
- **Location:** `server/routes/upload.routes.js`
- **Issue:** Multer is configured with `memoryStorage()` and a 500 MB file size limit. If multiple users upload large videos concurrently, the server's RAM will be exhausted, leading to Out-of-Memory (OOM) crashes. Additionally, there is no file MIME-type filtering before the buffers are loaded.
- **Fix:** Switch to `diskStorage` or stream files directly to Cloudinary/S3. Only allow `memoryStorage()` for small avatars/images (e.g., < 5MB).

## 3. Medium Priority Performance & Logic Issues

### 3.1 N+1 Query in Bulk Course Assignment
- **Location:** `server/controllers/user.controller.js` (`bulkImportStudents`, lines 560-565)
- **Issue:** Inside a `Promise.all` loop over `courseIds`, the code calls `Course.findByIdAndUpdate` for each ID. This generates N separate database update queries.
- **Fix:** Refactor to use a single `Course.updateMany({ _id: { $in: courseIds } }, { $addToSet: { students: ... } })` query.

## 4. Frontend (Client) Audit

- **Route Gating Security:** Routes in `App.jsx` are currently utilizing `ProtectedRoute`, but we need to ensure that role-based component rendering properly matches the backend assigned roles (e.g., `hasBaseRole(req.user, "admin")`).
- **React Performance:** Global components like `Toaster` from `react-hot-toast` are initialized correctly in `main.jsx`, preventing duplicate re-renders.

---

### Recommended Execution Plan (In Order of Severity)
1. **Fix Payment Verification** (Critical - Financial loss risk)
2. **Fix NoSQL Injection** (Critical - Data integrity risk)
3. **Fix Unhandled Promises** (High - Stability risk)
4. **Refactor Uploads** (High - Server stability risk)
5. **Fix N+1 Queries** (Medium - Performance optimization)

Awaiting your confirmation to begin executing these fixes!
