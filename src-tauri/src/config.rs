use std::fs;

#[tauri::command]
pub fn config_read() -> Result<String, String> {
    let config_path = dirs::config_dir()
        .ok_or_else(|| "Could not resolve config directory".to_string())?
        .join("forge")
        .join("forge.json");

    if !config_path.exists() {
        return Ok("{}".to_string());
    }

    fs::read_to_string(&config_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn config_write(data: String) -> Result<(), String> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| "Could not resolve config directory".to_string())?
        .join("forge");

    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let config_path = config_dir.join("forge.json");
    fs::write(&config_path, data).map_err(|e| e.to_string())
}
