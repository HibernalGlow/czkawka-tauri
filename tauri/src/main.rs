#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod bad_extensions;
mod big_files;
mod broken_files;
mod delete_files;
mod duplicate_files;
mod empty_files;
mod empty_folders;
mod image;
mod invalid_symlinks;
mod move_files;
mod music_duplicates;
mod progress;
mod rename_ext;
mod save_result;
mod scaner;
mod settings;
mod similar_images;
mod similar_videos;
mod state;
mod temporary_files;
mod thumbnail;
mod utils;

use std::sync::Mutex;

use czkawka_core::common::{
	get_number_of_threads, set_number_of_threads,
};
use czkawka_core::common::config_cache_path::set_config_cache_path;
use tauri::{AppHandle, Emitter, Manager, State};
use std::{fs::File, io::{Seek, SeekFrom}};
use std::thread;
use std::net::{TcpListener, TcpStream};
use std::io::{Write};
use std::sync::OnceLock;
use mime_guess::from_path;

use crate::{
	image::{ImageInfo, init_thumbnail_manager},
	progress::process_progress_data,
	settings::{PlatformSettings, Settings},
	state::AppState,
	thumbnail::ThumbnailInfo,
};

static VIDEO_SERVER_PORT: OnceLock<u16> = OnceLock::new();

fn start_video_http_server() -> u16 {
	// 绑定 127.0.0.1:0 让系统分配端口
	let listener = TcpListener::bind("127.0.0.1:0").expect("bind video server");
	let port = listener.local_addr().unwrap().port();
	thread::spawn(move || {
		for stream in listener.incoming() {
			if let Ok(stream) = stream { handle_video_conn(stream); }
		}
	});
	port
}

#[tauri::command]
fn get_video_server_port() -> u16 {
	*VIDEO_SERVER_PORT.get_or_init(|| start_video_http_server())
}

fn handle_video_conn(mut stream: TcpStream) {
	use std::io::Read as _;
	let mut buf = Vec::new();
	let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(5)));
	let mut header_buf = [0u8; 4096];
	let Ok(n) = stream.read(&mut header_buf) else { return; };
	let req = String::from_utf8_lossy(&header_buf[..n]);
	// 只解析首行与 Range/path
	let mut lines = req.split("\r\n");
	let first = lines.next().unwrap_or("");
	let mut path = "";
	if let Some(p) = first.split_whitespace().nth(1) { path = p; }
	if !path.starts_with("/video") { return; }
	let mut file_param = "";
	if let Some(idx) = path.find("?path=") { file_param = &path[idx+6..]; }
	let decoded = percent_encoding::percent_decode_str(file_param).decode_utf8_lossy();
	let full_path = decoded.to_string();
	let mut range: Option<(u64,u64)> = None;
	for l in lines.clone() { if l.starts_with("Range:") { if let Some(r) = l.split(':').nth(1) { let r = r.trim(); if let Some(rs) = r.strip_prefix("bytes=") { let mut parts = rs.split('-'); let s = parts.next().unwrap_or("").parse().unwrap_or(0); let e = parts.next().unwrap_or("").parse().unwrap_or(0); if e>0 { range=Some((s,e)); } } } } }
	let Ok(mut file) = File::open(&full_path) else { let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length:0\r\n\r\n"); return; };
	let Ok(meta) = file.metadata() else { let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length:0\r\n\r\n"); return; };
	let total = meta.len();
	let (start,end,status) = match range { Some((s,e)) if e> s && e< total => (s,e,206), _ => (0,total-1,200)};
	let to_read = end-start+1;
	if file.seek(SeekFrom::Start(start)).is_err() { let _ = stream.write_all(b"HTTP/1.1 416 Range Not Satisfiable\r\nContent-Length:0\r\n\r\n"); return; }
	buf.resize(to_read as usize,0); if file.read_exact(&mut buf).is_err() { let _ = stream.write_all(b"HTTP/1.1 500 Internal Server Error\r\nContent-Length:0\r\n\r\n"); return; }
	let mime = from_path(&full_path).first_or_octet_stream();
	let mut headers = format!("HTTP/1.1 {} {}\r\nContent-Type: {}\r\nAccept-Ranges: bytes\r\nContent-Length: {}\r\n", status, if status==206 {"Partial Content"} else {"OK"}, mime, buf.len());
	if status==206 { headers.push_str(&format!("Content-Range: bytes {}-{}/{}\r\n", start,end,total)); }
	headers.push_str("Connection: close\r\n\r\n");
	let _ = stream.write_all(headers.as_bytes());
	let _ = stream.write_all(&buf);
}

fn main() {

	tauri::Builder::default()
		.setup(move |app| {
			// 初始化 czkawka_core 的配置/缓存目录，避免首次访问时 panic
			// 传入应用在系统目录下的缓存/配置名，供 czkawka_core 计算路径
			let _ = set_config_cache_path("czkawka", "czkawka");
			// 启动本地视频 HTTP server (只启动一次)
			VIDEO_SERVER_PORT.get_or_init(|| start_video_http_server());
			#[cfg(feature = "ffmpeg")]
			if let Ok(resource_dir) = app.path().resource_dir() {
				utils::set_ffmpeg_path(resource_dir);
			}
			
			// 初始化缩略图管理器
			if let Ok(cache_dir) = app.path().app_cache_dir() {
				let thumbnail_cache_dir = cache_dir.join("thumbnails");
				if let Err(e) = init_thumbnail_manager(thumbnail_cache_dir, 256) {
					eprintln!("Failed to initialize thumbnail manager: {}", e);
				}
			}
			
			app.manage(Mutex::new(AppState::default()));
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			get_video_server_port,
			get_platform_settings,
			setup_number_of_threads,
			stop_scan,
			listen_scan_progress,
			read_image,
			read_thumbnail,
			batch_generate_thumbnails,
			has_thumbnail,
			clear_thumbnail_cache,
			get_thumbnail_cache_stats,
			scan_duplicate_files,
			scan_empty_folders,
			scan_big_files,
			scan_empty_files,
			scan_temporary_files,
			scan_similar_images,
			scan_similar_videos,
			scan_music_duplicates,
			scan_invalid_symlinks,
			scan_broken_files,
			scan_bad_extensions,
			move_files,
			delete_files,
			save_result,
			rename_ext,
			open_system_path,
			copy_file_to_clipboard,
		])
		.plugin(tauri_plugin_opener::init())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_clipboard_manager::init())
		.plugin(tauri_plugin_single_instance::init(|app, _, _| {
			if let Some(ww) = app.get_webview_window("main") {
				if ww.is_minimized().is_ok_and(|v| v) {
					let _ = ww.unminimize();
				}
				let _ = ww.set_focus();
			}
		}))
		.run(tauri::generate_context!())
		.expect("Failed to launch app");
}

