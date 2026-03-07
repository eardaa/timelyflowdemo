import { createClient } from '@supabase/supabase-js'

// İstemci tarafı işlemleri için anon client (güvenli erişim, genelde RLS yoksa yetersiz kalabilir ama yine de hazır bulunsun)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// RLS kapalı olduğu belirtildiği için tüm veri okuma ve yazma işlemlerinde güvenli tarafta (Server Component, Server Action, API Routes) Service Role Key kullanmalıyız.
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("Missing Service Role Key")
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
