// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnhovnbsdiufqdectyjz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuaG92bmJzZGl1ZnFkZWN0eWp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjY4MzgsImV4cCI6MjA2Nzg0MjgzOH0.XEWDAXTSyECdJLm1q6vRLsWQ4LBAzSy__MaP7_PbHfM'

export const supabase = createClient(supabaseUrl, supabaseKey)
