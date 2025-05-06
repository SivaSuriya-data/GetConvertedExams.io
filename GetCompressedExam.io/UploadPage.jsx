import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import FileUpload from './FileUpload';
import ResultsDisplay from './ResultsDisplay';
import { compressFiles, getExamSettings } from '../api';
import './UploadPage.css';

const EnhancedUploadPage = () => {
  const { examType } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [examConfig, setExamConfig] = useState(null);
  const [error, setError] = useState(null);

  // Load exam settings when the component mounts or examType changes
  useEffect(() => {
    if (examType) {
      const config = getExamSettings(examType);
      if (!config) {
        // If exam type is not valid, redirect to home
        navigate('/');
        return;
      }
      setExamConfig(config);
    }
  }, [examType, navigate]);

  const handleFilesSelected = (selectedFiles) => {
    // Check file types against accepted formats
    if (examConfig) {
      const acceptedExtensions = examConfig.acceptedFormats
        .split(',')
        .map(format => format.trim().toLowerCase());
      
      const validFiles = selectedFiles.filter(file => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return acceptedExtensions.includes(extension);
      });
      
      if (validFiles.length !== selectedFiles.length) {
        alert('Some files were not added because they are not supported for this exam type.');
      }
      
      setFiles([...files, ...validFiles]);
    } else {
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      alert('Please select at least one file to compress.');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Use our API function to compress files
      const response = await compressFiles(files, examType);
      setProcessedFiles(response.files);
      
      // Clear selected files after successful compression
      setFiles([]);
    } catch (error) {
      console.error('Error compressing files:', error);
      setError('Failed to compress files. Please try again or contact support if the issue persists.');
    } finally {
      setProcessing(false);
    }
  };

  // If exam config is not loaded yet
  if (!examConfig) {
    return (
      <div className="upload-page">
        <Header />
        <div className="upload-container">
          <LoadingSpinner message="Loading exam configuration..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="upload-page">
      <Header />
      <div className="upload-container">
        <div className="exam-info">
          <h2>{examConfig.name} Document Preparation</h2>
          <p className="exam-description">{examConfig.description}</p>
          <div className="exam-requirements">
            <div className="requirement">
              <strong>Maximum Image Size:</strong> {examConfig.maxImageSize}
            </div>
            <div className="requirement">
              <strong>Maximum Document Size:</strong> {examConfig.maxDocSize}
            </div>
            <div className="requirement">
              <strong>Accepted Formats:</strong> {examConfig.acceptedFormats}
            </div>
          </div>
        </div>

        {error && (
          <ErrorMessage 
            message={error} 
            onRetry={() => setError(null)} 
          />
        )}

        <div className="upload-section">
          <form onSubmit={handleSubmit}>
            <FileUpload 
              acceptedFormats={examConfig.acceptedFormats}
              onFilesSelected={handleFilesSelected}
              files={files}
              removeFile={removeFile}
            />
            
            {files.length > 0 && (
              <button 
                type="submit" 
                className="compress-button"
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Compress Files'}
              </button>
            )}
          </form>
        </div>

        {processing && (
          <div className="processing-section">
            <LoadingSpinner message="Compressing your files..." />
          </div>
        )}

        {processedFiles.length > 0 && (
          <ResultsDisplay processedFiles={processedFiles} />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EnhancedUploadPage;