#[tauri::command]
fn get_platform_settings() -> PlatformSettings {
	PlatformSettings::default()
}

#[tauri::command]
fn setup_number_of_threads(
	state: State<'_, Mutex<AppState>>,
	number_of_threads: usize,
) -> usize {
	let mut state = state.lock().unwrap();
	if state.is_number_of_threads_setup {
		return get_number_of_threads();
	}
	set_number_of_threads(number_of_threads);
	state.is_number_of_threads_setup = true;
	get_number_of_threads()
}

#[tauri::command]
fn stop_scan(state: State<'_, Mutex<AppState>>) {
	use std::sync::atomic::Ordering;

	let state = state.lock().unwrap();
	state.stop_flag.store(true, Ordering::Relaxed);
}

#[tauri::command]
fn listen_scan_progress(app: AppHandle) {
	let state_mutex = app.state::<Mutex<AppState>>();
	let mut state = state_mutex.lock().unwrap();
	if state.is_progress_thread_setup {
		return;
	}
	state.is_progress_thread_setup = true;
	let progress_rx = state.progress_rx.clone();

	drop(state);

	std::thread::spawn(move || {
		loop {
			let Ok(progress_data) = progress_rx.recv() else {
				return;
			};

			let data = process_progress_data(progress_data);

			app.emit("scan-progress", data).unwrap();
		}
	});
}

#[tauri::command]
fn read_image(path: String) -> Result<ImageInfo, ()> {
	image::read_image(path)
}

#[tauri::command]
fn read_thumbnail(path: String) -> Result<ThumbnailInfo, ()> {
	image::read_thumbnail(path)
}

#[tauri::command]
fn batch_generate_thumbnails(paths: Vec<String>) -> Result<(), String> {
	image::batch_generate_thumbnails(paths)
}

#[tauri::command]
fn has_thumbnail(path: String) -> Result<bool, String> {
	image::has_thumbnail(path)
}

#[tauri::command]
fn clear_thumbnail_cache() -> Result<(), String> {
	image::clear_thumbnail_cache()
}

#[tauri::command]
fn get_thumbnail_cache_stats() -> Result<(usize, u64), String> {
	image::get_thumbnail_cache_stats()
}

#[tauri::command]
fn scan_big_files(app: AppHandle, settings: Settings) {
	big_files::scan_big_files(app, settings);
}

#[tauri::command]
fn scan_duplicate_files(app: AppHandle, settings: Settings) {
	duplicate_files::scan_duplicate_files(app, settings);
}

#[tauri::command]
fn scan_empty_folders(app: AppHandle, settings: Settings) {
	empty_folders::scan_empty_folders(app, settings);
}

#[tauri::command]
fn scan_empty_files(app: AppHandle, settings: Settings) {
	empty_files::scan_empty_files(app, settings);
}

#[tauri::command]
fn scan_temporary_files(app: AppHandle, settings: Settings) {
	temporary_files::scan_temporary_files(app, settings);
}

