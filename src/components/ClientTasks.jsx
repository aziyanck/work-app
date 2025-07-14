import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClients";

/* ─── Tiny Icons ─────────────────────────── */
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const XIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

/* ─── Main Component ─────────────────────────── */
export default function ClientTasks({ client, onBack }) {
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskEditing, setTaskEditing] = useState(null);

  // 🔁 Fetch only tasks of current user & client
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("client_id", client.id)
        .eq("user_id", user.id);

      if (!error) setTasks(data);
      else console.error("Error fetching tasks:", error);
    })();
  }, [client.id]);

  const openNew = () => { setTaskEditing(null); setModalOpen(true); };
  const openEdit = (t) => { setTaskEditing(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setTaskEditing(null); };

  const saveTask = async (taskData, statusWanted) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in to add tasks");

    try {
      if (taskEditing) {
        await supabase.from("works").update(taskData).eq("id", taskEditing.id);
        setTasks(ts => ts.map(t => t.id === taskEditing.id ? { ...t, ...taskData } : t));
      } else {
        const { data: inserted } = await supabase
          .from("works")
          .insert([{ ...taskData, client_id: client.id, status: statusWanted, paid: false, user_id: user.id }])
          .select()
          .single();

        setTasks(ts => [...ts, inserted]);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to save task.");
    }
  };

  const moveStatus = async (id, status) => {
    await supabase.from("works").update({ status }).eq("id", id);
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };

  const togglePaid = async (id) => {
    const task = tasks.find(t => t.id === id);
    await supabase.from("works").update({ paid: !task.paid }).eq("id", id);
    setTasks(ts => ts.map(t => t.id === id ? { ...t, paid: !t.paid } : t));
  };

  const delTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    try {
      if (task?.image_url) {
        const parts = new URL(task.image_url).pathname.split("/");
        const bucket = parts[5];
        const objectPath = parts.slice(6).join("/");
        await supabase.storage.from(bucket).remove([objectPath]);
      }

      await supabase.from("works").delete().eq("id", id);
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not delete task/image.");
    }
  };

  const pending = tasks.filter(t => t.status === "pending");
  const ongoing = tasks.filter(t => t.status === "ongoing");
  const completed = tasks.filter(t => t.status === "completed");

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-gray-900">
      <header className="max-w-7xl mx-auto flex items-center gap-4 mb-10">
        <button onClick={onBack} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Back</button>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">{client.name}</h1>
          <p className="text-gray-500">Task board for this client</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TaskColumn title="Pending" color="blue" tasks={pending} onAdd={openNew} onEdit={openEdit}
          extraBtns={(id) => (
            <>
              <ActionBtn text="Start" color="green" onClick={() => moveStatus(id, "ongoing")} />
              <ActionBtn text="Done" color="gray" onClick={() => moveStatus(id, "completed")} />
            </>
          )}
          onDelete={delTask} />

        <TaskColumn title="Ongoing" color="purple" tasks={ongoing} onEdit={openEdit}
          extraBtns={(id) => (<ActionBtn text="Done" color="blue" onClick={() => moveStatus(id, "completed")} />)}
          onDelete={delTask} />

        <TaskColumn title="Completed" color="gray" tasks={completed} onEdit={openEdit}
          extraBtns={(id) => (<TogglePaidBtn task={tasks.find(t => t.id === id)} onClick={() => togglePaid(id)} />)}
          onDelete={delTask} />
      </div>

      {modalOpen && (
        <TaskModal close={closeModal} save={(data, status) => saveTask(data, status)} task={taskEditing} />
      )}
    </div>
  );
}
