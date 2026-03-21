import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Welcome to Our Website</h1>
        <p>Your journey to the best experience starts here!</p>
      </header>
      <main className="landing-main">
        <section className="landing-services">
          <h2>Our Services</h2>
          <p>Discover our wide range of services tailored just for you.</p>
        </section>
        <section className="landing-testimonials">
          <h2>What Our Clients Say</h2>
          <blockquote>
            <p>&quot;This service changed my life!&quot; - Happy Customer</p>
          </blockquote>
        </section>
      </main>
      <footer className="landing-footer">
        <p>&copy; 2026 Our Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;