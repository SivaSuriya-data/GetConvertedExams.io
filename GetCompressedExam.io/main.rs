use actix_cors::Cors;
use actix_multipart::Multipart;
use actix_web::{middleware, web, App, Error, HttpResponse, HttpServer};
use futures::{StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::fs;
use uuid::Uuid;
use log::{info, error};
use std::collections::HashMap;

mod compressors;
use crate::compressors::{compress_image, compress_pdf, compress_document};

// Define exam specific compression settings
#[derive(Debug, Clone)]
struct CompressionSettings {
    max_image_size_kb: u32,
    max_doc_size_kb: u32,
    image_quality: u8,  // 0-100
    pdf_compression_level: u8,  // 0-9
}

// Processed file response
#[derive(Serialize)]
struct ProcessedFile {
    id: String,
    original_name: String,
    original_size: u64,
    compressed_size: u64,
    file_type: String,
    download_url: String,
}

// API response
#[derive(Serialize)]
struct ApiResponse {
    success: bool,
    message: String,
    files: Vec<ProcessedFile>,
}

// Data structure for exam settings
#[derive(Deserialize)]
struct ExamRequest {
    exam_type: String,
}

// Initialize compression settings for different exams
fn get_exam_settings(exam_type: &str) -> CompressionSettings {
    match exam_type {
        "upsc" => CompressionSettings {
            max_image_size_kb: 200,
            max_doc_size_kb: 1024,
            image_quality: 85,
            pdf_compression_level: 7,
        },
        "gate" => CompressionSettings {
            max_image_size_kb: 100,
            max_doc_size_kb: 500,
            image_quality: 75,
            pdf_compression_level: 8,
        },
        "cat" => CompressionSettings {
            max_image_size_kb: 150,
            max_doc_size_kb: 800,
            image_quality: 80,
            pdf_compression_level: 7,
        },
        "neet" => CompressionSettings {
            max_image_size_kb: 200,
            max_doc_size_kb: 1024,
            image_quality: 85,
            pdf_compression_level: 7,
        },
        "jee" => CompressionSettings {
            max_image_size_kb: 100,
            max_doc_size_kb: 500,
            image_quality: 75,
            pdf_compression_level: 8,
        },
        "bank" => CompressionSettings {
            max_image_size_kb: 50,
            max_doc_size_kb: 500,
            image_quality: 70,
            pdf_compression_level: 9,
        },
        "ssc" => CompressionSettings {
            max_image_size_kb: 100,
            max_doc_size_kb: 500,
            image_quality: 75,
            pdf_compression_level: 8,
        },
        "defence" => CompressionSettings {
            max_image_size_kb: 150,
            max_doc_size_kb: 700,
            image_quality: 80,
            pdf_compression_level: 7,
        },
        // Default settings if exam type not recognized
        _ => CompressionSettings {
            max_image_size_kb: 100,
            max_doc_size_kb: 500,
            image_quality: 75,
            pdf_compression_level: 8,
        },
    }
}

// Handler for file upload and compression
async fn compress_files(
    mut payload: Multipart,
    query: web::Query<ExamRequest>,
) -> Result<HttpResponse, Error> {
    // Get exam-specific settings
    let settings = get_exam_settings(&query.exam_type);
    info!("Processing files for exam type: {}", query.exam_type);
    
    // Create temp directory for uploads if it doesn't exist
    let upload_dir = PathBuf::from("temp_uploads");
    if !upload_dir.exists() {
        fs::create_dir_all(&upload_dir).unwrap();
    }
    
    // Create output directory for compressed files if it doesn't exist
    let output_dir = PathBuf::from("compressed_files");
    if !output_dir.exists() {
        fs::create_dir_all(&output_dir).unwrap();
    }
    
    let mut processed_files = Vec::new();
    
    // Process each uploaded file
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        
        // Get filename
        let filename = content_disposition
            .get_filename()
            .unwrap_or("unknown_file")
            .to_string();
        
        info!("Processing file: {}", filename);
        
        // Generate a unique ID for the file
        let file_id = Uuid::new_v4().to_string();
        
        // Create paths for original and compressed files
        let file_path = upload_dir.join(&format!("{}-{}", file_id, &filename));
        let output_path = output_dir.join(&format!("{}-{}", file_id, &filename));
        
        // Create file
        let mut f = web::block(|| std::fs::File::create(&file_path))
            .await
            .unwrap();
        
        // Write file content
        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            f = web::block(move || f.write_all(&data).map(|_| f))
                .await
                .unwrap();
        }
        
        // Get file size
        let original_size = web::block(|| std::fs::metadata(&file_path))
            .await
            .unwrap()
            .len();
        
        // Determine file type
        let file_extension = Path::new(&filename)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();
        
        // Compress file based on its type
        let compressed_size = match file_extension.as_str() {
            "jpg" | "jpeg" | "png" => {
                // Compress image
                compress_image(&file_path, &output_path, settings.image_quality, settings.max_image_size_kb)
                    .await
                    .unwrap_or(original_size)
            },
            "pdf" => {
                // Compress PDF
                compress_pdf(&file_path, &output_path, settings.pdf_compression_level)
                    .await
                    .unwrap_or(original_size)
            },
            "doc" | "docx" => {
                // Compress document
                compress_document(&file_path, &output_path, settings.max_doc_size_kb)
                    .await
                    .unwrap_or(original_size)
            },
            _ => {
                // For other file types, just copy the file
                web::block(|| std::fs::copy(&file_path, &output_path))
                    .await
                    .unwrap()
            }
        };
        
        // Add processed file info to response
        let download_url = format!("/api/download/{}", file_id);
        processed_files.push(ProcessedFile {
            id: file_id,
            original_name: filename,
            original_size,
            compressed_size,
            file_type: mime_guess::from_path(&file_path)
                .first_or_octet_stream()
                .to_string(),
            download_url,
        });
    }
    
    // Return response
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        message: format!("Files processed for {} exam", query.exam_type),
        files: processed_files,
    }))
}

