import * as Y from 'yjs'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CollabStatus = 'connecting' | 'connected' | 'disconnected'

// --- Binary codec ---
// Yjs updates are Uint8Array; Supabase broadcast payloads are JSON.
// We convert via base64 so the binary survives JSON serialisation.

function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function fromBase64(b64: string): Uint8Array {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

// --- Sync protocol ---
//
// We follow the standard two-step Yjs sync handshake so peers exchange
// only the *diff* each side is missing, not the whole document.
//
//   sync_step1  New client sends its state vector (SV).
//   sync_step2  Peer responds with Y.encodeStateAsUpdate(doc, sv) — the
//               subset of its history the new client hasn't seen yet.
//   update      Incremental update broadcast on every local change.
//
// This mirrors y-protocols/sync and is compatible with any Yjs provider
// that follows the same convention.

export function useCollaboration(noteId: string) {
  // Lazy init — avoids calling `new Y.Doc()` on every render while still
  // giving a fresh doc on each component mount (key={note.id} in AppShell
  // remounts the Editor for each note).
  const docRef = useRef<Y.Doc | null>(null)
  if (docRef.current === null) docRef.current = new Y.Doc()

  const [status, setStatus] = useState<CollabStatus>('connecting')

  useEffect(() => {
    const doc = docRef.current!
    const supabase = createClient()

    // Track whether the channel is SUBSCRIBED so we never fire .send() early.
    let subscribed = false

    // Buffer updates that arrive before SUBSCRIBED so they aren't lost.
    const pending: Uint8Array[] = []

    const channel = supabase.channel(`note-collab:${noteId}`, {
      config: { broadcast: { self: false } },
    })

    // Safe wrapper: queues if not yet connected, sends immediately otherwise.
    function send(event: string, payload: Record<string, string>) {
      channel.send({ type: 'broadcast', event, payload })
    }

    // ── Incoming ─────────────────────────────────────────────────────────────

    // Incremental update — a peer made a change after we both had full state.
    channel.on('broadcast', { event: 'update' }, ({ payload }: { payload: { u: string } }) => {
      Y.applyUpdate(doc, fromBase64(payload.u), 'remote')
    })

    // Step 1 — a peer just joined and sent us their state vector.
    // We reply with the updates they're missing.
    channel.on('broadcast', { event: 'sync_step1' }, ({ payload }: { payload: { sv: string } }) => {
      const missingUpdate = Y.encodeStateAsUpdate(doc, fromBase64(payload.sv))
      send('sync_step2', { u: toBase64(missingUpdate) })
    })

    // Step 2 — a peer sent us the updates we were missing.
    channel.on('broadcast', { event: 'sync_step2' }, ({ payload }: { payload: { u: string } }) => {
      Y.applyUpdate(doc, fromBase64(payload.u), 'remote')
    })

    // ── Channel lifecycle ─────────────────────────────────────────────────────

    channel.subscribe((s: string) => {
      if (s === 'SUBSCRIBED') {
        subscribed = true
        setStatus('connected')

        // Initiate handshake: broadcast our state vector so peers can diff.
        send('sync_step1', { sv: toBase64(Y.encodeStateVector(doc)) })

        // Flush any local edits that piled up while we were connecting.
        for (const update of pending) {
          send('update', { u: toBase64(update) })
        }
        pending.length = 0
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        subscribed = false
        setStatus('disconnected')
      }
    })

    // ── Outgoing ─────────────────────────────────────────────────────────────

    // Every local Y.Doc change gets broadcast to peers.
    // If we're not yet connected, buffer it so nothing is lost.
    function onUpdate(update: Uint8Array, origin: unknown) {
      if (origin === 'remote') return  // don't echo back what we received

      if (!subscribed) {
        pending.push(update)
        return
      }

      send('update', { u: toBase64(update) })
    }

    doc.on('update', onUpdate)

    return () => {
      doc.off('update', onUpdate)
      channel.unsubscribe()
      setStatus('disconnected')
    }
  }, [noteId])

  return { ydoc: docRef.current, status }
}
