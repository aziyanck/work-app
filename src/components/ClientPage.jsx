

import React, { useEffect, useState } from "react";
import {
    getAllClients,
    getWorkCountsByClient,
    findClientByName,
    createClient,
} from "../services/client";
import ClientCard from "./ClientCard";
import ClientTasks from "./ClientTasks";

/* tiny SVG icons reused in this file only */
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ─── Main component ─────────────────────────────────────── */
export default function Client() {
    /* UI state */
    const [search, setSearch] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);   // null = dashboard

    /* data */
    const [clients, setClients] = useState([]);
    const [clientStats, setStats] = useState({});  // { clientId: {pending,ongoing,completed} }

    /* modal */
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    /* ─ Fetch all clients + per‑client work counts on mount ─ */
    useEffect(() => {
        (async () => {
            try {
                const list = await getAllClients();
                setClients(list);

                /* fetch counts in parallel */
                const stats = {};
                await Promise.all(
                    list.map(async (c) => {
                        stats[c.id] = await getWorkCountsByClient(c.id);
                    })
                );
                setStats(stats);
            } catch (err) {
                console.error("Load error:", err);
                alert("Could not load clients – see console.");
            }
        })();
    }, []);

    /* ─ Add‑client modal save ─ */
    async function handleSaveClient() {
        if (!newName.trim()) return alert("Enter a name");
        try {
            setSaving(true);
            const existing = await findClientByName(newName.trim());
            if (existing) {
                alert(`Client “${newName}” already exists.`);
                return;
            }
            const row = await createClient(newName.trim());
            /* append to dashboard */
            setClients((c) => [row, ...c]);
            setStats((s) => ({ ...s, [row.id]: { pending: 0, ongoing: 0, completed: 0 } }));
            setShowModal(false);
            setNewName("");
        } catch (err) {
            console.error(err);
            alert("DB error – see console.");
        } finally {
            setSaving(false);
        }
    }

    /* ─────────────────────── render ────────────────────────── */
    if (selectedClient) {
        /* detail view (task board) */
        return (
            <ClientTasks
                client={selectedClient}
                onBack={() => setSelectedClient(null)}
            />
        );
    }

    /* dashboard view */
    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* header */}
                <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
                    Client Dashboard
                </h1>

                {/* search + add row */}
                <div className="flex items-center gap-3 mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search clients..."
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg shadow"
                        aria-label="Add client"
                    >
                        <PlusIcon />
                    </button>
                </div>

                {/* grid of client cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {clients
                        .filter((c) =>
                            c.name.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((c) => (
                            <div
                                key={c.id}
                                className="cursor-pointer"
                                onClick={() => setSelectedClient(c)}
                            >
                                <ClientCard
                                    name={c.name}
                                    counts={
                                        clientStats[c.id] || {
                                            pending: 0,
                                            ongoing: 0,
                                            completed: 0,
                                        }
                                    }
                                />
                            </div>
                        ))}
                    {clients.length === 0 && (
                        <p className="text-gray-500 text-center col-span-full">
                            No clients yet.
                        </p>
                    )}
                </div>
            </div>

            {/* ───── Add‑client modal ───── */}
            {showModal && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <XIcon />
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Add Client</h2>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Client name"
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSaveClient}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
