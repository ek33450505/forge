export interface AgentRun {
  id: number;
  session_id: number | null;
  agent: string;
  status: 'running' | 'done' | 'failed' | 'blocked' | string;
  started_at: string | null;
  ended_at: string | null;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
}

export interface CastStats {
  active_agents: number;
  tokens_today: number;
  last_event_at: string | null;
}
