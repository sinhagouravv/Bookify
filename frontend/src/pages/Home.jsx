import { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ArrowRight, Star, TrendingUp, Book } from 'lucide-react';
import About from './About';
import Catalog from './Catalog';
import ReadingSection from '../components/ReadingSection';
import Pricing from './Pricing';
import Reviews from './Reviews';
import Contact from './Contact';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const location = useLocation();

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const navigate = useNavigate();

    useLayoutEffect(() => {
        // Check for returning from explore flag or explicit target
        const targetId = location.state?.targetId || (sessionStorage.getItem('returningFromExplore') ? 'catalog' : null);

        if (targetId) {
            sessionStorage.removeItem('returningFromExplore'); // Clear flag

            // Retry mechanism to find element if not immediately available
            let attempts = 0;
            const maxAttempts = 10;

            const attemptScroll = () => {
                const element = document.getElementById(targetId);
                if (element) {
                    const behavior = location.state?.targetId ? 'smooth' : 'instant';
                    element.scrollIntoView({ behavior });
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(attemptScroll, 100);
                }
            };

            // Start attempts
            setTimeout(attemptScroll, 100);
        } else {
            window.scrollTo(0, 0); // Scroll to top if no target
        }
    }, [location]);

    useEffect(() => {
        if (location.state?.upgraded) {
            setShowUpgradeModal(true);

            // Fire confetti
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);

            // Clear state so it doesn't fire again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
        <div className="bg-gray-50/50">
            {/* Hero Section */}
            <div id="home" className="scroll-mt-14 pt-32 pb-24 px-6 relative overflow-hidden min-h-screen flex flex-col justify-center bg-white">
                {/* Flowing Gradient Wave SVG */}
                <div className="absolute inset-0 pointer-events-none">
                    <svg className="absolute w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M1440,400 Q1240,200 940,300 T640,390 Q440,420 240,300 T0,290 L0,800 L1440,800 Z"
                            fill="url(#waveGradient)"
                            opacity="0.6"
                            className="animate-pulse"
                            style={{ animationDuration: '12s', animationDelay: '2s' }}
                        />
                        <path
                            d="M0,400 Q200,200 500,300 T800,390 Q1000,420 1200, 300 T1440 250 L1440,800 L0,800 Z"
                            fill="url(#waveGradient)"
                            className="animate-pulse"
                            style={{ animationDuration: '8s' }}
                        />
                        <path
                            d="M0,480 Q200,280 500,380 T800,470 Q1000,500 1200,380 T1440,280 L1440,800 L0,800 Z"
                            fill="url(#waveGradient)"
                            opacity="0.5"
                            className="animate-pulse"
                            style={{ animationDuration: '10s', animationDelay: '1s' }}
                        />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h1 className="text-4xl md:text-7xl font-bold text-gray-900 leading-[1.15] mb-6">
                            Discover your next adventure,
                            <br />
                            <span className="italic font-serif font-normal">with our curated collection</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Experience the future of library management with Bookifyyy. Seamlessly browse, borrow, and track your reading journey in one premium interface.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' })} className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-gray-900/20 hover:-translate-y-1 flex items-center justify-center gap-2">
                                Browse Collection <ArrowRight size={18} />
                            </button>
                            <button onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-3.5 rounded-xl font-semibold border border-gray-300 transition-all hover:shadow-md flex items-center justify-center gap-2">
                                <Book size={18} /> Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <About />
            <Catalog />
            {/* Reading Section - Only for paid members */}
            {(() => {
                const user = JSON.parse(localStorage.getItem('user'));
                return (user && user.membership !== 'regular') ? <ReadingSection /> : null;
            })()}

            {/* Show Pricing if user is NOT logged in OR is a regular member */}
            {(() => {
                const user = JSON.parse(localStorage.getItem('user'));
                return (!user || user.membership === 'regular') ? <Pricing /> : null;
            })()}
            <Reviews />
            <Contact />


            {/* Upgrade Success Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 animate-bounce">
                            <Star size={40} fill="currentColor" />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Congratulations! 🎉</h2>
                        <p className="text-gray-600 mb-8 text-lg">
                            You are now a <span className="font-bold text-indigo-600">{location.state?.plan || 'Premium'}</span> member.
                            Enjoy unlimited access and exclusive benefits.
                        </p>

                        <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            Continue Reading
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
