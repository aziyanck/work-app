

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClients";
import Login from "./components/Login";
import Client from "./components/ClientPage"// your main UI

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  return session ? <Client session={session} /> : <Login />;
}
