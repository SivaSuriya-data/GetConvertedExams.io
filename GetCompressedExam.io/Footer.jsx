import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="footer-content">
        <div className="footer-section">
          <h3>getConvertedExams.io</h3>
          <p>We help students prepare their application documents for competitive exams with our fast and efficient compression service.</p>
        </div>
        
        <div className="footer-section" id="about">
          <h3>About Us</h3>
          <p>We're a team of developers who've experienced the pain of document formatting for exam applications. Our service makes this process simple and quick.</p>
        </div>
        
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: support@getconvertedexams.io</p>
          <p>Phone: +91 123 456 7890</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} getConvertedExams.io | All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer;