import React from 'react';

const About: React.FC = () => (
  <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded shadow text-center">
    <h1 className="text-3xl font-bold mb-4">Welcome to Filmila!</h1>
    <p className="text-lg mb-4">
      Filmila is a platform built for short filmmakers and passionate film lovers. Our mission is to support independent creators by giving them a space to share their work, gain visibility, and connect with viewers who appreciate fresh storytelling.
    </p>
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <span className="block font-bold mb-1">🚧 Note:</span>
      <span>
        Filmila is currently in development. We're working hard to build the best experience for both filmmakers and audiences. Some features may not be fully functional yet, and your feedback is welcome as we continue improving.
      </span>
    </div>
    <p className="text-lg">
      Thank you for being part of our early journey. Stay tuned — we're just getting started!
    </p>
  </div>
);

export default About; 