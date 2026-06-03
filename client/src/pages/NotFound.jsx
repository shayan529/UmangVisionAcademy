import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <div className="text-8xl mb-4">😕</div>

      <h1 className="text-6xl font-bold text-gray-800">404</h1>

      <h2 className="text-2xl font-semibold text-gray-700 mt-2">
        Page Not Found
      </h2>

      <p className="text-gray-500 mt-3 max-w-md">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;