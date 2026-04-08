"use client";
// app/dashboard/_components/AuditTrail.jsx
// PHASE 1: DISPLAY ATTENDANCE CHANGE HISTORY

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AuditTrail({ attendanceId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (attendanceId) {
      fetchAuditLogs();
    }
  }, [attendanceId]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/audit?attendanceId=${attendanceId}`);
      setLogs(response.data.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to load change history");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!attendanceId) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        ⚠️ Select an attendance record to view history
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📋 Change History
        </h3>
        <button
          onClick={fetchAuditLogs}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading history...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && logs.length === 0 && (
        <p className="text-gray-500">No changes recorded yet</p>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div key={idx} className="p-3 bg-gray-50 border-l-4 border-blue-500 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">Status Change:</span>
                  <p className="text-gray-600">
                    {log.before} → {log.after}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">When:</span>
                  <p className="text-gray-600">{log.changedAt}</p>
                </div>
                <div>
                  <span className="font-semibold">Reason:</span>
                  <p className="text-gray-600 capitalize">{log.reason || "N/A"}</p>
                </div>
                <div>
                  <span className="font-semibold">User ID:</span>
                  <p className="text-gray-600">{log.changedBy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        💡 Showing {logs.length} change(s) for attendance record #{attendanceId}
      </div>
    </div>
  );
}
