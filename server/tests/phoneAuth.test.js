import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import PhoneOtpRouter from "../routes/PhoneOtp.routes.js";

// Helper to make mock requests against Express router
const createMockApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", PhoneOtpRouter);
  return app;
};

test("POST /api/auth/send-phone-otp requires phoneNumber", async () => {
  const app = createMockApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/auth/send-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /Phone number is required/i);
  } finally {
    server.close();
  }
});

test("POST /api/auth/send-phone-otp validates E.164 format", async () => {
  const app = createMockApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/auth/send-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "9876543210" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /E.164 format/i);
  } finally {
    server.close();
  }
});

test("POST /api/auth/verify-phone-otp succeeds with dev OTP 123456", async () => {
  const app = createMockApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/auth/verify-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+919876543210", otp: "123456" }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.match(data.message, /verified successfully/i);
  } finally {
    server.close();
  }
});

test("POST /api/auth/verify-phone-otp rejects invalid OTP with status 400", async () => {
  const app = createMockApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/auth/verify-phone-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: "+919876543210", otp: "000000" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /Invalid or expired/i);
  } finally {
    server.close();
  }
});
