import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClients';

// --- Icon Components ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;

// --- Main App ---
const App = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const handleSaveTask = (taskData) => {
    if (taskToEdit) {
      setTasks(tasks.map(t => t.id === taskToEdit.id ? { ...t, ...taskData } : t));
    } else {
      setTasks([...tasks, { ...taskData, id: Date.now(), status: 'pending', paid: false }]);
    }
    closeModal();
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const updateTaskStatus = (id, newStatus) => setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  const togglePaidStatus = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, paid: !t.paid } : t));

  const openModalForNew = () => { setTaskToEdit(null); setIsModalOpen(true); };
  const openModalForEdit = (task) => { setTaskToEdit(task); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setTaskToEdit(null); };

  const pending = tasks.filter(t => t.status === 'pending');
  const ongoing = tasks.filter(t => t.status === 'ongoing');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold">Task Track MVP</h1>
          <p className="text-lg text-gray-500 mt-2">Track your work from pending to paid.</p>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TaskColumn title="Pending" color="blue" tasks={pending} onAddTask={openModalForNew} onUpdateStatus={updateTaskStatus} onDelete={deleteTask} />
          <TaskColumn title="Ongoing" color="purple" tasks={ongoing} onEditTask={openModalForEdit} onUpdateStatus={updateTaskStatus} onDelete={deleteTask} />
          <TaskColumn title="Completed" color="gray" tasks={completed} onTogglePaid={togglePaidStatus} onDelete={deleteTask} />
        </main>
      </div>
      <TaskModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveTask} task={taskToEdit} />
    </div>
  );
};

// --- Columns ---
const TaskColumn = ({ title, color, tasks, onAddTask, onEditTask, onUpdateStatus, onTogglePaid, onDelete }) => (
  <div className="bg-white rounded-xl shadow-sm p-5">
    <h2 className={`text-2xl font-semibold mb-4 text-${color}-600`}>{title}</h2>
    {onAddTask && title === 'Pending' && (
      <button onClick={onAddTask} className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200 rounded-lg p-3 mb-4 hover:bg-blue-100 transition font-semibold">
        <PlusIcon /> Add New Task
      </button>
    )}
    <div className="space-y-4">
      {tasks.length > 0 ? tasks.map(task => (
        <TaskCard key={task.id} task={task}>
          <div className="flex gap-2 mt-4 flex-wrap">
            {title === 'Pending' && (
              <>
                <ActionBtn text="Mark as Started" color="green" onClick={() => onUpdateStatus(task.id, 'ongoing')} />
                <ActionBtn text="Mark Completed" color="gray" onClick={() => onUpdateStatus(task.id, 'completed')} />
              </>
            )}
            {title === 'Ongoing' && (
              <>
                <ActionBtn text="Update" color="yellow" onClick={() => onEditTask(task)} />
                <ActionBtn text="Mark Completed" color="blue" onClick={() => onUpdateStatus(task.id, 'completed')} />
              </>
            )}
            {title === 'Completed' && (
              <button onClick={() => onTogglePaid(task.id)} className={`w-full px-3 py-2 rounded-md text-sm font-bold ${task.paid ? 'bg-teal-100 text-teal-800' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                {task.paid ? '✓ Paid' : 'Mark as Paid'}
              </button>
            )}
            <button onClick={() => onDelete(task.id)} className="p-2 rounded-md bg-red-50 hover:bg-red-100"><TrashIcon /></button>
          </div>
        </TaskCard>
      )) : <p className="text-gray-500 text-center py-4">No tasks.</p>}
    </div>
  </div>
);

const ActionBtn = ({ text, color, onClick }) => (
  <button onClick={onClick} className={`flex-1 bg-${color}-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-${color}-600`}>{text}</button>
);

const TaskCard = ({ task, children }) => (
  <div className={`p-4 rounded-lg border ${task.paid ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
    {task.imageUrl && <img src={task.imageUrl} alt="Task visual" className="w-full h-32 object-cover rounded-md mb-3" onError={(e) => { e.target.style.display = 'none' }} />}
    <p className="font-medium text-gray-800">{task.description}</p>
    {task.clientName && <p className="text-sm text-gray-600">Client: {task.clientName}</p>}
    {task.date && <p className="text-sm text-gray-500">Due: {task.date}</p>}
    {children}
  </div>
);

// --- Modal ---
const TaskModal = ({ isOpen, onClose, onSave, task }) => {
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [date, setDate] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setClientName(task.clientName || '');
      setDate(task.date || '');
    } else {
      setDescription(''); setClientName(''); setDate('');
    }
    setImageFile(null);
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Description is required.');
      return;
    }

    let imageUrl = task?.imageUrl || '';
    if (imageFile) {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error } = await supabase.storage.from('task-images').upload(filePath, imageFile);
      if (error) {
        alert('Upload failed: ' + error.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('task-images').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
      setUploading(false);
    }

    onSave({ description, clientName, imageUrl, date });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XIcon /></button>
        <h3 className="text-2xl font-semibold mb-6">{task ? 'Update Task' : 'Add New Task'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput label="Description" value={description} onChange={setDescription} required />
          <TextInput label="Client Name" value={clientName} onChange={setClientName} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full p-2 border border-gray-300 rounded-lg" />
          </div>
          <TextInput label="Due Date" type="date" value={date} onChange={setDate} />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700" disabled={uploading}>
            {uploading ? 'Uploading...' : task ? 'Save Changes' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

const TextInput = ({ label, value, onChange, type = 'text', required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
      required={required}
    />
  </div>
);

export default App;
