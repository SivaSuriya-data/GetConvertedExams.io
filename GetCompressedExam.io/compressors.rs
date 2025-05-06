use image::{self, GenericImageView, ImageFormat};
use lopdf::{Document, Object, Dictionary};
use std::path::Path;
use std::fs::File;
use std::io::{self, Read, Write};
use log::{info, error};
use tokio::task;

// Compress image files (JPEG, PNG)
pub async fn compress_image<P: AsRef<Path>>(
    input_path: P,
    output_path: P,
    quality: u8,
    max_size_kb: u32,
) -> io::Result<u64> {
    // Run image compression in a blocking task
    task::spawn_blocking(move || {
        // Open the image
        let img = match image::open(&input_path) {
            Ok(img) => img,
            Err(e) => {
                error!("Failed to open image: {}", e);
                return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to open image: {}", e)));
            }
        };
        
        // Get image dimensions
        let (width, height) = img.dimensions();
        
        // Calculate target size based on maximum allowed size
        let max_size_bytes = max_size_kb * 1024;
        let original_size = match std::fs::metadata(&input_path) {
            Ok(metadata) => metadata.len(),
            Err(e) => {
                error!("Failed to get file metadata: {}", e);
                return Err(e);
            }
        };
        
        // If the image is already smaller than the target size, just copy it
        if original_size <= max_size_bytes as u64 {
            match std::fs::copy(&input_path, &output_path) {
                Ok(bytes) => {
                    info!("Image already within size limit, copied: {} bytes", bytes);
                    return Ok(bytes);
                },
                Err(e) => {
                    error!("Failed to copy file: {}", e);
                    return Err(e);
                }
            }
        }
        
        // Determine scaling factor if needed
        let mut scale = 1.0;
        
        // If file is significantly larger than the limit, we'll need to resize
        if original_size > max_size_bytes as u64 * 2 {
            // Start with a reasonable scaling
            scale = 0.8;
            
            // For very large files, scale more aggressively
            if original_size > max_size_bytes as u64 * 4 {
                scale = 0.6;
            }
        }
        
        // Calculate new dimensions
        let new_width = (width as f32 * scale) as u32;
        let new_height = (height as f32 * scale) as u32;
        
        // Resize image if needed
        let processed_img = if scale < 1.0 {
            img.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
        } else {
            img
        };
        
        // Determine output format
        let format = if let Some(extension) = output_path.as_ref().extension() {
            match extension.to_str().unwrap_or("").to_lowercase().as_str() {
                "jpg" | "jpeg" => ImageFormat::Jpeg,
                "png" => ImageFormat::Png,
                _ => ImageFormat::Jpeg, // Default to JPEG
            }
        } else {
            ImageFormat::Jpeg
        };
        
        // Save with compression
        let mut output_file = match File::create(&output_path) {
            Ok(file) => file,
            Err(e) => {
                error!("Failed to create output file: {}", e);
                return Err(e);
            }
        };
        
        // Save image with specified quality
        if format == ImageFormat::Jpeg {
            let mut buffer = io::Cursor::new(Vec::new());
            if let Err(e) = processed_img.write_to(&mut buffer, format) {
                error!("Failed to encode image: {}", e);
                return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to encode image: {}", e)));
            }
            
            if let Err(e) = output_file.write_all(&buffer.into_inner()) {
                error!("Failed to write to output file: {}", e);
                return Err(e);
            }
        } else {
            // For PNG, we don't have quality parameter
            if let Err(e) = processed_img.write_to(&mut output_file, format) {
                error!("Failed to write image: {}", e);
                return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to write image: {}", e)));
            }
        }
        
        // Get compressed file size
        let compressed_size = match std::fs::metadata(&output_path) {
            Ok(metadata) => metadata.len(),
            Err(e) => {
                error!("Failed to get compressed file metadata: {}", e);
                return Err(e);
            }
        };
        
        info!("Image compressed from {} to {} bytes", original_size, compressed_size);
        Ok(compressed_size)
    })
    .await
    .unwrap()
}

// Compress PDF files
pub async fn compress_pdf<P: AsRef<Path>>(
    input_path: P,
    output_path: P,
    compression_level: u8,
) -> io::Result<u64> {
    // Run PDF compression in a blocking task
    task::spawn_blocking(move || {
        // Load the PDF document
        let doc = match Document::load(&input_path) {
            Ok(doc) => doc,
            Err(e) => {
                error!("Failed to load PDF: {}", e);
                return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to load PDF: {}", e)));
            }
        };
        
        // Create a new optimized document
        let mut optimized_doc = Document::new();
        
        // Copy all pages to the new document with compression
        for (page_id, page) in doc.get_pages() {
            // Copy page content with compression
            if let Ok(page_dict) = doc.get_dictionary(page) {
                let mut new_page_dict = page_dict.clone();
                
                // Apply compression settings based on level
                if compression_level > 5 {
                    // Remove unnecessary metadata if high compression requested
                    new_page_dict.remove(b"Metadata");
                    new_page_dict.remove(b"PieceInfo");
                }
                
                // Add page to new document
                let new_page_id = optimized_doc.add_object(Object::Dictionary(new_page_dict));
                optimized_doc.add_page(new_page_id, page_id, None);
            }
        }
        
        // Save the optimized PDF
        if let Err(e) = optimized_doc.save(&output_path) {
            error!("Failed to save optimized PDF: {}", e);
            return Err(io::Error::new(io::ErrorKind::Other, format!("Failed to save optimized PDF: {}", e)));
        }
        
        // Get compressed file size
        let compressed_size = match std::fs::metadata(&output_path) {
            Ok(metadata) => metadata.len(),
            Err(e) => {
                error!("Failed to get compressed file metadata: {}", e);
                return Err(e);
            }
        };
        
        let original_size = match std::fs::metadata(&input_path) {
            Ok(metadata) => metadata.len(),
            Err(e) => {
                error!("Failed to get original file metadata: {}", e);
                return Err(e);
            }
        };
        
        info!("PDF compressed from {} to {} bytes", original_size, compressed_size);
        Ok(compressed_size)
    })
    .await
    .unwrap()
}

// Compress document files (DOC, DOCX, etc.)
// Note: For full document compression, you'd typically use a library like
// OpenOffice/LibreOffice headless mode or other specialized libraries.
// This is a simplified version that just copies the file for now.
pub async fn compress_document<P: AsRef<Path>>(
    input_path: P,
    output_path: P,
    _max_size_kb: u32,
) -> io::Result<u64> {
    // For now, we'll just copy the document
    // In a production app, you'd use a proper document compression library
    task::spawn_blocking(move || {
        info!("Document compression not fully implemented, copying file");
        std::fs::copy(&input_path, &output_path)
    })
    .await
    .unwrap()
}
