use base64::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::io::Cursor;
use std::sync::{Mutex, OnceLock};
use crate::thumbnail::{ThumbnailManager, ThumbnailInfo};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageInfo {
	pub base64: String,
	pub mime_type: &'static str,
}

// 全局缩略图管理器
static THUMBNAIL_MANAGER: OnceLock<Mutex<Option<ThumbnailManager>>> = OnceLock::new();

// 初始化缩略图管理器
pub fn init_thumbnail_manager(cache_dir: std::path::PathBuf, thumbnail_size: u32) -> Result<(), Box<dyn std::error::Error>> {
    let manager = ThumbnailManager::new(cache_dir, thumbnail_size)?;
    THUMBNAIL_MANAGER.set(Mutex::new(Some(manager))).map_err(|_| "Failed to initialize thumbnail manager")?;
    Ok(())
}

// 获取缩略图管理器
fn get_thumbnail_manager() -> Option<ThumbnailManager> {
    THUMBNAIL_MANAGER.get()?
        .lock().ok()?
        .as_ref()
        .cloned()
}

fn get_mime_type_from_extension(path: &str) -> Option<&'static str> {
	let path = Path::new(path);
	let extension = path.extension()?.to_str()?.to_lowercase();
	
	match extension.as_str() {
		"jxl" => Some("image/jxl"),
		"avif" => Some("image/avif"),
		"heic" => Some("image/heic"),
		"heif" => Some("image/heif"),
		"tiff" | "tif" => Some("image/tiff"),
		"ico" => Some("image/x-icon"),
		"svg" => Some("image/svg+xml"),
		_ => None,
	}
}

fn decode_jxl_to_png(data: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
	// 使用 image crate 和 JxlDecoder 解码 JXL 图像
	let cursor = Cursor::new(data);
	let decoder = jxl_oxide::integration::JxlDecoder::new(cursor)?;
	
	// 使用 image crate 的统一接口解码图像
	let dynamic_image = image::DynamicImage::from_decoder(decoder)?;
	
	// 转换为 PNG 格式
	let mut png_data = Vec::new();
	let mut png_cursor = Cursor::new(&mut png_data);
	dynamic_image.write_to(&mut png_cursor, image::ImageFormat::Png)?;
	
	Ok(png_data)
}

pub fn read_image(path: String) -> Result<ImageInfo, ()> {
	let data = std::fs::read(&path).map_err(|_| ())?;
	
	// 检查是否为 JXL 文件
	let path_obj = Path::new(&path);
	let extension = path_obj.extension()
		.and_then(|ext| ext.to_str())
		.map(|ext| ext.to_lowercase());
	
	if let Some(ext) = &extension {
		if ext == "jxl" {
			// 对于 JXL 文件，解码为 PNG 格式
			match decode_jxl_to_png(&data) {
				Ok(png_data) => {
					let base64 = BASE64_STANDARD.encode(png_data);
					return Ok(ImageInfo { 
						base64, 
						mime_type: "image/png" 
					});
				}
				Err(e) => {
					eprintln!("Failed to decode JXL: {}", e);
					return Err(());
				}
			}
		}
	}
	
	// 对于其他格式，使用原有逻辑
	let mime_type = if let Some(kind) = infer::get(&data) {
		kind.mime_type()
	} else {
		// 如果 infer 检测不到，回退到基于扩展名的判断
		get_mime_type_from_extension(&path).ok_or(())?
	};
	
	let base64 = BASE64_STANDARD.encode(data);

	Ok(ImageInfo { base64, mime_type })
}

// 读取缩略图
pub fn read_thumbnail(path: String) -> Result<ThumbnailInfo, ()> {
	if let Some(manager) = get_thumbnail_manager() {
		manager.get_or_create_thumbnail(&path).map_err(|e| {
			eprintln!("Failed to generate thumbnail for {}: {}", path, e);
			()
		})
	} else {
		// 如果缩略图管理器未初始化，回退到原始图片
		let image_info = read_image(path)?;
		Ok(ThumbnailInfo {
			base64: image_info.base64,
			mime_type: image_info.mime_type.to_string(),
			width: 0, // 原图尺寸未知，设为0
			height: 0,
		})
	}
}

// 清理缩略图缓存
pub fn clear_thumbnail_cache() -> Result<(), String> {
	if let Some(manager) = get_thumbnail_manager() {
		manager.clear_cache().map_err(|e| e.to_string())
	} else {
		Err("Thumbnail manager not initialized".to_string())
	}
}

// 获取缓存统计信息
pub fn get_thumbnail_cache_stats() -> Result<(usize, u64), String> {
	if let Some(manager) = get_thumbnail_manager() {
		manager.get_cache_stats().map_err(|e| e.to_string())
	} else {
		Err("Thumbnail manager not initialized".to_string())
	}
}
