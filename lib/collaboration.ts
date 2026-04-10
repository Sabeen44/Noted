import { createClient } from '@/lib/supabase/client'

export function subscribeToNote(
  noteId: string,
  onUpdate: (content: object) => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`note-${noteId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes',
        filter: `id=eq.${noteId}`,
      },
      (payload) => {
        if (payload.new.content) {
          onUpdate(payload.new.content)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}