import React, { useState, useRef } from 'react';
import './FileUpload.css';

const FileUpload = ({ acceptedFormats, onFilesSelected, files, removeFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesSelected(droppedFiles);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    onFilesSelected(selectedFiles);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`file-drop-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          multiple 
          onChange={handleFileChange}
          accept={acceptedFormats}
          className="file-input"
        />
        <div className="drop-message">
          <span className="icon">📁</span>
          <span className="text">
            Drag files here or <span className="browse-text">browse</span>
          </span>
          <span className="supported-formats">
            Supported formats: {acceptedFormats}
          </span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="selected-files">
          <h3>Selected Files</h3>
          <ul className="file-list">
            {files.map((file, index) => (
              <li key={index} className="file-item">
                <div className="file-info">
                  <span className="file-type-icon">
                    {file.type.includes('image') ? '🖼️' : 
                     file.type.includes('pdf') ? '📄' : 
                     file.type.includes('word') ? '📝' : '📁'}
                  </span>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-file"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;