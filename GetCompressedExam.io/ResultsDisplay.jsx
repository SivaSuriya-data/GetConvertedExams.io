import React from 'react';
import { downloadFile } from '../api';
import './ResultsDisplay.css';

const ResultsDisplay = ({ processedFiles }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleDownload = (fileId) => {
    downloadFile(fileId);
  };

  if (!processedFiles || processedFiles.length === 0) {
    return null;
  }

  return (
    <div className="results-section">
      <h3>Compressed Files</h3>
      <div className="results-container">
        {processedFiles.map((file, index) => (
          <div key={index} className="result-item">
            <div className="result-info">
              <div className="file-icon">
                {file.file_type.includes('image') ? '🖼️' : 
                 file.file_type.includes('pdf') ? '📄' : 
                 file.file_type.includes('word') ? '📝' : '📁'}
              </div>
              <div className="file-details">
                <h4>{file.original_name}</h4>
                <div className="size-info">
                  <span>Original: {formatFileSize(file.original_size)}</span>
                  <span className="arrow">→</span>
                  <span>Compressed: {formatFileSize(file.compressed_size)}</span>
                  <span className="savings">
                    ({Math.round((1 - file.compressed_size / file.original_size) * 100)}% saved)
                  </span>
                </div>
              </div>
            </div>
            <button 
              className="download-button"
              onClick={() => handleDownload(file.id)}
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;