import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LockScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Prevent going back using browser back button
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const unlock = () => {
    // 🔐 Replace with real auth later
    if (password === "1234") {
      localStorage.setItem("isLocked", "false");
      navigate("/employee/dashboard");
    } else {
      setError("Wrong password ❌");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center border border-slate-200">
        
        <h2 className="text-xl font-bold mb-2 text-slate-800">
          🔒 Screen Locked
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Enter password to continue
        </p>

        <input
          type="password"
          placeholder="Enter password"
          className="w-full border border-slate-300 p-2.5 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
        />

        {error && (
          <p className="text-red-500 text-xs mb-2">{error}</p>
        )}

        <button
          onClick={unlock}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Unlock
        </button>

      </div>
    </div>
  );
}