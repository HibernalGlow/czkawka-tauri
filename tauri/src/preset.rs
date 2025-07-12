use std::fs;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPresetOptions {
	pub file_path: String,
	pub preset_data: String,
}

#[derive(Serialize, Clone)]
struct ExportPresetResult {
	success: bool,
	error: Option<String>,
}

#[tauri::command]
pub fn export_preset(app: AppHandle, options: ExportPresetOptions) {
	let result = export_preset_impl(options);
	app.emit("export-preset-done", &result).unwrap();
}

fn export_preset_impl(options: ExportPresetOptions) -> ExportPresetResult {
	match fs::write(&options.file_path, &options.preset_data) {
		Ok(_) => ExportPresetResult {
			success: true,
			error: None,
		},
		Err(e) => ExportPresetResult {
			success: false,
			error: Some(e.to_string()),
		},
	}
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportPresetOptions {
	pub file_path: String,
}

#[derive(Serialize, Clone)]
struct ImportPresetResult {
	success: bool,
	data: Option<String>,
	error: Option<String>,
}

#[tauri::command]
pub fn import_preset(app: AppHandle, options: ImportPresetOptions) {
	let result = import_preset_impl(options);
	app.emit("import-preset-done", &result).unwrap();
}

fn import_preset_impl(options: ImportPresetOptions) -> ImportPresetResult {
	match fs::read_to_string(&options.file_path) {
		Ok(content) => ImportPresetResult {
			success: true,
			data: Some(content),
			error: None,
		},
		Err(e) => ImportPresetResult {
			success: false,
			data: None,
			error: Some(e.to_string()),
		},
	}
}
