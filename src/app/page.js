"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await fetch("/api/db/mysql/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const res = await data.json();
      if (res.message) {
        router.push("/pages?user_id=" + res.user_id);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Dummy Google login
  function handleGoogleLogin() {
    alert("Google login clicked (integrate Firebase/Auth0 to make it work)");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 shadow-lg rounded-xl p-10 w-full max-w-md min-h-[500px] flex flex-col justify-center"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-black">
          Login
        </h1>

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <div className="my-6 text-center text-gray-500">or</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 w-full border border-gray-300 py-2 rounded hover:bg-gray-100 text-black"
        >
          <FcGoogle size={20} />
          <span>Login with Google</span>
        </button>

        {error && (
          <p className="mt-4 text-red-600 text-center text-sm">{error}</p>
        )}
      </form>
    </div>
  );
}
