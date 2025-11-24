// src/pages/VerifyOtpModal.jsx
import { useState } from "react";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import api from "../api/axios.js";

const VerifyOtpModal = ({ email, onClose, onSuccess }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleOtpChange = (e) => setOtp(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/verify-otp", { email, otp });

      if (response.data.ok) {
        setSuccess(true);
        onSuccess?.(otp); // pass otp back to parent
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex justify-center items-center px-4">
      <div className="bg-white dark:bg-slate-950 border px-4 py-2 md:px-6 md:py-4 rounded-lg shadow-lg w-full max-w-md mx-4 md:mx-0 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg md:text-xl text-center font-semibold mb-2 md:mb-4 text-slate-900 dark:text-slate-100">
          Verify OTP
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && (
          <p className="text-green-500 text-sm mb-4">
            OTP verified successfully! You can now reset your password.
          </p>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Enter OTP"
              name="otp"
              value={otp}
              onChange={handleOtpChange}
              required
              type="text"
            />

            <div className="flex justify-between mt-4">
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </PrimaryButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyOtpModal;
