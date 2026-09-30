import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const { login, register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    
    if (!isLogin) {
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setLocalError("Password must be at least 6 characters.");
        return;
      }
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
    } catch (err) {
      // Error is handled in store, but we can catch local ones
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#121214] p-6 shadow-2xl">
        <h2 className="mb-6 text-2xl font-bold text-white">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        
        {(error || localError) && (
          <div className="mb-4 rounded-md bg-red-500/20 p-3 text-sm text-red-200">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-gray-400">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm text-gray-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-400"
            />
          </div>
          
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm text-gray-400">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setLocalError("");
              }}
              className="text-sm text-amber-400 hover:underline"
            >
              {isLogin ? "Need an account?" : "Already have an account?"}
            </button>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-md bg-amber-400 px-4 py-2 text-black font-semibold hover:bg-amber-300 disabled:opacity-50"
            >
              {isLoading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
