/**
 * Phase 6 stub: CAST agent feed integration.
 *
 * When castFeedEnabled is true and a session type is 'claude',
 * this hook will subscribe to cast.db events and surface them
 * in the AgentFeed panel. Not wired yet — Phase 6 implementation.
 *
 * Hook point: called in App.tsx. Reads sessionTypes from store.
 * Will need: Rust cast.rs module with rusqlite reader + notify watcher.
 */
export function useCastFeed() {
  // Phase 6: implement CAST feed subscription here
  // Reads: useSessionStore(s => s.sessionTypes)
  // Reads: useSessionStore(s => s.castFeedEnabled)
  // Emits: tauri events 'cast-agent-started', 'cast-agent-done'
}