#[tauri::command]
fn scan_similar_images(app: AppHandle, settings: Settings) {
	similar_images::scan_similar_images(app, settings);
}

#[tauri::command]
fn scan_similar_videos(app: AppHandle, settings: Settings) {
	similar_videos::scan_similar_videos(app, settings);
}

#[tauri::command]
fn scan_music_duplicates(app: AppHandle, settings: Settings) {
	music_duplicates::scan_music_duplicates(app, settings);
}

#[tauri::command]
fn scan_invalid_symlinks(app: AppHandle, settings: Settings) {
	invalid_symlinks::scan_invalid_symlinks(app, settings);
}

#[tauri::command]
fn scan_broken_files(app: AppHandle, settings: Settings) {
	broken_files::scan_broken_files(app, settings);
}

#[tauri::command]
fn scan_bad_extensions(app: AppHandle, settings: Settings) {
	bad_extensions::scan_bad_extensions(app, settings);
}

#[tauri::command]
fn move_files(app: AppHandle, options: move_files::Options) {
	move_files::move_files(app, options);
}

#[tauri::command]
fn delete_files(app: AppHandle, options: delete_files::Options) {
	delete_files::delete_files(app, options);
}

#[tauri::command]
fn save_result(app: AppHandle, options: save_result::Options) {
	save_result::save_result(app, options);
}

#[tauri::command]
fn rename_ext(app: AppHandle, options: rename_ext::Options) {
	rename_ext::rename_ext(app, options);
}

#[tauri::command]
fn open_system_path(path: String) -> Result<(), String> {
	#[cfg(target_os = "windows")]
	{
		// 使用 cmd start 打开默认关联程序
		// 注意: start 第一个参数是窗口标题, 需要空字符串
		let mut cmd = std::process::Command::new("cmd");
		cmd.args(["/C", "start", "", &path]);
		// 防止在含有 & 的路径被解释
		// (start 会自动处理引号, 这里简单加引号)
		if path.contains(' ') || path.contains('&') || path.contains('(') || path.contains(')') {
			cmd.args([&format!("\"{}\"", path)]);
		}
		cmd.spawn().map_err(|e| e.to_string())?;
		return Ok(());
	}
	#[cfg(target_os = "macos")]
	{
		std::process::Command::new("open")
			.arg(&path)
			.spawn()
			.map_err(|e| e.to_string())?;
		return Ok(());
	}
	#[cfg(target_os = "linux")]
	{
		std::process::Command::new("xdg-open")
			.arg(&path)
			.spawn()
			.map_err(|e| e.to_string())?;
		return Ok(());
	}
	#[allow(unreachable_code)]
	Err("Unsupported platform".into())
}

#[tauri::command]
fn copy_file_to_clipboard(path: String) -> Result<(), String> {
	#[cfg(target_os = "windows")]
	{
		// 使用PowerShell和.NET Clipboard类复制文件到剪贴板
		let command = format!(
			r#"Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetFileDropList(@("{}"))"#,
			path.replace("\"", "\"\"")
		);
		println!("Executing PowerShell command: {}", command);
		let output = std::process::Command::new("powershell")
			.args(["-Command", &command])
			.output()
			.map_err(|e| format!("Failed to execute command: {}", e))?;
		
		if output.status.success() {
			println!("Command executed successfully");
			Ok(())
		} else {
			let stderr = String::from_utf8_lossy(&output.stderr);
			println!("Command failed with stderr: {}", stderr);
			Err(format!("Command failed: {}", stderr))
		}
	}
	#[cfg(target_os = "macos")]
	{
		// macOS 使用osascript复制文件到剪贴板
		std::process::Command::new("osascript")
			.args(["-e", &format!("set the clipboard to (POSIX file \"{}\")", path)])
			.spawn()
			.map_err(|e| format!("Failed to copy file to clipboard: {}", e))?;
		Ok(())
	}
	#[cfg(target_os = "linux")]
	{
		// Linux 尝试使用xclip，如果失败则使用wl-copy
		let result = std::process::Command::new("xclip")
			.args(["-selection", "clipboard", "-t", "text/uri-list"])
			.stdin(std::process::Stdio::piped())
			.spawn();

		match result {
			Ok(mut child) => {
				if let Some(stdin) = child.stdin.as_mut() {
					stdin.write_all(format!("file://{}", path).as_bytes()).map_err(|e| e.to_string())?;
				}
				child.wait().map_err(|e| e.to_string())?;
				Ok(())
			}
			Err(_) => {
				// 尝试wl-copy (Wayland)
				std::process::Command::new("wl-copy")
					.arg(format!("file://{}", path))
					.spawn()
					.map_err(|e| format!("Failed to copy file to clipboard: {}", e))?;
				Ok(())
			}
		}
	}
	#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
	{
		Err("Unsupported platform".into())
	}
}
