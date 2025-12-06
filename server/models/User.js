import mongoose from "mongoose";
import { ALL_ROLES, ROLES } from "../configs/roles.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.EMPLOYEE
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    },
    permissions: {
      type: [String],
      default: ["dashboard.view", "profile.view", "settings.view", "mypayslips.view"],
    },
    profileImage: {
      type: String,
      default: ""
    },
    profileImagePublicId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

export default User;
