import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  
  const examTypes = [
    { id: 'upsc', name: 'UPSC Civil Services' },
    { id: 'gate', name: 'GATE' },
    { id: 'cat', name: 'CAT MBA Entrance' },
    { id: 'neet', name: 'NEET Medical' },
    { id: 'jee', name: 'JEE Engineering' },
    { id: 'bank', name: 'Bank Exams' },
    { id: 'ssc', name: 'SSC Exams' },
    { id: 'defence', name: 'Defence Exams' }
  ];

  const handleExamSelection = (examId) => {
    navigate(`/upload/${examId}`);
  };

  return (
    <div className="home-container">
      <Header />
      <div className="hero-section">
        <h2>Your one-stop solution for competitive exam document preparation</h2>
        <p>Upload your documents and images, and we'll optimize them according to exam-specific requirements</p>
      </div>
      
      <div className="exams-grid">
        {examTypes.map((exam) => (
          <button 
            key={exam.id} 
            className="exam-button"
            onClick={() => handleExamSelection(exam.id)}
          >
            {exam.name}
          </button>
        ))}
      </div>
      
      <div className="features-section">
        <h3>Why use getConvertedExams.io?</h3>
        <div className="features-list">
          <div className="feature">
            <h4>Exam-Specific Optimization</h4>
            <p>Each file is compressed according to the specific requirements of your target exam</p>
          </div>
          <div className="feature">
            <h4>Fast Processing</h4>
            <p>Powered by Rust for lightning-fast compression</p>
          </div>
          <div className="feature">
            <h4>Multiple File Types</h4>
            <p>Support for documents, images and more</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;