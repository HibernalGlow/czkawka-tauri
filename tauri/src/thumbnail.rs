use base64::prelude::*;
use image::GenericImageView;
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ThumbnailInfo {
	pub base64: String,
	pub mime_type: String,
	pub width: u32,
	pub height: u32,
}

#[derive(Clone)]
pub struct ThumbnailManager {
	cache_dir: PathBuf,
	db_path: PathBuf,
	thumbnail_size: u32,
}

impl ThumbnailManager {
	pub fn new(
		cache_dir: PathBuf,
		thumbnail_size: u32,
	) -> Result<Self, Box<dyn std::error::Error>> {
		let db_path = cache_dir.join("thumbnails.db");

		// 确保缓存目录存在
		if !cache_dir.exists() {
			fs::create_dir_all(&cache_dir)?;
		}

		let manager = Self {
			cache_dir,
			db_path,
			thumbnail_size,
		};

		manager.init_database()?;
		Ok(manager)
	}

	fn init_database(&self) -> Result<(), Box<dyn std::error::Error>> {
		let conn = Connection::open(&self.db_path)?;
		conn.execute(
			"CREATE TABLE IF NOT EXISTS thumbnails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_path TEXT NOT NULL UNIQUE,
                thumbnail_path TEXT NOT NULL,
                image_size INTEGER NOT NULL,
                image_modified INTEGER NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            )",
			[],
		)?;

		conn.execute(
			"CREATE INDEX IF NOT EXISTS idx_image_path ON thumbnails(image_path)",
			[],
		)?;

