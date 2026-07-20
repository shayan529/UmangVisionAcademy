# Umang Vision Academy

An AI-powered EdTech platform for Indian students (Classes 1–12) featuring live classes, recorded courses, an AI tutor, instructor dashboards, subscription billing via Razorpay, and admin management.

---

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, Redux Toolkit, React Router v7, Tailwind CSS v4, Framer Motion, Socket.io-client, i18next, Three.js |
| Backend  | Node.js, Express.js                                    |
| Database | MongoDB (Mongoose), Redis (Upstash)                    |
| Auth     | JWT, Twilio, Fast2SMS                                  |
| Payments | Razorpay                                               |
| Media    | Cloudinary, ImageKit, Fluent-FFmpeg, Multer            |
| AI       | Groq SDK (Llama 3.3)                                   |
| Other    | Nodemailer, Socket.io                                  |

---

## Project Structure

```text
Umang Vision Academy/
├── client/                          # React frontend (Vite)
│   ├── public/
│   └── src/
│       ├── assets/                  # Images, SVGs, etc.
│       ├── components/              # Reusable React components (admin, common, instructor, student, landing, etc.)
│       ├── config/                  # Configuration files
│       ├── data/                    # Static data or constants
│       ├── i18n/                    # Internationalization config
│       ├── Layout/                  # Layout wrappers
│       ├── pages/                   # Page components
│       ├── redux/                   # Redux slices and store
│       └── utils/                   # Helper functions
│
└── server/                          # Express backend
    ├── controllers/                 # Request handlers for routes (course, user, mockTest, reel, ai, etc.)
    ├── middleware/                  # Custom middlewares (auth, upload, etc.)
    ├── models/                      # Mongoose schemas (user, courses, mockTest, reel, role, etc.)
    ├── routes/                      # API route definitions
    ├── scripts/                     # Utility scripts
    ├── tests/                       # Test files
    ├── uploads/                     # Temporary upload directory
    ├── utils/                       # Helper functions
    ├── .env.example                 # Example environment variables
    └── server.js                    # Server entry point
```

---

## Environment Variables

### Server — `server/.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/umang_vision_academy
MONGO_MAX_POOL_SIZE=100

# Redis Config
UPSTASH_REDIS_REST_URL=https://your-upstash-redis-rest-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token_here
REDIS_URL=redis://127.0.0.1:6379

# Nodemailer / Gmail Configuration
GMAIL_USER=umangvisionacademy@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here

# ImageKit Configuration (Media Uploads)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key_here
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint_id

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Groq SDK Configuration (AI Assistant)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid_here

# Fast2SMS Configuration
FAST2SMS_API_KEY=your_fast2sms_api_key_here
FAST2SMS_OTP_ID=your_fast2sms_otp_id_here
```

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

You can run the frontend and backend API concurrently from the root directory:

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
```

