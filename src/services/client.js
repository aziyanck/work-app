// src/services/clients.js
import { supabase } from "../supabaseClients";

// Existing ones...
export async function findClientByName(name) {
  /* ... */
}

const { data: { user } } = await supabase.auth.getUser();

// services/client.js
export async function createClient(name) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("clients")
    .insert([{ name, user_id: user.id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}


/**
 * Fetches all clients from the `clients` table.
 */
export async function getAllClients() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id);
  if (error) throw error;
  return data;
}


/**
 * Returns an object with count of works grouped by status
 * for a given client ID.
 * Example: { pending: 3, ongoing: 2, completed: 1 }
 */

export async function getWorkCountsByClient(client_id) {
  const { data, error } = await supabase
    .from("works")
    .select("status, paid")
    .eq("client_id", client_id);

  if (error) throw error;

  const counts = { pending: 0, ongoing: 0, completed: 0, unpaidCompleted: 0 };

  data.forEach((task) => {
    if (task.status === "pending") counts.pending++;
    else if (task.status === "ongoing") counts.ongoing++;
    else if (task.status === "completed") {
      counts.completed++;
      if (!task.paid) counts.unpaidCompleted++;
    }
  });

  return counts;
}

export async function deleteClientById(id) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
