import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button.jsx";
import ChangePassword from "../modals/ChangePassword.jsx";
import ProfileEdit from "../modals/ProfileEdit.jsx";

const formatDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
};

const Profile = () => {
    const { user, updateUser } = useAuth();   
    const employee = user?.employee || null;
    const isEmployee = user?.role === "employee" && !!employee;
    const [showResetModal, setShowResetModal] = useState(false);
    const [showProfileEditModal, setShowProfileEditModal] = useState(false);

    const initials = useMemo(() => {
        if (!user?.fullName) return "U";
        const parts = user.fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [user]);

    const accountCreatedDate = useMemo(
        () => formatDate(user?.createdAt),
        [user]
    );

    const employeeJoiningDate = useMemo(
        () => formatDate(employee?.dateOfJoining),
        [employee]
    );


    return (
        <div className="">
            <PageHeader
                title="My Profile"
                subtitle="View your account details and role in the organization."
            />

            {/* Top section: avatar + basic info */}
            <Card className="mb-6">
                <CardContent className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                            {
                                user?.profileImage
                                    ? <img src={user?.profileImage} className="rounded-full" />
                                    : initials
                            }
                        </div>
                    </div>

                    {/* Name + role + status */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <h2 className="text-lg text-center sm:text-left font-semibold truncate">
                            {user?.fullName || "User"}
                        </h2>

                        <div className="flex flex-wrap items-center gap-2 text-xs justify-center sm:justify-start">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                {user?.role || "role not set"}
                            </span>

                            <StatusBadge status={user?.status || "active"} />
                        </div>

                        {user?.email && (
                            <p className="text-sm text-center sm:text-left text-slate-600 dark:text-slate-300 break-all">
                                {user.email}
                            </p>
                        )}

                        {accountCreatedDate && user?.role === "superAdmin" && (
                            <p className="text-xs text-center sm:text-left text-slate-500 dark:text-slate-400">
                                Account created on {accountCreatedDate}
                            </p>
                        )}

                        {isEmployee && employeeJoiningDate && (
                            <p className="text-xs text-center sm:text-left text-slate-500 dark:text-slate-400">
                                Date of joining: {employeeJoiningDate}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col w-full sm:w-fit gap-2 mt-2 sm:mt-0">
                        <SecondaryButton
                            type="button"
                            className="text-xs px-3 py-1.5"
                            onClick={() => {
                                setShowProfileEditModal(true);
                            }}
                        >
                            Edit Profile
                        </SecondaryButton>
                        <PrimaryButton
                            type="button"
                            className="text-xs px-3 py-1.5"
                            onClick={() => {
                                setShowResetModal(true);
                            }}
                        >
                            Change Password
                        </PrimaryButton>
                    </div>
                </CardContent>
            </Card>

            {/* Account details */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 xxs:grid-cols-2 gap-y-4  text-sm">
                        <ProfileField label="Full Name" value={user?.fullName || "—"} />
                        <ProfileField label="Email" value={user?.email || "—"} />
                        <ProfileField label="Role" value={user?.role || "—"} />
                        <ProfileField label="Status" value={user?.status || "Active"} />
                        {accountCreatedDate && (
                            <ProfileField label="Account Created" value={accountCreatedDate} />
                        )}
                        {user?.id && <ProfileField label="User ID" value={user.id} />}
                    </div>
                </CardContent>
            </Card>

            {/* Employee-specific details */}
            {isEmployee && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 xxs:grid-cols-2 lg:grid-cols-4 gap-y-4 text-sm">
                            <ProfileField
                                label="Employee Code"
                                value={employee?.employeeCode || "—"}
                            />
                            <ProfileField
                                label="Department"
                                value={employee?.department || "—"}
                            />
                            <ProfileField
                                label="Designation"
                                value={employee?.designation || "—"}
                            />
                            <ProfileField
                                label="Employment Type"
                                value={employee?.employmentType || "—"}
                            />
                            {employeeJoiningDate && (
                                <ProfileField
                                    label="Date of Joining"
                                    value={employeeJoiningDate}
                                />
                            )}
                            {employee?.salary?.ctc != null && (
                                <ProfileField
                                    label="CTC"
                                    value={`₹${employee.salary.ctc}`}
                                />
                            )}
                            {employee?.salary?.basic != null && (
                                <ProfileField
                                    label="Basic Salary"
                                    value={`₹${employee.salary.basic}`}
                                />
                            )}
                            {employee?.salary?.hra != null && (
                                <ProfileField
                                    label="HRA"
                                    value={`₹${employee.salary.hra}`}
                                />
                            )}
                            {employee?.salary?.allowances != null && (
                                <ProfileField
                                    label="Allowances"
                                    value={`₹${employee.salary.allowances}`}
                                />
                            )}
                            {employee?.salary?.deductions != null && (
                                <ProfileField
                                    label="Deductions"
                                    value={`₹${employee.salary.deductions}`}
                                />
                            )}

                            {/* Bank Account Details */}
                            {employee?.salary?.deductions != null && (
                                <ProfileField
                                    label="Bank Name"
                                    // value={`₹${employee?.bankAccount?.bankName}`}
                                    value={`PNB`}
                                />
                            )}
                            {employee?.salary?.deductions != null && (
                                <ProfileField
                                    label="Bank Account NO."
                                    // value={`₹${employee?.bankAccount?.bankAccount}`}
                                    value={`17000152666`}
                                />
                            )}
                            {employee?.salary?.deductions != null && (
                                <ProfileField
                                    label="IFSE Code"
                                    // value={`₹${employee?.bankAccount?.bankAccount}`}
                                    value={`PUNB12345`}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {showResetModal && (
                <ChangePassword onClose={() => setShowResetModal(false)} />
            )}

            {showProfileEditModal && (
                <ProfileEdit
                    initialName={user?.fullName}
                    initialProfileImage={user?.profileImage}
                    initialEmail={user?.email}
                    onClose={() => setShowProfileEditModal(false)}
                    onSuccess={(updatedUser) => {
                        updateUser(updatedUser);
                    }}
                />
            )}
        </div>
    );
};

const ProfileField = ({ label, value }) => (
    <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
        </div>
        <div className="text-sm text-slate-900 dark:text-slate-100 break-all">
            {value}
        </div>
    </div>
);

export default Profile;
