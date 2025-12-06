// server/utils/permissions.js
import { DEFAULT_ROLE_PERMISSIONS } from "../configs/permissions.js";

export const getEffectivePermissions = (userDoc) => {
    if (!userDoc) return [];
    if (userDoc.role === "superAdmin") return ["*"]; // safety

    // if custom permissions set -> use them
    if (Array.isArray(userDoc.permissions) && userDoc.permissions.length > 0) {
        return userDoc.permissions;
    }

    // otherwise fallback to default for role
    return DEFAULT_ROLE_PERMISSIONS[userDoc.role] || [];
};
