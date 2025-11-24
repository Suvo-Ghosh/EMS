// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { FiEye, FiEyeOff } from "react-icons/fi";
import ForgotPasswordModal from "../modals/ForgotPasswordModal.jsx";
import VerifyOtpModal from "../modals/VerifyOtpModal.jsx";
import ResetPasswordModal from "../modals/ResetPasswordModal.jsx";

const Login = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Forgot password flow state
    const [forgotStep, setForgotStep] = useState(null); // null | "email" | "otp" | "reset"
    const [resetEmail, setResetEmail] = useState("");
    const [verifiedOtp, setVerifiedOtp] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const result = await login(email, password);
        setSubmitting(false);

        if (!result.ok) {
            setError(result.message || "Login failed");
            return;
        }

        navigate("/");
    };

    const openForgotFlow = () => {
        setForgotStep("email");
        setResetEmail("");
        setVerifiedOtp("");
    };

    const closeForgotFlow = () => {
        setForgotStep(null);
        setResetEmail("");
        setVerifiedOtp("");
    };

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Header / branding */}
                <div className="mb-6 text-center">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        Employee Management &amp; Payroll
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Sign in to access your dashboard.
                    </p>
                </div>

                {/* Card */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl px-4 py-5 sm:px-6 sm:py-6 space-y-4"
                >
                    <h2 className="text-lg font-semibold text-center text-slate-900 dark:text-slate-100">
                        Login
                    </h2>

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-200 text-center">
                            {error}
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-xs sm:text-sm mb-1 text-slate-700 dark:text-slate-200">
                            Email
                        </label>
                        <input
                            type="email"
                            className="block w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                        />
                    </div>

                    {/* Password with show/hide */}
                    <div>
                        <label className="block text-xs sm:text-sm mb-1 text-slate-700 dark:text-slate-200">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="block w-full px-3 py-2 pr-10 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="*******"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <FiEye className="w-4 h-4" />
                                ) : (
                                    <FiEyeOff className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-2 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? "Logging in..." : "Login"}
                    </button>

                    {/* Forgot password */}
                    <button
                        type="button"
                        onClick={openForgotFlow}
                        className="w-full text-right text-sm cursor-pointer hover:underline text-slate-500 dark:text-slate-400 mt-2"
                    >
                        Forgot Password?
                    </button>
                </form>
            </div>

            {/* Forgot password modals */}
            {forgotStep === "email" && (
                <ForgotPasswordModal
                    onClose={closeForgotFlow}
                    onOtpSent={(emailValue) => {
                        setResetEmail(emailValue);
                        setForgotStep("otp");
                    }}
                />
            )}

            {forgotStep === "otp" && (
                <VerifyOtpModal
                    email={resetEmail}
                    onClose={closeForgotFlow}
                    onSuccess={(otpValue) => {
                        setVerifiedOtp(otpValue);
                        setForgotStep("reset");
                    }}
                />
            )}

            {forgotStep === "reset" && (
                <ResetPasswordModal
                    email={resetEmail}
                    otp={verifiedOtp}
                    onClose={closeForgotFlow}
                />
            )}
        </div>
    );
};

export default Login;
