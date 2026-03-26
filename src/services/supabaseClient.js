import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ejpjdinrwxodpizgybui.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqcGpkaW5yd3hvZHBpemd5YnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjE4NDIsImV4cCI6MjA4ODYzNzg0Mn0.kEO68nOssVBc5eFcBhSUhJ9I3cGkYevDyPqFLj81kOE'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
