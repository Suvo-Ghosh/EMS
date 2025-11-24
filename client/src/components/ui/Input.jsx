import React from "react";

// Reusable Input component
export const Input = ({ label, name, value, onChange, type = "text", required = false, readOnly = false }) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="text-xs md:text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            {label}
        </label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            readOnly = {readOnly}
            className="block w-full p-2 md:p-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        />
    </div>
);

// Reusable Textarea component
export const Textarea = ({ label, name, value, onChange, required = false }) => (
    <div className="flex flex-col">
        <label htmlFor={name} className="text-sm font-medium mb-2">
            {label}
        </label>
        <textarea
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            rows={4}
            className="block w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        />
    </div>
);
