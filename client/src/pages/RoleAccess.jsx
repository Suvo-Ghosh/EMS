// src/pages/RoleAccessPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import Card, { CardContent } from "../components/ui/Card.jsx";
import { SecondaryButton, PrimaryButton } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { toast } from "sonner";
import { HiOutlineLockClosed } from "react-icons/hi2";

const PERMISSIONS = [
    { key: "dashboard.view", label: "Dashboard" },
    { key: "profile.view", label: "My Profile" },
    { key: "settings.view", label: "Settings" },
    { key: "mypayslips.view", label: "My Payslips" },
    { key: "employees.view", label: "Employees - View" },
    { key: "employees.manage", label: "Employees - Manage" },
    { key: "payroll.view", label: "Payroll - View" },
    { key: "payroll.run", label: "Payroll - Run" },
    { key: "roles.manage", label: "Role & Access page" },
];

const PERMISSION_GROUPS = [
    {
        title: "General",
        description: "Common pages every user may need.",
        keys: ["dashboard.view", "profile.view", "settings.view", "mypayslips.view"],
    },
    {
        title: "Employees",
        description: "Team & employee management.",
        keys: ["employees.view", "employees.manage"],
    },
    {
        title: "Payroll",
        description: "Salary & payroll processing.",
        keys: ["payroll.view", "payroll.run"],
    },
    {
        title: "Admin tools",
        description: "High-level system configuration.",
        keys: ["roles.manage"],
    },
];

const ROLE_OPTIONS = ["employee", "hr", "admin", "superAdmin"];

