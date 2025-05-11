import { SupabaseReconnect } from "@/components/supabase-reconnect"

export default function ReconnectPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Reconnect to Supabase</h1>
      <SupabaseReconnect />
    </div>
  )
}
