use czkawka_core::{
	common::tool_data::CommonData,
	tools::similar_images::{
		ImagesEntry, SimilarImages, SimilarImagesParameters,
	},
};
use czkawka_core::tools::similar_images::core::get_string_from_similarity;
use czkawka_core::common::traits::Search;
use image_hasher::{FilterType, HashAlg};
use rayon::prelude::*;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};


use crate::{
	image,
	scaner::{set_scaner_common_settings, spawn_scaner_thread},
	settings::Settings,
	state::get_stop_flag_and_progress_tx,
};

mod similar_folders {
	use std::collections::HashMap;
	use super::CustomImagesEntry;

	#[derive(serde::Serialize, Clone, Debug)]
	pub struct FolderStat {
		pub path: String,
		pub count: usize,
	}

	pub fn collect_folders(
		raw_list: &[(Option<CustomImagesEntry>, Vec<CustomImagesEntry>)],
		is_in_reference_path: &dyn Fn(&str) -> bool,
		threshold: usize,
	) -> Vec<FolderStat> {
		let mut folder_count: HashMap<String, usize> = HashMap::new();
		for (ref_item, group) in raw_list {
			// 统计参考图片
			if let Some(entry) = ref_item {
				if let Some(folder) = std::path::Path::new(&entry.path).parent() {
					let folder_str = folder.to_string_lossy().to_string();
					if !is_in_reference_path(&folder_str) {
						*folder_count.entry(folder_str).or_insert(0) += 1;
					}
				}
			}
			// 统计组内图片
			for entry in group {
				if let Some(folder) = std::path::Path::new(&entry.path).parent() {
					let folder_str = folder.to_string_lossy().to_string();
					if !is_in_reference_path(&folder_str) {
						*folder_count.entry(folder_str).or_insert(0) += 1;
					}
				}
			}
		}
		folder_count
			.into_iter()
			.filter(|(_, count)| *count >= threshold)
			.map(|(path, count)| FolderStat { path, count })
			.collect()
	}
}

#[derive(Serialize, Clone, Debug)]
struct CustomImagesEntry {
	path: String,
	size: u64,
	width: u32,
	height: u32,
	modified_date: u64,
	similarity: String,
}

#[derive(Serialize, Clone)]
struct ScanResult {
	cmd: &'static str,
	list: Vec<(Option<CustomImagesEntry>, Vec<CustomImagesEntry>)>,
	message: String,
	folders: Vec<similar_folders::FolderStat>,
}

pub fn scan_similar_images(app: AppHandle, settins: Settings) {
	spawn_scaner_thread(move || {
		let (stop_flag, progress_tx) = get_stop_flag_and_progress_tx(&app);

		// 如果启用了缩略图，初始化缩略图管理器
		if settins.similar_images_enable_thumbnails {
			if let Ok(cache_dir) = app.path().app_cache_dir() {
				let thumbnail_dir = cache_dir.join("thumbnails");
				let thumbnail_size = 256; // 固定尺寸，未来可配置
				if let Err(e) = image::init_thumbnail_manager(thumbnail_dir, thumbnail_size) {
					eprintln!("Failed to initialize thumbnail manager: {}", e);
				}
			}
		}

		let hash_alg = match settins.similar_images_sub_hash_alg.as_ref() {
			"Gradient" => HashAlg::Gradient,
			"BlockHash" => HashAlg::Blockhash,
			"VertGradient" => HashAlg::VertGradient,
			"DoubleGradient" => HashAlg::DoubleGradient,
			"Median" => HashAlg::Median,
			_ => HashAlg::Mean,
		};
		let resize_algorithm =
			match settins.similar_images_sub_resize_algorithm.as_ref() {
				"Gaussian" => FilterType::Gaussian,
				"CatmullRom" => FilterType::CatmullRom,
				"Triangle" => FilterType::Triangle,
				"Nearest" => FilterType::Nearest,
				_ => FilterType::Lanczos3,
			};
		let hash_size = settins
			.similar_images_sub_hash_size
			.parse::<u8>()
			.unwrap_or(16);
		let mut scaner = SimilarImages::new(SimilarImagesParameters::new(
			settins.similar_images_sub_similarity as u32,
			hash_size,
			hash_alg,
			resize_algorithm,
			settins.similar_images_sub_ignore_same_size,
			settins.similar_images_hide_hard_links,
		));

		scaner.set_delete_outdated_cache(
			settins.similar_images_delete_outdated_entries,
		);
		set_scaner_common_settings(&mut scaner, settins);

	// v10 API: use Search::search(stop_flag, progress_sender)
	scaner.search(&stop_flag, Some(&progress_tx));

		let mut message = scaner.get_text_messages().create_messages_text();
		let mut raw_list: Vec<_> = if scaner.get_use_reference() {
			scaner
				.get_similar_images_referenced()
				.iter()
				.cloned()
				.map(|(original, others)| (Some(original), others))
				.collect()
		} else {
			scaner
				.get_similar_images()
				.iter()
				.cloned()
				.map(|items| (None, items))
				.collect()
		};

		for (_, vec_fe) in &mut raw_list {
			vec_fe.par_sort_unstable_by_key(|e| e.similarity);
		}

		message = format!(
			"Found {} similar image files\n{}",
			raw_list.len(),
			message
		);

		let list = raw_list
			.into_iter()
			.map(|(ref_item, item)| {
				(
					ref_item.map(|v| images_entry_to_custom(v, hash_size)),
					item.into_iter()
						.map(|v| images_entry_to_custom(v, hash_size))
						.collect(),
				)
			})
			.collect::<Vec<_>>();

		let folders = similar_folders::collect_folders(&list, &is_in_reference_path, 2);
		// dbg!("similar_images list", &list);
		// dbg!("similar_images folders", &folders);
		app.emit(
			"scan-result",
			ScanResult {
				cmd: "scan_similar_images",
				list,
				message,
				folders,
			},
		)
		.unwrap();

		set_scaner_state(app, scaner);
	});
}

fn images_entry_to_custom(
	value: ImagesEntry,
	hash_size: u8,
) -> CustomImagesEntry {
	CustomImagesEntry {
		path: value.path.to_string_lossy().to_string(),
		size: value.size,
		width: value.width,
		height: value.height,
		modified_date: value.modified_date,
		similarity: get_string_from_similarity(&value.similarity, hash_size),
	}
}

fn is_in_reference_path(_folder: &str) -> bool {
	// TODO: 替换为你的实际判断逻辑
	false
}

crate::gen_set_scaner_state_fn!(
	similar_images_state,
	czkawka_core::tools::similar_images::SimilarImages
);
