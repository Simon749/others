"use client";
// app/dashboard/_components/HolidayManager.jsx
// PHASE 1: MANAGE SCHOOL HOLIDAYS (ADMIN ONLY)

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function HolidayManager() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/holidays");
      setHolidays(response.data.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching holidays:", err);
      setError("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError("Please fill all required fields");
      return;
    }

    try {
      await axios.post("/api/holidays", {
        ...formData,
        userRole: "admin", // TODO: Get from session
      });

      setSuccess("Holiday added successfully! ✓");
      setFormData({ name: "", startDate: "", endDate: "", description: "" });
      setShowForm(false);
      fetchHolidays();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    try {
      await axios.delete("/api/holidays", {
        data: { id, userRole: "admin" }, // TODO: Get from session
      });

      setSuccess("Holiday deleted ✓");
      fetchHolidays();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete holiday");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📅 School Holidays
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {showForm ? "✕ Cancel" : "+ Add Holiday"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded mb-4">{success}</div>
      )}

      {showForm && (
        <form onSubmit={handleAddHoliday} className="bg-gray-50 p-4 rounded mb-4 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Holiday Name (e.g., Easter Break)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Holiday
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading holidays...</p>
      ) : holidays.length === 0 ? (
        <p className="text-gray-500">No holidays defined yet</p>
      ) : (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded"
            >
              <div>
                <h4 className="font-semibold">{holiday.name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(holiday.startDate).toLocaleDateString()} →{" "}
                  {new Date(holiday.endDate).toLocaleDateString()}
                </p>
                {holiday.description && (
                  <p className="text-sm text-gray-500">{holiday.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteHoliday(holiday.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
