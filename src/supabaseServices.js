import { supabase } from './supabaseClients';
const { data: { user } } = await supabase.auth.getUser();


// ─── Helpers ──────────────────────────────────────────────────────────
export async function fetchTasks() {
  return supabase.from('tasks').select('*');
}

export async function createTask(task) {
  return supabase
    .from('tasks')
    .insert([{ ...task, status: 'pending', paid: false }])
    .select()
    .single();          // so we instantly get the new row back
}

export async function updateTask(id, patch) {
  return supabase.from('tasks').update(patch).eq('id', id);
}

export async function deleteTask(id) {
  return supabase.from('tasks').delete().eq('id', id);
}

export async function uploadImage(file) {
  const ext  = file.name.split('.').pop();
  const name = Date.now() + '.' + ext;
  const path = `uploads/${name}`;

  const { error } = await supabase.storage.from('task-images').upload(path, file);
  if (error) return { error };

  const { data } = supabase.storage.from('task-images').getPublicUrl(path);
  return { data: { url: data.publicUrl } };
}
