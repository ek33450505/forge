use rusqlite::{Connection, OpenFlags};
use serde::Serialize;
use std::path::PathBuf;

fn cast_db_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".claude").join("cast.db"))
}

fn open_readonly() -> Result<Connection, String> {
    let path = cast_db_path().ok_or("Cannot resolve home dir")?;
    Connection::open_with_flags(&path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|e| e.to_string())
}

#[derive(Serialize)]
pub struct AgentRun {
    pub id: i64,
    pub session_id: Option<i64>,
    pub agent: String,
    pub status: String,
    pub started_at: Option<String>,
    pub ended_at: Option<String>,
    pub model: Option<String>,
    pub tokens_in: Option<i64>,
    pub tokens_out: Option<i64>,
}

#[derive(Serialize)]
pub struct CastStats {
    pub active_agents: i64,
    pub tokens_today: i64,
    pub last_event_at: Option<String>,
}

#[tauri::command]
pub fn cast_detect() -> bool {
    cast_db_path()
        .map(|p| p.exists())
        .unwrap_or(false)
}

#[tauri::command]
pub fn cast_query_recent_runs(limit: u32) -> Result<Vec<AgentRun>, String> {
    let conn = open_readonly()?;
    let limit = limit.min(200) as i64;
    let mut stmt = conn
        .prepare(
            "SELECT id, session_id, agent, status, started_at, ended_at, model, tokens_in, tokens_out
             FROM agent_runs
             ORDER BY started_at DESC
             LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let runs = stmt
        .query_map([limit], |row| {
            Ok(AgentRun {
                id: row.get(0)?,
                session_id: row.get(1)?,
                agent: row.get(2).unwrap_or_default(),
                status: row.get(3).unwrap_or_default(),
                started_at: row.get(4)?,
                ended_at: row.get(5)?,
                model: row.get(6)?,
                tokens_in: row.get(7)?,
                tokens_out: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(runs)
}

#[tauri::command]
pub fn cast_query_stats() -> Result<CastStats, String> {
    let conn = open_readonly()?;

    let active_agents: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM agent_runs WHERE status = 'running'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let tokens_today: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(tokens_in + tokens_out), 0) FROM agent_runs
             WHERE DATE(started_at) = DATE('now', 'localtime')",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let last_event_at: Option<String> = conn
        .query_row(
            "SELECT MAX(started_at) FROM agent_runs",
            [],
            |row| row.get(0),
        )
        .ok()
        .flatten();

    Ok(CastStats { active_agents, tokens_today, last_event_at })
}
