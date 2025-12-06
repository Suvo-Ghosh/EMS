// server/configs/permissions.js
export const PERMISSIONS = {
    DASHBOARD_VIEW: "dashboard.view",
    PROFILE_VIEW: "profile.view",
    SETTINGS_VIEW: "settings.view",
    MYPAYSLIPS_VIEW: "mypayslips.view",

    EMPLOYEES_VIEW: "employees.view",
    EMPLOYEES_MANAGE: "employees.manage",

    PAYROLL_VIEW: "payroll.view",
    PAYROLL_RUN: "payroll.run",

    ROLE_ACCESS_MANAGE: "roles.manage",
};

export const DEFAULT_ROLE_PERMISSIONS = {
    superAdmin: ["*"], // full access

    admin: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.PROFILE_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.MYPAYSLIPS_VIEW,
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.EMPLOYEES_MANAGE,
        PERMISSIONS.PAYROLL_VIEW,
        PERMISSIONS.PAYROLL_RUN,
        PERMISSIONS.ROLE_ACCESS_MANAGE,
    ],

    hr: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.PROFILE_VIEW,
        PERMISSIONS.MYPAYSLIPS_VIEW,
        PERMISSIONS.EMPLOYEES_VIEW,
        PERMISSIONS.PAYROLL_VIEW,
    ],

    employee: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.PROFILE_VIEW,
        PERMISSIONS.MYPAYSLIPS_VIEW,
        PERMISSIONS.SETTINGS_VIEW,
    ],
};
