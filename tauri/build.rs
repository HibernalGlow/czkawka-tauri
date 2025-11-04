fn main() {
	tauri_build::build();

	// Copy dav1d.dll to target/release for bundling
	let src = "../assets/dll/dav1d.dll";
	let dest = "../target/release/dav1d.dll";
	if let Err(e) = std::fs::copy(src, dest) {
		println!("cargo:warning=Failed to copy dav1d.dll: {}", e);
	}
}
