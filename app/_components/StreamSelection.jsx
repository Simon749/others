"use client"
import React, { useEffect, useState } from "react";
import GlobalApi from "@/app/_services/GlobalApi";

function StreamSelection({ selectedGrade, selectedStream, onStreamChange }) {
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedGrade) {
            GetStreamsList();
        } else {
            setStreams([]);
        }
    }, [selectedGrade]);

    const GetStreamsList = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/streams?gradeId=${selectedGrade}`);
            const data = await response.json();
            
            if (data.results) {
                setStreams(data.results);
            }
        } catch (error) {
            console.error("Error fetching streams:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedGrade) {
        return null;
    }

    return (
        <div>
            <select
                value={selectedStream ?? ""}
                onChange={(e) => onStreamChange(e.target.value)}
                className="border rounded-lg p-2"
                disabled={loading || streams.length === 0}
            >
                <option value="">Select Stream</option>
                {streams.map((item, index) => (
                    <option key={item.id || index} value={item.id}>
                        {item.description || `Stream ${item.streamName}`}
                    </option>
                ))}
            </select>
            {loading && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
        </div>
    );
}

export default StreamSelection;
