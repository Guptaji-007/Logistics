"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "next-auth/react";


const MailIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
  </svg>
);

const LockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
  </svg>
);

const LogisticsLogo = (props) => (
  <img
    src="/assets/logo.png"
    alt="Logistics Logo"
    {...props}
  />

);


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res.ok) {
      const session = await getSession();
      const role = session?.user?.role;

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    // <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50">
    //   <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
    //     <h2 className="text-2xl font-bold mb-2">Login</h2>

    //     <input
    //       type="email"
    //       placeholder="Email"
    //       className="border p-2 rounded"
    //       value={email}
    //       onChange={(e) => setEmail(e.target.value)}
    //       required
    //     />

    //     <input
    //       type="password"
    //       placeholder="Password"
    //       className="border p-2 rounded"
    //       value={password}
    //       onChange={(e) => setPassword(e.target.value)}
    //       required
    //     />

    //     {error && <div className="text-red-500 text-sm">{error}</div>}

    //     <button
    //       type="submit"
    //       className={`bg-black text-white p-2 rounded ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
    //       disabled={loading}
    //     >
    //       {loading ? "Signing in..." : "Log In"}
    //     </button>

    //     <Link href="/signup" className="text-green-500 underline text-sm text-center">
    //       Don't have an account? Sign up
    //     </Link>
    //   </form>
    // </div>

    <>
      {/* Grid background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      {/* Radial gradient glow - adjusted for better responsiveness */}
      <div className="absolute -z-10 top-[-20%] left-1/2 -translate-x-1/2 h-[120vh] w-[120vw] max-w-[1200px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(251,251,251,0.1),rgba(0,0,0,0))]"></div>
      <div className="flex min-h-screen bg-white">
        {/* Left-side Branding Column */}
        <div className="hidden lg:flex lg:flex-col lg:w-1/2 items-center justify-center bg-black text-white p-12 text-center">
          {/* Replace with your actual logo */}
          <LogisticsLogo className="h-24 w-24 text-green-400" />
          <h1 className="mt-1 text-4xl font-bold ">
            <i>Logistique</i>
          </h1>
          <p className="mt-4 text-lg font-bold text-gray-300 ">
            Your partner in reliable and efficient freight forwarding.
          </p>
        </div>

        {/* Right-side Form Column */}
        <div className="flex flex-1 flex-col justify-center items-center p-6 lg:p-12 bg-gray-50">
          <div className="w-full max-w-sm">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to manage your shipments.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <LockIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full bg-green-600 text-white p-3 rounded-lg font-semibold transition-all duration-300 ease-in-out
                          ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-700 hover:-translate-y-0.5"}`}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {/* Link to Sign Up */}
              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link href="/signup" className="text-green-500 underline text-sm text-center">Sign up</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
