// API service for communicating with the Rust backend
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Send files to the backend for compression
 * @param {File[]} files - Array of files to compress
 * @param {string} examType - Type of exam for specific compression settings
 * @returns {Promise} - Promise containing the compression results
 */
export const compressFiles = async (files, examType) => {
  try {
    // Create form data with files
    const formData = new FormData();
    
    // Add each file to the form data
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Call the compression API
    const response = await fetch(`${API_BASE_URL}/compress?exam_type=${examType}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error compressing files:', error);
    throw error;
  }
};

/**
 * Download a compressed file
 * @param {string} fileId - ID of the file to download
 * @returns {void} - Triggers file download
 */
export const downloadFile = (fileId) => {
  window.location.href = `${API_BASE_URL}/download/${fileId}`;
};

/**
 * Get exam specific compression settings
 * @param {string} examType - Type of exam
 * @returns {object} - Object containing compression settings
 */
export const getExamSettings = (examType) => {
  const examSettings = {
    'upsc': { 
      name: 'UPSC Civil Services',
      maxImageSize: '200KB', 
      maxDocSize: '1MB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf, .doc, .docx',
      description: 'Compress files for UPSC application portals with strict size limits.'
    },
    'gate': { 
      name: 'GATE',
      maxImageSize: '100KB', 
      maxDocSize: '500KB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Optimize documents and images for GATE application uploads.'
    },
    'cat': { 
      name: 'CAT MBA Entrance',
      maxImageSize: '150KB', 
      maxDocSize: '800KB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Format your CAT application documents to required specifications.'
    },
    'neet': { 
      name: 'NEET Medical',
      maxImageSize: '200KB', 
      maxDocSize: '1MB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Prepare medical entrance exam documents with proper compression.'
    },
    'jee': { 
      name: 'JEE Engineering',
      maxImageSize: '100KB', 
      maxDocSize: '500KB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Compress files for JEE Main and Advanced applications.'
    },
    'bank': { 
      name: 'Bank Exams',
      maxImageSize: '50KB', 
      maxDocSize: '500KB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Optimize documents for banking exam applications.'
    },
    'ssc': { 
      name: 'SSC Exams',
      maxImageSize: '100KB', 
      maxDocSize: '500KB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Format files according to Staff Selection Commission requirements.'
    },
    'defence': { 
      name: 'Defence Exams',
      maxImageSize: '150KB', 
      maxDocSize: '700KB',
      acceptedFormats: '.jpg, .jpeg, .png, .pdf',
      description: 'Compress documents for various defence services examination applications.'
    }
  };
  
  return examSettings[examType] || examSettings['upsc'];
};
