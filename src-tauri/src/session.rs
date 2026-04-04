use parking_lot::Mutex;
use portable_pty::{Child, MasterPty};
use std::collections::HashMap;
use std::io::Write;

pub struct PtySession {
    pub writer: Box<dyn Write + Send>,
    pub master: Box<dyn MasterPty + Send>,
    /// Held for its Drop impl — killing the child process when removed from the store.
    #[allow(dead_code)]
    pub child: Box<dyn Child + Send + Sync>,
}

pub struct SessionStore {
    pub sessions: Mutex<HashMap<String, PtySession>>,
}

impl SessionStore {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}
