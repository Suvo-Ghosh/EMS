import { useState } from "react";
import api from "../api/axios.js";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import { toast } from "sonner";

/**
 * Props:
 * - onClose: () => void
 * - initialName: string
 * - initialEmail: string
 * - onSuccess?: (updatedUser) => void   // optional callback to update context/UI
 */
const ProfileEdit = ({ onClose, initialName = "", initialEmail = "", onSuccess }) => {
    const [fullName, setFullName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post("/api/auth/edit-profile", {
                fullName,
                email,
            });

            if (!data.ok) {
                setError(data.message || "Failed to update profile.");
            } else {
                // Let parent/Profile update AuthContext or UI
                if (typeof onSuccess === "function") {
                    onSuccess(data.user);
                }
                toast.success(data.message);
                onClose();
            }
        } catch (err) {
            console.error("Edit profile error:", err);
            setError(
                err.response?.data?.message || err.response?.data?.errors?.[0]?.msg ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Edit Profile</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
                    {error && (
                        <p className="text-xs text-red-500 mb-2">
                            {error}
                        </p>
                    )}

                    <Input
                        label="Full Name"
                        name="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />

                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <div className="flex justify-end gap-2 pt-1">
                        <SecondaryButton
                            type="button"
                            onClick={onClose}
                            className="text-xs px-3 py-1.5"
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={loading}
                            className="text-xs px-3 py-1.5"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;
