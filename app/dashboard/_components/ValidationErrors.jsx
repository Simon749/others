"use client";
// app/dashboard/_components/ValidationErrors.jsx
// PHASE 1: DISPLAY VALIDATION ERRORS & WARNINGS

import React from "react";

export default function ValidationErrors({ errors, warnings, onDismiss }) {
  if (!errors && !warnings) return null;

  return (
    <div className="space-y-3 mb-4">
      {errors && errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
          <h4 className="font-semibold text-red-700 mb-2">❌ Validation Errors:</h4>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-600 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings && warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <h4 className="font-semibold text-yellow-700 mb-2">⚠️ Warnings:</h4>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-yellow-600 text-sm">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
