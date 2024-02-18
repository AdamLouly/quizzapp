"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

export const UserActivity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get("Your_API_Endpoint/user_activities");
        setActivities(response.data);
      } catch (error) {
        console.error("Failed to fetch user activities", error);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Recent User Activities</h3>
      <ul className="list-disc pl-5">
        {activities.map((activity, index) => (
          <li key={index}>
            {activity.user} {activity.action} on quiz "{activity.quiz}" - Score:{" "}
            {activity.score}
          </li>
        ))}
      </ul>
    </div>
  );
};