// Handler for downloading compressed files
async fn download_file(path: web::Path<String>) -> Result<HttpResponse, Error> {
    let file_id = path.into_inner();
    let output_dir = PathBuf::from("compressed_files");
    
    // Find the file with the matching ID
    let mut file_path = None;
    for entry in fs::read_dir(&output_dir).unwrap() {
        if let Ok(entry) = entry {
            let path = entry.path();
            if let Some(file_name) = path.file_name() {
                if let Some(file_name_str) = file_name.to_str() {
                    if file_name_str.starts_with(&file_id) {
                        file_path = Some(path);
                        break;
                    }
                }
            }
        }
    }
    
    // If file found, return it
    if let Some(path) = file_path {
        let file_name = path
            .file_name()
            .unwrap()
            .to_str()
            .unwrap()
            .split('-')
            .skip(1)
            .collect::<Vec<&str>>()
            .join("-");
            
        let file = match fs::read(&path) {
            Ok(file) => file,
            Err(_) => return Ok(HttpResponse::NotFound().finish()),
        };
        
        // Guess mime type
        let mime_type = mime_guess::from_path(&path)
            .first_or_octet_stream()
            .to_string();
            
        // Return file with appropriate headers
        Ok(HttpResponse::Ok()
            .content_type(mime_type)
            .append_header(("Content-Disposition", format!("attachment; filename=\"{}\"", file_name)))
            .body(file))
    } else {
        Ok(HttpResponse::NotFound().finish())
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    info!("Starting server at http://127.0.0.1:8080");
    
    // Start HTTP server
    HttpServer::new(|| {
        // Configure CORS
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
            
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .service(
                web::scope("/api")
                    .route("/compress", web::post().to(compress_files))
                    .route("/download/{file_id}", web::get().to(download_file))
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
