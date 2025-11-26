import { useState } from 'react';
import api from "../api/axios.js";
import { Input } from "../components/ui/Input.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
// import { NavLink } from "react-router-dom";

function ChangePassword({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const payload = {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword
            }

            const { data } = await api.post("/api/auth/reset-password", payload);
            if (data?.ok) {
                onClose?.(); // close modal
                toast.success(data?.message || "Passwoed updated successfully")
            } else {
                setError(data?.message || "Failed to change password.");
            }


        } catch (err) {
            console.error("Error while changing password:", err);
            setError(
                err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex justify-center items-center px-4">
                <div className="bg-white dark:bg-slate-950 border border-blue-950 rounded-lg shadow-lg w-full max-w-md  mx-4 md:mx-0 overflow-y-auto max-h-[90vh]">
                    <div className="py-3  px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Change Password</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-1 px-4 md:px-6">{error}</p>}

                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1  gap-2 px-4 md:px-6 py-2 md:py-3"
                    >
                        {/* Left column */}
                        <div className="space-y-2">
                            <Input
                                label="Old Password"
                                name="oldPassword"
                                value={form.oldPassword}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="New Password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>


                        {/* Buttons row spans full width */}
                        <div className="flex justify-between mt-4 md:col-span-2">
                            <SecondaryButton type="button" onClick={onClose}>
                                Back
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={loading}>
                                {loading ? "Submitting..." : "Change Password"}
                            </PrimaryButton>
                        </div>
                        {/* <NavLink to="/forgotPassword" className='text-right text-xs text-blue-800 hover:underline cursor-pointer'>Forgot Password?</NavLink> */}
                    </form>
                </div>
            </div>
        </>
    )
}

export default ChangePassword;