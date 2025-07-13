import React from "react";

/* ─── Icons ─── */
const ClockIcon = () => (
  <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2"
    viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2"
    viewBox="0 0 24 24"><path d="M4 4v6h6M20 20v-6h-6M4 20c1.5-4 5.5-7 10-7s8.5 3 10 7" /></svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" strokeWidth="2"
    viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
    viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
);

/* ─── Main Component ─── */
export default function ClientCard({ name, counts, onDelete }) {
  return (
    <div className="relative bg-white p-5 rounded-xl shadow-md border hover:shadow-lg transition flex flex-col justify-between">

      {/* 🔴 Badge for unpaid completed */}
      {counts.unpaidCompleted > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
          {counts.unpaidCompleted}
        </div>
      )}

      {/* Client name */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-800">Client: {name}</h3>
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

      {/* 🗑️ Delete button at bottom right */}
      {onDelete && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold"
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
