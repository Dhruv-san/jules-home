import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineUsers, HiOutlineChatAlt2, HiOutlineNewspaper } from 'react-icons/hi';

// Feature item with inline styles for fallback if CSS fails
const FeatureItem: React.FC<{ icon: React.ReactElement; title: string; description: string }> = ({ icon, title, description }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 28, textAlign: 'center', background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)', transition: 'box-shadow 0.3s', minHeight: 260, margin: 4
  }}>
    <div style={{ padding: 18, background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', color: '#fff', borderRadius: '50%', marginBottom: 18, display: 'inline-block' }}>
      {React.cloneElement(icon, { style: { width: 36, height: 36 } })}
    </div>
    <h3 style={{ marginBottom: 8, fontSize: 22, fontWeight: 600, color: '#1e293b' }}>{title}</h3>
    <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>{description}</p>
  </div>
);


const LandingPage: React.FC = () => {


  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Navigation */}
      <nav style={{
        padding: '1.2rem 0',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: 32, fontWeight: 700, color: '#f43f5e', textDecoration: 'none', letterSpacing: -1 }}>CoFound</Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/login" style={{ padding: '8px 18px', fontSize: 15, fontWeight: 500, color: '#334155', background: 'none', border: 'none', borderRadius: 7, textDecoration: 'none', transition: 'color 0.2s' }}>Log In</Link>
            <Link to="/signup" style={{ padding: '8px 18px', fontSize: 15, fontWeight: 500, color: '#fff', background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', borderRadius: 7, textDecoration: 'none', boxShadow: '0 2px 8px rgba(244,63,94,0.10)', transition: 'background 0.2s' }}>Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        paddingTop: 120, paddingBottom: 64, textAlign: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#1e293b', marginBottom: 24, lineHeight: 1.1, letterSpacing: -1 }}>
            Find Your <span style={{ color: '#f43f5e' }}>Perfect Co-Founder</span>.
          </h1>
          <p style={{ maxWidth: 520, margin: '0 auto', fontSize: 20, color: '#64748b', marginBottom: 40, lineHeight: 1.6 }}>
            Connect with driven entrepreneurs, share your vision, and build the next big thing, together. Stop searching, start building.
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            <Link to="/signup" style={{ padding: '16px 40px', fontSize: 20, fontWeight: 600, color: '#fff', background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', borderRadius: 12, boxShadow: '0 4px 24px 0 rgba(244,63,94,0.10)', textDecoration: 'none', transition: 'background 0.2s, transform 0.1s', outline: 'none', display: 'inline-block' }}>Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" style={{ padding: '64px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Why Choose CoFound?</h2>
            <p style={{ fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
              We provide the tools and community to help you find the ideal partner to launch your startup.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
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
      <section style={{ padding: '64px 0', background: 'linear-gradient(90deg, #f43f5e 0%, #f59e42 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Ready to Build Your Dream Team?</h2>
          <p style={{ maxWidth: 520, margin: '0 auto', fontSize: 20, opacity: 0.93, marginBottom: 40 }}>
            Join thousands of entrepreneurs who have found their co-founders on CoFound. Your next partner is just a swipe away.
          </p>
          <Link to="/signup" style={{ padding: '18px 48px', fontSize: 22, fontWeight: 700, color: '#f43f5e', background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)', textDecoration: 'none', transition: 'background 0.2s, transform 0.1s', display: 'inline-block' }}>
            Find Your Co-Founder Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '36px 0', textAlign: 'center', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontSize: 15, color: '#64748b' }}>
            &copy; {new Date().getFullYear()} CoFound. All rights reserved. Building the future, together.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