const RoleAccessPage = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]); // each user has { ... , _dirty: bool }
    const [savingId, setSavingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [selectedUserId, setSelectedUserId] = useState(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/api/access/users");
            if (data.ok) {
                const hydrated = (data.users || []).map((u) => ({
                    ...u,
                    permissions: u.permissions || [],
                    _dirty: false,
                }));
                setUsers(hydrated);

                // If nothing is selected yet, select first user
                if (!selectedUserId && hydrated.length > 0) {
                    setSelectedUserId(hydrated[0]._id);
                }
            }
        } catch (err) {
            console.error("Error loading access users:", err);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return users.filter((u) => {
            const matchesRole =
                roleFilter === "all" ? true : (u.role || "employee") === roleFilter;

            if (!term) return matchesRole;

            const name = (u.fullName || "").toLowerCase();
            const email = (u.email || "").toLowerCase();

            const matchesSearch =
                name.includes(term) || email.includes(term) || u.role?.toLowerCase().includes(term);

            return matchesRole && matchesSearch;
        });
    }, [users, searchTerm, roleFilter]);

    // Keep selectedUserId valid even after filters change
    useEffect(() => {
        if (!filteredUsers.length) {
            setSelectedUserId(null);
            return;
        }
        const stillExists = filteredUsers.some((u) => u._id === selectedUserId);
        if (!stillExists) {
            setSelectedUserId(filteredUsers[0]._id);
        }
    }, [filteredUsers, selectedUserId]);

    const selectedUser = useMemo(
        () => users.find((u) => u._id === selectedUserId) || null,
        [users, selectedUserId]
    );

    const togglePermLocal = (userId, permKey) => {
        setUsers((prev) =>
            prev.map((u) => {
                if (u._id !== userId) return u;
                const perms = new Set(u.permissions || []);
                if (perms.has(permKey)) perms.delete(permKey);
                else perms.add(permKey);
                return {
                    ...u,
                    permissions: Array.from(perms),
                    _dirty: true,
                };
            })
        );
    };

    const changeRoleLocal = (userId, newRole) => {
        setUsers((prev) =>
            prev.map((u) =>
                u._id === userId ? { ...u, role: newRole, _dirty: true } : u
            )
        );
    };

    const setGroupPermissions = (userId, keys, value) => {
        setUsers((prev) =>
            prev.map((u) => {
                if (u._id !== userId) return u;
                const perms = new Set(u.permissions || []);
                keys.forEach((k) => {
                    if (value) perms.add(k);
                    else perms.delete(k);
                });
                return {
                    ...u,
                    permissions: Array.from(perms),
                    _dirty: true,
                };
            })
        );
    };

    const saveUser = async (user) => {
        try {
            setSavingId(user._id);
            await api.patch(`/api/access/users/${user._id}`, {
                role: user.role,
                permissions: user.permissions || [],
            });
            toast.success("Access updated");

            setUsers((prev) =>
                prev.map((u) =>
                    u._id === user._id ? { ...u, _dirty: false } : u
                )
            );
        } catch (err) {
            console.error("Error saving user access:", err);
            toast.error("Failed to update access");
            loadUsers();
        } finally {
            setSavingId(null);
        }
    };

    const resetAll = () => {
        loadUsers();
    };

    const findPermissionMeta = (key) =>
        PERMISSIONS.find((p) => p.key === key) || { key, label: key };

    return (
        <div>
            <PageHeader
                title="Role & Access"
                subtitle="Manage which modules and pages each user can access."
                actions={
                    <SecondaryButton type="button" onClick={resetAll}>
                        Reset all / Reload
                    </SecondaryButton>
                }
            />

            <div className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200 border border-blue-100 dark:border-slate-700">
                <p className="font-medium mb-1">Tip</p>
                <p>
                    Use the left panel to find a user, then adjust their role and page access on the right.
                    This layout will stay clean even as your team and pages grow.
                </p>
            </div>

            {loading && (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                    Loading users…
                </p>
            )}

            {!loading && (
                <Card>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        {/* LEFT: User list + filters */}
                        <div className="md:w-64 lg:w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-4">
                            <div className="space-y-3">
                                <Input
                                    label="Search user"
                                    placeholder="Search by name, email, role…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                                        Filter by role
                                    </label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                    >
                                        <option value="all">All roles</option>
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3 h-72 md:h-[420px] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                                {filteredUsers.length === 0 && (
                                    <p className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                                        No users match this filter.
                                    </p>
                                )}

                                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {filteredUsers.map((u) => {
                                        const isSelected = u._id === selectedUserId;
                                        const isSuperAdmin = u.role === "superAdmin";
                                        return (
                                            <li
                                                key={u._id}
                                                className={`px-3 py-2 cursor-pointer text-xs hover:bg-slate-100 dark:hover:bg-slate-800/70 ${isSelected
                                                        ? "bg-slate-200/80 dark:bg-slate-800/80"
                                                        : ""
                                                    }`}
                                                onClick={() => setSelectedUserId(u._id)}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                                                            {u.fullName || "Unnamed"}
                                                        </p>
                                                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                                            {u.email}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                                                            {u.role}
                                                        </span>
                                                        {u._dirty && (
                                                            <span className="text-[10px] text-blue-600 dark:text-blue-300">
                                                                • Unsaved
                                                            </span>
                                                        )}
                                                        {isSuperAdmin && (
                                                            <HiOutlineLockClosed className="h-3 w-3 text-amber-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT: Selected user detail */}
                        <div className="flex-1 min-w-0">
                            {!selectedUser && (
                                <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                                    Select a user from the left to manage access.
                                </div>
                            )}

                            {selectedUser && (
                                <div className="space-y-4">
                                    {/* Header / basic info */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                                    {selectedUser.fullName || "Unnamed user"}
                                                </h2>
                                                {selectedUser.role === "superAdmin" && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                                        <HiOutlineLockClosed className="h-3 w-3" />
                                                        superAdmin
                                                    </span>
                                                )}
                                                {selectedUser._dirty && selectedUser.role !== "superAdmin" && (
                                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                                        Unsaved changes
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {selectedUser.email}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {selectedUser.role !== "superAdmin" && (
                                                <>
                                                    <select
                                                        value={selectedUser.role}
                                                        onChange={(e) =>
                                                            changeRoleLocal(selectedUser._id, e.target.value)
                                                        }
                                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                                    >
                                                        {ROLE_OPTIONS.map((r) => (
                                                            <option key={r} value={r}>
                                                                {r}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <SecondaryButton
                                                        type="button"
                                                        className="px-3 py-1 text-[11px]"
                                                        onClick={resetAll}
                                                        disabled={savingId === selectedUser._id}
                                                    >
                                                        Reset
                                                    </SecondaryButton>
                                                    <PrimaryButton
                                                        type="button"
                                                        className="px-3 py-1 text-[11px]"
                                                        onClick={() => saveUser(selectedUser)}
                                                        disabled={
                                                            savingId === selectedUser._id || !selectedUser._dirty
                                                        }
                                                    >
                                                        {savingId === selectedUser._id ? "Saving…" : "Save"}
                                                    </PrimaryButton>
                                                </>
                                            )}
                                            {selectedUser.role === "superAdmin" && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    superAdmin has full access and cannot be edited here.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Permissions */}
                                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                                        <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                            Page & module access
                                        </p>

                                        <div className="space-y-3">
                                            {PERMISSION_GROUPS.map((group) => {
                                                const groupPerms = group.keys.map((key) =>
                                                    findPermissionMeta(key)
                                                );
                                                const isSuperAdmin = selectedUser.role === "superAdmin";

                                                const groupAllOn = groupPerms.every((p) =>
                                                    (selectedUser.permissions || []).includes(p.key)
                                                );
                                                const groupSomeOn =
                                                    !groupAllOn &&
                                                    groupPerms.some((p) =>
                                                        (selectedUser.permissions || []).includes(p.key)
                                                    );

                                                return (
                                                    <div
                                                        key={group.title}
                                                        className="rounded-md bg-slate-50 dark:bg-slate-900/40 px-3 py-2"
                                                    >
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div>
                                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                                                    {group.title}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                    {group.description}
                                                                </p>
                                                            </div>

                                                            {!isSuperAdmin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setGroupPermissions(
                                                                            selectedUser._id,
                                                                            group.keys,
                                                                            !groupAllOn
                                                                        )
                                                                    }
                                                                    className="text-[10px] rounded-full border border-slate-300 px-2 py-0.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                                >
                                                                    {groupAllOn
                                                                        ? "Remove all"
                                                                        : groupSomeOn
                                                                            ? "Select all"
                                                                            : "Select all"}
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 mt-1">
                                                            {groupPerms.map((perm) => {
                                                                const checked = (selectedUser.permissions || []).includes(
                                                                    perm.key
                                                                );

                                                                return (
                                                                    <label
                                                                        key={perm.key}
                                                                        className="inline-flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-200"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            className="h-3 w-3 accent-blue-600"
                                                                            disabled={isSuperAdmin}
                                                                            checked={isSuperAdmin ? true : checked}
                                                                            onChange={() =>
                                                                                !isSuperAdmin &&
                                                                                togglePermLocal(selectedUser._id, perm.key)
                                                                            }
                                                                        />
                                                                        <span>{perm.label}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RoleAccessPage;
