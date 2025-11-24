import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema(
  {
    ctc: { type: Number }, // yearly CTC
    basic: { type: Number },
    hra: { type: Number },
    allowances: { type: Number },
    deductions: { type: Number } // e.g. PF, ESI etc. (detailed breakdown can be another nested schema later)
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    // Link to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    // Company-specific code (HTEMP001, etc.)
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    department: {
      type: String,
      trim: true
    },

    designation: {
      type: String,
      trim: true
    },

    dateOfJoining: {
      type: Date
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time"
    },

    salary: salaryStructureSchema,

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
