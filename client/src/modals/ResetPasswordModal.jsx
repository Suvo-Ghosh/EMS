// src/pages/ResetPasswordModal.jsx
import { useState } from "react";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import api from "../api/axios.js";

const ResetPasswordModal = ({ email, otp, onClose }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
    const handleConfirmPasswordChange = (e) =>
        setConfirmPassword(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const response = await api.post("/api/auth/reset-password-with-otp", {
                email,
                otp,
                newPassword,
            });

            if (response.data.ok) {
                setSuccess(true);
            } else {
                setError(response.data.message || "Failed to reset password");
            }
        } catch (err) {
            console.error("Error resetting password:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex justify-center items-center px-4">
            <div className="bg-white dark:bg-slate-950 border px-4 py-2 md:px-6 md:py-4 rounded-lg shadow-lg w-full max-w-md mx-4 md:mx-0 overflow-y-auto max-h-[90vh]">
                <h2 className="text-lg md:text-xl text-center font-semibold mb-2 md:mb-4 text-slate-900 dark:text-slate-100">
                    Reset Your Password
                </h2>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {success && (
                    <div className="flex flex-col justify-center items-center mt-5">
                        <p className="text-green-500 text-sm mb-4 text-center">
                            Password reset successfully! You can now log in with your new
                            password.
                        </p>
                        <button className="text-slate-900 dark:text-slate-100 border w-fit rounded px-10 py-1" onClick={onClose}>
                            Login
                        </button>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="New Password"
                            name="newPassword"
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                            required
                            type="password"
                        />
                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
                            type="password"
                        />

                        <div className="flex justify-between mt-4">
                            <SecondaryButton type="button" onClick={onClose}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordModal;
