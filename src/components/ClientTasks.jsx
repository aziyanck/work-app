import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClients";

/* ─── Tiny SVG Icons ─────────────────────────────────────────── */
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const XIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

/* ─── Client‑scoped Task Board ──────────────────────────────── */
export default function ClientTasks({ client, onBack }) {
    const [tasks, setTasks] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [taskEditing, setTaskEditing] = useState(null);

    /* initial fetch – only tasks for this client */
    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from("works")
                .select("*")
                .eq("client_id", client.id);
            if (!error) setTasks(data);
        })();
    }, [client.id]);

    /* helpers */
    const openNew = () => { setTaskEditing(null); setModalOpen(true); };
    const openEdit = (t) => { setTaskEditing(t); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setTaskEditing(null); };

    /* CRUD — add / update receive status arg */
    const saveTask = async (taskData, statusWanted) => {
        try {
            if (taskEditing) {
                await supabase
                    .from("works")
                    .update(taskData)
                    .eq("id", taskEditing.id);
                setTasks(ts => ts.map(t => (t.id === taskEditing.id ? { ...t, ...taskData } : t)));
            } else {
                const { data: inserted } = await supabase
                    .from("works")
                    .insert([{ ...taskData, client_id: client.id, status: statusWanted, paid: false }])
                    .select()
                    .single();
                setTasks(ts => [...ts, inserted]);
            }
            closeModal();
        } catch (err) { alert("DB error: " + err.message); }
    };

    const moveStatus = async (id, status) => {
        await supabase.from("works").update({ status }).eq("id", id);
        setTasks(ts => ts.map(t => (t.id === id ? { ...t, status } : t)));
    };

    const togglePaid = async (id) => {
        const t = tasks.find(x => x.id === id);
        await supabase.from("works").update({ paid: !t.paid }).eq("id", id);
        setTasks(ts => ts.map(x => (x.id === id ? { ...x, paid: !x.paid } : x)));
    };

    /* ─── delete a task AND its image ─────────────────────────── */
    const delTask = async (id) => {
        try {
            /* find the task we’re deleting */
            const t = tasks.find((x) => x.id === id);

            /* 1️⃣  remove the image from storage (if any) */
            if (t?.image_url) {
                // Example: https://<proj>.supabase.co/storage/v1/object/public/task-images/uploads/123.jpg
                const urlParts = new URL(t.image_url).pathname.split("/"); // ['', 'storage', 'v1', 'object', 'public', 'task-images', 'uploads', '123.jpg']
                const bucket = urlParts[5];                               // 'task-images'
                const objectPath = urlParts.slice(6).join("/");               // 'uploads/123.jpg'
                await supabase.storage.from(bucket).remove([objectPath]);
            }

            /* 2️⃣  delete the row from `works` table */
            await supabase.from("works").delete().eq("id", id);

            /* 3️⃣  update local state */
            setTasks((ts) => ts.filter((t) => t.id !== id));
        } catch (err) {
            console.error("Delete error:", err);
            alert("Could not delete task/image – see console.");
        }
    };


    const pending = tasks.filter(t => t.status === "pending");
    const ongoing = tasks.filter(t => t.status === "ongoing");
    const completed = tasks.filter(t => t.status === "completed");

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-gray-900">
            <header className="max-w-7xl mx-auto flex items-center gap-4 mb-10">
                <button onClick={onBack}
                    className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                    ← Back
                </button>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold">
                        {client.name}
                    </h1>
                    <p className="text-gray-500">Task board for this client</p>
                </div>
            </header>

            {/* columns */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <TaskColumn title="Pending" color="blue" tasks={pending}
                    onAdd={openNew} onEdit={openEdit}
                    extraBtns={(id) => (
                        <>
                            <ActionBtn text="Start" color="green" onClick={() => moveStatus(id, "ongoing")} />
                            <ActionBtn text="Done" color="gray" onClick={() => moveStatus(id, "completed")} />
                        </>
                    )}
                    onDelete={delTask} />

                <TaskColumn title="Ongoing" color="purple" tasks={ongoing}
                    onEdit={openEdit}
                    extraBtns={(id) => (<ActionBtn text="Done" color="blue" onClick={() => moveStatus(id, "completed")} />)}
                    onDelete={delTask} />

                <TaskColumn title="Completed" color="gray" tasks={completed}
                    onEdit={openEdit}
                    extraBtns={(id) => (<TogglePaidBtn task={tasks.find(t => t.id === id)} onClick={() => togglePaid(id)} />)}
                    onDelete={delTask} />
            </div>

            {modalOpen && (
                <TaskModal close={closeModal}
                    save={(data, status) => saveTask(data, status)}
                    task={taskEditing} />
            )}
        </div>
    );
}

