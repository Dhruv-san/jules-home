import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineUsers, HiOutlineChatAlt2, HiOutlineNewspaper } from 'react-icons/hi';
import { motion } from 'framer-motion';

// Feature item with animation and Tailwind styling
const FeatureItem: React.FC<{ icon: React.ReactElement; title: string; description: string }> = ({ icon, title, description }) => (
  <motion.div
    className="flex flex-col items-center p-7 text-center bg-white rounded-2xl shadow-lg min-h-[260px] m-1 hover:shadow-glow transition-shadow duration-300"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7, type: 'spring' }}
  >
    <div className="p-4 bg-gradient-to-r from-brand-main to-brand-dark text-white rounded-full mb-4 inline-block shadow-md animate-bounce">
      {React.cloneElement(icon, { className: 'w-9 h-9' })}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-slate-800">{title}</h3>
    <p className="text-slate-500 text-base leading-relaxed">{description}</p>
  </motion.div>
);


const LandingPage: React.FC = () => {


  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient font-inter">
      {/* Navigation */}
      <nav className="py-5 fixed top-0 left-0 right-0 z-40 bg-white/90 shadow-md backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold text-brand-main tracking-tight">CoFound</Link>
          <div className="flex gap-4">
            <Link to="/login" className="px-4 py-2 text-base font-medium text-slate-700 bg-none rounded-md hover:text-brand-main transition-colors">Log In</Link>
            <Link to="/signup" className="px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-brand-main to-brand-dark rounded-md shadow hover:from-brand-dark hover:to-brand-main transition-all">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-16 text-center bg-hero-gradient flex flex-col items-center justify-center flex-grow">
        <motion.div
          className="max-w-3xl mx-auto px-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: 'spring' }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
            Find Your <span className="text-brand-main animate-pulse">Perfect Co-Founder</span>.
          </h1>
          <p className="max-w-xl mx-auto text-xl text-slate-500 mb-10 leading-relaxed">
            Connect with driven entrepreneurs, share your vision, and build the next big thing, together. Stop searching, start building.
          </p>
          <motion.div
            className="flex flex-row justify-center items-center gap-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <Link to="/signup" className="px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-brand-main to-brand-dark rounded-xl shadow-glow hover:scale-105 transition-transform duration-200 outline-none inline-block animate-fade-in">
              Get Started Free
            </Link>
          </motion.div>
        </motion.div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">Why Choose CoFound?</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              We provide the tools and community to help you find the ideal partner to launch your startup.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section className="py-16 bg-cta-gradient text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-extrabold mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            Ready to Build Your Dream Team?
          </motion.h2>
          <motion.p
            className="max-w-xl mx-auto text-xl opacity-90 mb-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            Join thousands of entrepreneurs who have found their co-founders on CoFound. Your next partner is just a swipe away.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Link to="/signup" className="px-12 py-4 text-2xl font-bold text-brand-main bg-white rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 inline-block">
              Find Your Co-Founder Today
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-9 text-center bg-background-dark border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-base text-slate-500">
            &copy; {new Date().getFullYear()} CoFound. All rights reserved. Building the future, together.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
