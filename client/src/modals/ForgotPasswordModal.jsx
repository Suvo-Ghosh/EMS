// src/pages/ForgotPasswordModal.jsx
import { useState } from "react";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import api from "../api/axios.js";

const ForgotPasswordModal = ({ onClose, onOtpSent }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/forgot-password", { email });

      if (response.data.ok) {
        setSuccess(true);
        onOtpSent?.(email); // tell parent which email to use
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex justify-center items-center px-4">
      <div className="bg-white dark:bg-slate-950 border px-4 py-2 md:px-6 md:py-4 rounded-lg shadow-lg w-full max-w-md mx-4 md:mx-0 overflow-y-auto max-h-[90vh]">
        <h2 className="text-slate-900 dark:text-slate-100 text-lg md:text-xl text-center font-semibold">
          Forgot Password
        </h2>
        <p className="mb-2 md:mb-4 text-center text-slate-900 dark:text-slate-100">
          Enter your email to get an OTP
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && (
          <p className="text-green-500 text-sm mb-4">
            OTP sent successfully! Please check your email.
          </p>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
            />

            <div className="flex justify-between mt-4">
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