/* ─── Re‑use your original column / card / modal helpers ───── */
const TaskColumn = ({ title, color, tasks, onAdd, onEdit, extraBtns, onDelete }) => (
    <div className="bg-white shadow-sm rounded-xl p-5">
        <h2 className={`text-2xl font-semibold mb-4 text-${color}-600`}>
            {title} ({tasks.length})
        </h2>

        {onAdd && title === "Pending" && (
            <button onClick={onAdd}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200 rounded-lg p-3 mb-4 hover:bg-blue-100 transition font-semibold">
                <PlusIcon /> Add Task
            </button>)}

        <div className="space-y-4">
            {tasks.length
                ? tasks.map(t => (
                    <TaskCard key={t.id} task={t}>
                        <div className="flex gap-2 flex-wrap mt-4">
                            {onEdit && <ActionBtn text="Edit" color="yellow" onClick={() => onEdit(t)} />}
                            {extraBtns && extraBtns(t.id)}
                            <button onClick={() => onDelete(t.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 rounded-md"><TrashIcon /></button>
                        </div>
                    </TaskCard>))
                : <p className="text-gray-500 text-center py-4">No tasks.</p>}
        </div>
    </div>
);

const TaskCard = ({ task, children }) => (
    <div className={`p-4 rounded-lg border ${task.paid ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"}`}>
        {task.image_url && <img src={task.image_url} alt=""
            className="w-full h-32 object-cover rounded-md mb-3"
            onError={(e) => { e.target.style.display = "none"; }} />}
        <p className="font-medium">{task.description}</p>
        {task.due_date && <p className="text-sm text-gray-500">Due: {task.due_date}</p>}
        {children}
    </div>
);

const ActionBtn = ({ text, color, onClick }) => (
    <button onClick={onClick}
        className={`flex-1 bg-${color}-500 hover:bg-${color}-600 text-gray-600 text-sm font-semibold px-3 py-1.5 rounded-md`}>
        {text}
    </button>
);

const TogglePaidBtn = ({ task, onClick }) => (
    <button onClick={onClick}
        className={`w-full px-3 py-2 rounded-md text-sm font-bold ${task.paid ? "bg-teal-100 text-teal-800" : "bg-red-500 text-white hover:bg-red-600"}`}>
        {task.paid ? "✓ Paid" : "Mark Paid"}
    </button>
);

/* ─── Modal (unchanged from your template) ──────────────────── */
const TaskModal = ({ task, close, save }) => {
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [dueDate, setDueDate] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (task) {
            setDescription(task.description || "");
            setDueDate(task.due_date || "");
        }
    }, [task]);

    const uploadIfNeeded = async () => {
        if (!imageFile) return task?.image_url || "";
        setUploading(true);
        try {
            const ext = imageFile.name.split(".").pop();
            const path = `uploads/${Date.now()}.${ext}`;
            const { error } = await supabase.storage
                .from("task-images")
                .upload(path, imageFile);
            if (error) throw error;
            const { data } = supabase.storage
                .from("task-images")
                .getPublicUrl(path);
            return data.publicUrl;
        } finally { setUploading(false); }
    };

    const handleSubmit = async (statusWanted) => {
        if (!description.trim()) return alert("Description required");
        const url = await uploadIfNeeded();
        save({ description, image_url: url, due_date: dueDate || null }, statusWanted);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
                <button onClick={close}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XIcon /></button>
                <h3 className="text-2xl font-semibold mb-6">{task ? "Update Task" : "New Task"}</h3>

                <div className="space-y-4">
                    <TextInput label="Description" value={description} onChange={setDescription} required />
                    <div>
                        <label className="block text-sm font-medium mb-1">Upload File</label>
                        <input type="file" onChange={e => setImageFile(e.target.files[0])}
                            className="w-full p-2 border rounded-lg" />
                    </div>
                    <TextInput label="Due Date" type="date" value={dueDate} onChange={setDueDate} />

                    <div className="flex gap-3">
                        <button onClick={() => handleSubmit(task?.status || "pending")}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                            disabled={uploading}>{uploading ? "Uploading…" : task ? "Save" : "Add as Pending"}</button>
                        {!task && (
                            <button onClick={() => handleSubmit("completed")}
                                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold">
                                Add as Completed
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TextInput = ({ label, value, onChange, type = "text", required }) => (
    <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            required={required} />
    </div>
);
