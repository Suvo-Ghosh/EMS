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
 * - initialProfileImage?: string
 * - onSuccess?: (updatedUser) => void   // optional callback to update context/UI
 */
const ProfileEdit = ({
    onClose,
    initialName = "",
    initialEmail = "",
    initialProfileImage = "",
    onSuccess,
}) => {
    const [fullName, setFullName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [profilePreview, setProfilePreview] = useState(initialProfileImage);
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);

        const url = URL.createObjectURL(f);
        setProfilePreview(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("email", email);
            if (file) {
                // must match upload.single("profileImage") on backend
                formData.append("profileImage", file);
            }

            const { data } = await api.post("/api/auth/edit-profile", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (!data.ok) {
                setError(data.message || "Failed to update profile.");
            } else {
                if (typeof onSuccess === "function") {
                    onSuccess(data.user); // will include profileImage if backend sends it
                }
                toast.success(data.message || "Profile updated successfully.");
                onClose();
            }
        } catch (err) {
            console.error("Edit profile error:", err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.msg ||
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

                    {/* Avatar preview + file input */}
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                            {profilePreview ? (
                                <img
                                    src={profilePreview}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>No image</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                                Profile picture
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block text-[11px] text-slate-700 dark:text-slate-100"
                            />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                JPG/PNG, max 2MB. Square images look best.
                            </p>
                        </div>
                    </div>

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

                    <div className="flex justify-between gap-2 pt-1 md:col-span-2">
                        <SecondaryButton
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5"
                        >
                            Back
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={loading}
                            className="px-3 py-1.5"
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
