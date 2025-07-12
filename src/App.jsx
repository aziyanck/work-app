import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClients';

/* ─── Tiny SVG Icons ─────────────────────────────────────────── */
const PlusIcon  = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const XIcon     = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

/* ─── Main App ───────────────────────────────────────────────── */
export default function App() {
  const [tasks, setTasks]             = useState([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [taskEditing, setTaskEditing] = useState(null);

  /* initial fetch */
  useEffect(() => { (async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) setTasks(data);
  })(); }, []);

  /* helpers */
  const openNew        = ()      => { setTaskEditing(null);  setModalOpen(true); };
  const openEdit       = (t)     => { setTaskEditing(t);     setModalOpen(true); };
  const closeModal     = ()      => { setModalOpen(false);   setTaskEditing(null); };

  /* CRUD — add / update receive status arg */
  const saveTask = async (taskData, statusWanted) => {
    try {
      if (taskEditing) {
        await supabase.from('tasks').update(taskData).eq('id', taskEditing.id);
        setTasks(ts => ts.map(t => (t.id === taskEditing.id ? { ...t, ...taskData } : t)));
      } else {
        const { data: inserted } = await supabase
          .from('tasks')
          .insert([{ ...taskData, status: statusWanted, paid: false }])
          .select().single();
        setTasks(ts => [...ts, inserted]);
      }
      closeModal();
    } catch (err) { alert('DB error: '+err.message); }
  };

  const moveStatus = async (id, status) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
    setTasks(ts => ts.map(t => (t.id === id ? { ...t, status } : t)));
  };

  const togglePaid  = async (id) => {
    const t = tasks.find(x => x.id===id);
    await supabase.from('tasks').update({ paid: !t.paid }).eq('id', id);
    setTasks(ts => ts.map(x => (x.id===id ? {...x, paid:!x.paid}:x)));
  };

  const delTask     = async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  const pending   = tasks.filter(t=>t.status==='pending');
  const ongoing   = tasks.filter(t=>t.status==='ongoing');
  const completed = tasks.filter(t=>t.status==='completed');

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-gray-900">
      <header className="max-w-7xl mx-auto text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold">Task Track MVP</h1>
        <p className="text-lg text-gray-500 mt-2">Track your work from pending to paid.</p>
      </header>

      {/* columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TaskColumn title="Pending"   color="blue"   tasks={pending}
                    onAdd={openNew} onEdit={openEdit}
                    extraBtns={(id)=>(
                      <>
                        <ActionBtn text="Start"  color="green" onClick={()=>moveStatus(id,'ongoing')}/>
                        <ActionBtn text="Done"   color="gray"  onClick={()=>moveStatus(id,'completed')}/>
                      </>
                    )}
                    onDelete={delTask}/>

        <TaskColumn title="Ongoing"   color="purple" tasks={ongoing}
                    onEdit={openEdit}
                    extraBtns={(id)=>(<ActionBtn text="Done" color="blue" onClick={()=>moveStatus(id,'completed')}/> )}
                    onDelete={delTask}/>

        <TaskColumn title="Completed" color="gray"   tasks={completed}
                    onEdit={openEdit}
                    extraBtns={(id)=>(<TogglePaidBtn task={tasks.find(t=>t.id===id)} onClick={()=>togglePaid(id)}/>)}
                    onDelete={delTask}/>
      </div>

      {modalOpen && (
        <TaskModal close={closeModal}
                   save={(data, status)=>saveTask(data,status)}
                   task={taskEditing}/>
      )}
    </div>
  );
}

/* ─── Columns / Cards ────────────────────────────────────────── */
const TaskColumn = ({ title, color, tasks, onAdd, onEdit, extraBtns, onDelete }) => (
  <div className="bg-white shadow-sm rounded-xl p-5">
    <h2 className={`text-2xl font-semibold mb-4 text-${color}-600`}>
  {title} ({tasks.length})
</h2>


    {onAdd && title==='Pending' && (
      <button onClick={onAdd}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200 rounded-lg p-3 mb-4 hover:bg-blue-100 transition font-semibold">
        <PlusIcon/> Add Task
      </button>)}

    <div className="space-y-4">
      {tasks.length
        ? tasks.map(t => (
            <TaskCard key={t.id} task={t}>
              <div className="flex gap-2 flex-wrap mt-4">
                {onEdit && <ActionBtn text="Edit" color="yellow" onClick={()=>onEdit(t)}/>}
                {extraBtns && extraBtns(t.id)}
                <button onClick={()=>onDelete(t.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-md"><TrashIcon/></button>
              </div>
            </TaskCard>))
        : <p className="text-gray-500 text-center py-4">No tasks.</p>}
    </div>
  </div>
);

const TaskCard = ({ task, children }) => (
  <div className={`p-4 rounded-lg border ${task.paid?'bg-teal-50 border-teal-200':'bg-gray-50 border-gray-200'}`}>
    {task.image_url && <img src={task.image_url} alt=""
      className="w-full h-32 object-cover rounded-md mb-3"
      onError={(e)=>{e.target.style.display='none';}}/>}
    <p className="font-medium">{task.description}</p>
    {task.client_name && <p className="text-sm text-gray-600">Client: {task.client_name}</p>}
    {task.due_date     && <p className="text-sm text-gray-500">Due: {task.due_date}</p>}
    {children}
  </div>
);

const ActionBtn = ({text,color,onClick}) => (
  <button onClick={onClick}
          className={`flex-1 bg-${color}-500 hover:bg-${color}-600 text-white text-sm font-semibold px-3 py-1.5 rounded-md`}>
    {text}
  </button>
);

const TogglePaidBtn = ({task,onClick}) => (
  <button onClick={onClick}
          className={`w-full px-3 py-2 rounded-md text-sm font-bold ${task.paid?'bg-teal-100 text-teal-800':'bg-red-500 text-white hover:bg-red-600'}`}>
    {task.paid ? '✓ Paid' : 'Mark Paid'}
  </button>
);

/* ─── Modal ─────────────────────────────────────────────────── */
const TaskModal = ({ task, close, save }) => {
  const [description,setDescription] = useState('');
  const [clientName, setClientName]  = useState('');
  const [imageFile,  setImageFile]   = useState(null);
  const [dueDate,    setDueDate]     = useState('');
  const [uploading,  setUploading]   = useState(false);

  useEffect(()=>{ if(task){
      setDescription(task.description||'');
      setClientName (task.client_name||'');
      setDueDate    (task.due_date   ||'');
  }},[task]);

  const uploadIfNeeded = async () => {
    if (!imageFile) return task?.image_url || '';
    setUploading(true);
    try {
      const ext=imageFile.name.split('.').pop();
      const path=`uploads/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('task-images').upload(path,imageFile);
      if (error) throw error;
      const { data } = supabase.storage.from('task-images').getPublicUrl(path);
      return data.publicUrl;
    } finally { setUploading(false); }
  };

  const handleSubmit = async (statusWanted) => {
    if(!description.trim()) return alert('Description required');
    const url = await uploadIfNeeded();
    save({description,client_name:clientName,image_url:url,due_date:dueDate||null}, statusWanted);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XIcon/></button>
        <h3 className="text-2xl font-semibold mb-6">{task?'Update Task':'New Task'}</h3>

        <div className="space-y-4">
          <TextInput label="Description" value={description} onChange={setDescription} required/>
          <TextInput label="Client Name" value={clientName} onChange={setClientName}/>
          <div>
            <label className="block text-sm font-medium mb-1">Upload File</label>
            <input type="file" onChange={e=>setImageFile(e.target.files[0])}
                   className="w-full p-2 border rounded-lg"/>
          </div>
          <TextInput label="Due Date" type="date" value={dueDate} onChange={setDueDate}/>
          
          {/* submit row */}
          <div className="flex gap-3">
            <button onClick={()=>handleSubmit(task?.status||'pending')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
                    disabled={uploading}>{uploading?'Uploading…': task?'Save':'Add as Pending'}</button>

            {!task && (
              <button onClick={()=>handleSubmit('completed')}
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

/* small text input helper */
const TextInput = ({label,value,onChange,type='text',required})=>(
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
           required={required}/>
  </div>
);
