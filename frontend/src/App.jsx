import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import About from './pages/About';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AuthPage from './pages/AuthPage';
import FullCatalog from './pages/FullCatalog';
import CartPage from './pages/CartPage';

import ReadingPage from './pages/ReadingPage';
import ProfilePage from './pages/ProfilePage';
import PlaceholderPage from './pages/PlaceholderPage';


const Layout = () => {
  const location = useLocation();
  const showFooter = location.pathname !== '/cart' && location.pathname !== '/profile';
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the page was reloaded
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') {
      // Disable browser scroll restoration to prevent landing on Contact/Bottom
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      navigate('/', { replace: true });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/explore" element={<FullCatalog />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Placeholder Routes for Footer Links */}
          <Route path="/refund" element={<PlaceholderPage title="Refund Policy" />} />
          <Route path="/cookie" element={<PlaceholderPage title="Cookie Policy" />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<PlaceholderPage title="Careers" />} />
          <Route path="/blog" element={<PlaceholderPage title="Blog" />} />
          <Route path="/help" element={<PlaceholderPage title="Help Center" />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes (Standalone) */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        {/* Main Application Layout */}
        <Route path="*" element={<Layout />} />
      </Routes>
    </Router>
  );
}

export default App;
