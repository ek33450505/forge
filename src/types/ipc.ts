export interface PtyOutputPayload {
  session_id: string;
  data: string;
}

export interface SessionInfo {
  id: string;
  name: string;
  shell: string;
  created_at: number;
}
