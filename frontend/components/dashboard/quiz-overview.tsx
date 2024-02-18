"use client"
import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export const QuizOverview = () => {
  const [quizStats, setQuizStats] = useState([]);

  useEffect(() => {
    const fetchQuizStats = async () => {
      try {
        const response = await axios.get("Your_API_Endpoint/quiz_stats");
        setQuizStats(response.data);
      } catch (error) {
        console.error("Failed to fetch quiz statistics", error);
      }
    };
    fetchQuizStats();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div>
      <h3 className="text-lg font-medium">Quiz Category Overview</h3>
      <PieChart width={400} height={400}>
        <Pie
          data={quizStats}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {quizStats.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
};
