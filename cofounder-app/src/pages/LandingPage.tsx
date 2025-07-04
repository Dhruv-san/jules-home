import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineUsers, HiOutlineChatAlt2, HiOutlineNewspaper } from 'react-icons/hi';

// Simple functional component for feature items to reduce repetition
const FeatureItem: React.FC<{ icon: React.ReactElement<{ className: string }>; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center p-6 text-center bg-white dark:bg-slate-800/50 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out">
    <div className="p-4 bg-rose-500 dark:bg-rose-600 text-white rounded-full mb-4 inline-block">
      {React.cloneElement(icon, { className: "w-8 h-8" })}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);


const LandingPage: React.FC = () => {
  // Define consistent button classes
  const primaryButtonClass = "px-8 py-3 text-lg font-semibold text-white bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900";

  return (
    // The global body styles from index.css will handle base bg and text color
    <div className="min-h-screen flex flex-col">
      {/* Navigation - Can be extracted to a separate LandingNavbar if it grows */}
      <nav className="py-4 sm:py-6 fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold text-rose-600 dark:text-rose-500">
            CoFound
          </Link>
          <div className="space-x-2 sm:space-x-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
              Log In
            </Link>
            <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 rounded-md transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - with padding top to account for fixed navbar */}
      <header className="pt-24 sm:pt-32 pb-16 sm:pb-24 text-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex flex-col items-center justify-center flex-grow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Find Your <span className="text-rose-600 dark:text-rose-500">Perfect Co-Founder</span>.
          </h1>
          <p className="max-w-xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            Connect with driven entrepreneurs, share your vision, and build the next big thing, together.
            Stop searching, start building.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/signup" className={primaryButtonClass}>
              Get Started Free
            </Link>
            {/* <Link to="/how-it-works" className={secondaryButtonClass}> Learn More </Link> */}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Why Choose CoFound?</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              We provide the tools and community to help you find the ideal partner to launch your startup.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureItem
              icon={<HiOutlineSparkles />}
              title="Intelligent Matching"
              description="Our algorithm connects you with profiles that align with your skills, interests, and co-founder criteria."
            />
            <FeatureItem
              icon={<HiOutlineUsers />}
              title="Interactive Discovery"
              description="Effortlessly browse through potential co-founders using an engaging and intuitive swipe interface."
            />
            <FeatureItem
              icon={<HiOutlineChatAlt2 />}
              title="Seamless Communication"
              description="Connect instantly with your matches through direct chat. Plan, discuss, and collaborate."
            />
            <FeatureItem
              icon={<HiOutlineNewspaper />}
              title="Curated Content Feed"
              description="Stay informed with relevant industry news and posts from the CoFound community."
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-rose-500 to-orange-500 dark:from-rose-600 dark:to-orange-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">Ready to Build Your Dream Team?</h2>
          <p className="max-w-xl mx-auto text-lg sm:text-xl opacity-90 mb-10">
            Join thousands of entrepreneurs who have found their co-founders on CoFound. Your next partner is just a swipe away.
          </p>
          <Link to="/signup" className="px-10 py-4 text-xl font-semibold text-rose-600 bg-white rounded-lg shadow-xl hover:bg-slate-50 transition-colors duration-150 transform hover:scale-105">
            Find Your Co-Founder Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            &copy; {new Date().getFullYear()} CoFound. All rights reserved. Building the future, together.
          </p>
          {/* Add social links or other footer links if desired */}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