		Ok(())
	}

	pub fn get_or_create_thumbnail(
		&self,
		image_path: &str,
	) -> Result<ThumbnailInfo, Box<dyn std::error::Error>> {
		// 检查文件是否存在
		let path = Path::new(image_path);
		if !path.exists() {
			return Err("Image file not found".into());
		}

		let metadata = fs::metadata(path)?;
		let image_size = metadata.len();
		let image_modified =
			metadata.modified()?.duration_since(UNIX_EPOCH)?.as_secs();

		// 检查数据库中是否已有有效的缩略图
		if let Some(thumbnail_info) =
			self.get_cached_thumbnail(image_path, image_size, image_modified)?
		{
			return Ok(thumbnail_info);
		}

		// 生成新的缩略图
		self.create_thumbnail(image_path, image_size, image_modified)
	}

	fn get_cached_thumbnail(
		&self,
		image_path: &str,
		image_size: u64,
		image_modified: u64,
	) -> Result<Option<ThumbnailInfo>, Box<dyn std::error::Error>> {
		let conn = Connection::open(&self.db_path)?;

		let mut stmt = conn.prepare(
			"SELECT thumbnail_path, width, height FROM thumbnails 
             WHERE image_path = ? AND image_size = ? AND image_modified = ?",
		)?;

		let result: Option<(String, u32, u32)> = stmt
			.query_row(
				params![image_path, image_size as i64, image_modified as i64],
				|row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
			)
			.optional()?;

		if let Some((thumbnail_path, width, height)) = result {
			let thumb_path = Path::new(&thumbnail_path);
			if thumb_path.exists() {
				// 读取缩略图文件并转换为 base64
				let thumbnail_data = fs::read(thumb_path)?;
				let base64 = BASE64_STANDARD.encode(thumbnail_data);

				return Ok(Some(ThumbnailInfo {
					base64,
					mime_type: "image/jpeg".to_string(),
					width,
					height,
				}));
			} else {
				// 缩略图文件不存在，删除数据库记录
				conn.execute(
					"DELETE FROM thumbnails WHERE image_path = ?",
					params![image_path],
				)?;
			}
		}

		Ok(None)
	}

	fn create_thumbnail(
		&self,
		image_path: &str,
		image_size: u64,
		image_modified: u64,
	) -> Result<ThumbnailInfo, Box<dyn std::error::Error>> {
		// 读取并解码图片
		let img = self.load_image(image_path)?;

		// 生成缩略图
		let thumbnail = img.thumbnail(self.thumbnail_size, self.thumbnail_size);
		let (width, height) = thumbnail.dimensions();

		// 生成缩略图文件路径
		let file_name = Path::new(image_path)
			.file_name()
			.and_then(|name| name.to_str())
			.unwrap_or("unknown");

		let hash = format!(
			"{:x}",
			md5::compute(format!(
				"{}-{}-{}",
				image_path, image_size, image_modified
			))
		);
		let thumbnail_filename = format!("{}_{}.webp", hash, file_name);
		let thumbnail_path = self.cache_dir.join(thumbnail_filename);

		// 保存缩略图为 WebP 格式
		let mut output = Vec::new();
		let mut cursor = Cursor::new(&mut output);
		thumbnail.write_to(&mut cursor, image::ImageFormat::WebP)?;

		fs::write(&thumbnail_path, &output)?;

		// 保存到数据库
		let conn = Connection::open(&self.db_path)?;
		let created_at =
			SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();

		conn.execute(
            "INSERT OR REPLACE INTO thumbnails 
             (image_path, thumbnail_path, image_size, image_modified, width, height, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![
                image_path,
                thumbnail_path.to_string_lossy().as_ref(),
                image_size as i64,
                image_modified as i64,
                width as i64,
                height as i64,
                created_at as i64
            ]
        )?;

		let base64 = BASE64_STANDARD.encode(output);

		Ok(ThumbnailInfo {
			base64,
			mime_type: "image/webp".to_string(),
			width,
			height,
		})
	}

	fn load_image(
		&self,
		path: &str,
	) -> Result<image::DynamicImage, Box<dyn std::error::Error>> {
		let data = fs::read(path)?;

		// 检查是否为 JXL 文件
		let path_obj = Path::new(path);
		let extension = path_obj
			.extension()
			.and_then(|ext| ext.to_str())
			.map(|ext| ext.to_lowercase());

		if let Some(ext) = &extension {
			if ext == "jxl" {
				// 对于 JXL 文件，使用特殊解码
				let cursor = Cursor::new(&data);
				let decoder = jxl_oxide::integration::JxlDecoder::new(cursor)?;
				return Ok(image::DynamicImage::from_decoder(decoder)?);
			}
		}

		// 对于其他格式，使用标准 image 库
		Ok(image::load_from_memory(&data)?)
	}

	pub fn clear_cache(&self) -> Result<(), Box<dyn std::error::Error>> {
		let conn = Connection::open(&self.db_path)?;
		conn.execute("DELETE FROM thumbnails", [])?;

		// 删除所有缓存文件
		if self.cache_dir.exists() {
			for entry in fs::read_dir(&self.cache_dir)? {
				let entry = entry?;
				if entry.path().extension().and_then(|s| s.to_str())
					== Some("jpg")
				{
					fs::remove_file(entry.path())?;
				}
			}
		}

		Ok(())
	}

	pub fn get_cache_stats(
		&self,
	) -> Result<(usize, u64), Box<dyn std::error::Error>> {
		let conn = Connection::open(&self.db_path)?;
		let count: usize =
			conn.query_row("SELECT COUNT(*) FROM thumbnails", [], |row| {
				Ok(row.get(0)?)
			})?;

		let mut total_size = 0u64;
		if self.cache_dir.exists() {
			for entry in fs::read_dir(&self.cache_dir)? {
				let entry = entry?;
				if entry.path().extension().and_then(|s| s.to_str())
					== Some("jpg")
				{
					total_size += entry.metadata()?.len();
				}
			}
		}

		Ok((count, total_size))
	}

	/// 批量预生成缩略图（后台任务）
	pub fn batch_generate_thumbnails(
		&self,
		image_paths: Vec<String>,
	) -> Result<(), Box<dyn std::error::Error>> {
		let manager = self.clone();
		let (tx, _rx) = mpsc::channel();

		// 启动后台线程进行批量生成
		std::thread::spawn(move || {
			for (index, path) in image_paths.iter().enumerate() {
				if let Err(e) = manager.get_or_create_thumbnail(path) {
					eprintln!(
						"Failed to generate thumbnail for {}: {}",
						path, e
					);
				}

				// 发送进度信息
				let progress = ((index + 1) as f32 / image_paths.len() as f32
					* 100.0) as u32;
				let _ = tx.send(progress);

				// 添加小延迟避免过度占用CPU
				std::thread::sleep(std::time::Duration::from_millis(10));
			}
		});

		Ok(())
	}

	/// 检查缩略图是否存在（不生成）
	pub fn has_thumbnail(
		&self,
		image_path: &str,
	) -> Result<bool, Box<dyn std::error::Error>> {
		let path = Path::new(image_path);
		if !path.exists() {
			return Ok(false);
		}

		let metadata = fs::metadata(path)?;
		let image_size = metadata.len();
		let image_modified =
			metadata.modified()?.duration_since(UNIX_EPOCH)?.as_secs();

		let conn = Connection::open(&self.db_path)?;
		let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM thumbnails 
             WHERE image_path = ?1 AND image_size = ?2 AND image_modified = ?3)",
            params![image_path, image_size as i64, image_modified as i64],
            |row| row.get(0),
        )?;

		Ok(exists)
	}
}
