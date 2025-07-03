import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white flex flex-col items-center justify-center p-6">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">CoFound</h1> {/* App Name */}
        <p className="text-xl text-slate-300 mb-8">
          Connect with a co-founder who shares your vision and complements your skills.
        </p>
      </header>

      <section className="mb-12 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold mb-6">Why CoFound?</h2>
        <ul className="space-y-4 text-slate-300">
          <li>
            <strong className="text-slate-100">Intelligent Matching:</strong> Our algorithm helps you find relevant co-founder profiles based on your detailed preferences, skills, and goals.
          </li>
          <li>
            <strong className="text-slate-100">Interactive Swiping:</strong> Easily browse through potential co-founders with a familiar and engaging swipe interface.
          </li>
          <li>
            <strong className="text-slate-100">Direct & Group Chat:</strong> Connect with matches instantly or join interest-based groups to network and collaborate.
          </li>
          <li>
            <strong className="text-slate-100">Curated Feed:</strong> Stay updated with community posts and relevant industry news tailored to your interests.
          </li>
        </ul>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-semibold mb-6">Ready to Find Your Partner?</h2>
        <div className="space-x-4">
          <Link
            to="/signup"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-150 ease-in-out transform hover:scale-105"
          >
            Sign Up Now
          </Link>
          <Link
            to="/login"
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-150 ease-in-out transform hover:scale-105"
          >
            Log In
          </Link>
        </div>
      </section>

      <footer className="mt-20 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} CoFound. All rights reserved.</p>
        <p>Building the future, together.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
