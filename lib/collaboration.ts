import { createClient } from '@/lib/supabase/client'

export function subscribeToNote(
  noteId: string,
  onUpdate: (content: object) => void
) {
  const supabase = createClient()
  let lastUpdatedAt: string | null = null

  // Poll every 2 seconds as fallback
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('notes')
      .select('content, updated_at')
      .eq('id', noteId)
      .single()

    if (data && data.updated_at !== lastUpdatedAt) {
      if (lastUpdatedAt !== null) {
        // Only update if not the first poll
        onUpdate(data.content)
      }
      lastUpdatedAt = data.updated_at
    }
  }, 2000)

  return () => {
    clearInterval(interval)
  }
}