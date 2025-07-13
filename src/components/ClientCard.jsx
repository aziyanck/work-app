// src/components/ClientCard.jsx
import React from "react";

/* Icons */
const ClockIcon = () => (
  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M9 20a9 9 0 0110-9M15 4a9 9 0 00-10 9"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" strokeWidth="2"
       viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);

export default function ClientCard({ name, counts }) {
  return (
    <div className="relative bg-white p-5 rounded-xl shadow-md border hover:shadow-lg transition group">

      {/* 🔴 red badge for unpaid completed */}
      {counts.unpaidCompleted > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
          {counts.unpaidCompleted}
        </div>
      )}

      <h3 className="text-lg font-bold mb-4 text-gray-800">{name}</h3>

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center">
          <ClockIcon />
          <span>Pending: {counts.pending}</span>
        </div>
        <div className="flex items-center">
          <RefreshIcon />
          <span>Ongoing: {counts.ongoing}</span>
        </div>
        <div className="flex items-center">
          <CheckIcon />
          <span>Completed: {counts.completed}</span>
        </div>
      </div>
    </div>
  );
}
