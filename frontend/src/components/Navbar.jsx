import { ShoppingBag, ShoppingCart, Menu, X, Search, User, LogOut, ChevronDown, Award, Star, BookOpen, CreditCard, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            return null;
        }
    });
    const [hasIssuedBooks, setHasIssuedBooks] = useState(false);

    const [cartCount, setCartCount] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const currentUser = JSON.parse(storedUser);
                const cartKey = `cart_${currentUser.email}`;
                const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                return cart.length;
            }
        } catch (e) {
            // ignore error
        }
        return 0;
    });

    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const checkIssuedBooks = async () => {
            if (!user || (!user.id && !user._id)) {
                setHasIssuedBooks(false);
                return;
            }

            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                const idToFetch = user.id || user._id;
                const response = await fetch(`${baseUrl}/user/auth/profile/${idToFetch}`);

                if (response.ok) {
                    const userData = await response.json();
                    let hasBooks = false;
                    if (userData.orders) {
                        hasBooks = userData.orders.some(order =>
                            order.items && order.items.some(item => !item.returned)
                        );
                    }
                    setHasIssuedBooks(hasBooks);
                }
            } catch (error) {
                console.error('Error checking issued books:', error);
            }
        };

        checkIssuedBooks();

        // Listen for book updates (e.g. return/issue)
        const handleStorage = () => checkIssuedBooks();
        window.addEventListener('storage', handleStorage);
        // Custom event for immediate updates within the same tab
        window.addEventListener('booksUpdated', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('booksUpdated', handleStorage);
        };
    }, [user]);

    useEffect(() => {
        const checkUserAndCart = () => {
            const storedUser = localStorage.getItem('user');
            let currentUser = null;
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                setUser(currentUser);
            } else {
                setUser(null);
            }

            if (currentUser) {
                const cartKey = `cart_${currentUser.email}`;
                const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                setCartCount(cart.length);
            } else {
                setCartCount(0);
            }
        };

        // Initial check not needed, state is initialized lazily
        // But keeping it for updates is fine, or remove the explicit call
        // checkUserAndCart(); -> Removed to rely on initial state

        // Listen for custom event from Catalog
        window.addEventListener('cartUpdated', checkUserAndCart);
        // Also listen for storage events (e.g. if updated in another tab, though less critical)
        window.addEventListener('storage', checkUserAndCart);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            const sections = ['home', 'about', 'catalog', 'reading', 'pricing', 'reviews', 'contact'];
            const scrollPosition = window.scrollY + window.innerHeight / 2;

            let currentSection = 'home';

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element && element.offsetTop <= scrollPosition) {
                    currentSection = section;
                }
            }

            setActiveSection(currentSection);
        };

        // Check if we are on the /explore page
        if (location.pathname === '/explore') {
            setActiveSection('catalog');
            setScrolled(true); // Ensure background is solid on other pages
        } else {
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('cartUpdated', checkUserAndCart);
            window.removeEventListener('storage', checkUserAndCart);
        };
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setShowDropdown(false);
        window.location.reload(); // Refresh to clear any other state/reset view
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const navLinks = [
        { name: 'Home', id: 'home', path: '/' },
        { name: 'About', id: 'about', path: '/' },
        { name: 'Catalog', id: 'catalog', path: '/' },
        // Only show Reading if logged in AND has issued books
        ...(user && hasIssuedBooks ? [{ name: 'Reading', id: 'reading', path: '/' }] : []),
        // Show Pricing if user is NOT logged in OR is a regular member
        ...((!user || user.membership === 'regular') ? [{ name: 'Pricing', id: 'pricing', path: '/' }] : []),
        { name: 'Reviews', id: 'reviews', path: '/' },
        { name: 'Contact', id: 'contact', path: '/' },
    ];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4.5 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 py-3 shadow-sm' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto flex justify-between items-center relative">
                <button
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (location.pathname !== '/') {
                            navigate('/');
                        }
                    }}
                    className="flex items-center gap-2.5 text-xl font-bold text-gray-900 group outline-none"
                >
                    <img src="/logo.svg" alt="Bookify Logo" className="h-8 w-auto" />
                    {!user && <span className="tracking-tight">Bookify</span>}
                </button>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center bg-white/50 backdrop-blur-md border border-gray-200/50 rounded-full px-2 py-1.5 shadow-sm absolute left-1/2 transform -translate-x-1/2">
                    {navLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => {
                                if (link.path && link.path !== '/') {
                                    navigate(link.path);
                                } else {
                                    if (location.pathname !== '/') {
                                        navigate('/', { state: { targetId: link.id } });
                                    } else {
                                        const element = document.getElementById(link.id);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }
                                }
                            }}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-500 relative ${(activeSection === link.id && location.pathname === '/') || (location.pathname === link.path && link.path !== '/') || (link.id === 'reading' && location.pathname === '/reading') || (link.id === 'catalog' && location.pathname === '/explore')
                                ? 'text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                                }`}
                        >
                            {((activeSection === link.id && location.pathname === '/') || (location.pathname === link.path && link.path !== '/') || (link.id === 'reading' && location.pathname === '/reading') || (link.id === 'catalog' && location.pathname === '/explore')) && (
                                <span className="absolute inset-0 bg-gray-900 rounded-full -z-10 animate-in fade-in zoom-in duration-300"></span>
                            )}
                            {link.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {user && cartCount > 0 && (
                        <button
                            onClick={() => navigate('/cart')}
                            className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                            <ShoppingBag size={22} />
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                {cartCount}
                            </span>
                        </button>
                    )}
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/20">
                                    {getInitials(user.name)}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-45 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                                        <p className="text-sm font-bold text-gray-900 truncate mb-1">{user.name}</p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block
                                            ${user.membership === 'elite' ? 'bg-amber-100 text-amber-700' :
                                                user.membership === 'premium' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {user.membership || 'Basic'} Member
                                        </span>
                                    </div>

                                    <div className="py-1">
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                        >
                                            <User size={16} />
                                            Visit Profile
                                        </button>
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/profile?tab=issued'); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                        >
                                            <BookOpen size={16} />
                                            Issued Books
                                        </button>
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/profile?tab=history'); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut size={16} className="rotate-180" /> {/* Reusing Icon for History looks okay or Clock */}
                                            History
                                        </button>
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/profile?tab=due-date'); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                        >
                                            <BookOpen size={16} />
                                            Due Dates
                                        </button>
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/profile?tab=payments'); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                        >
                                            <CreditCard size={16} />
                                            Payments
                                        </button>
                                        <button
                                            onClick={() => { setShowDropdown(false); navigate('/profile?tab=notifications'); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                                        >
                                            <Bell size={16} />
                                            Notifications
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all transform hover:scale-105 hover:shadow-lg shadow-gray-900/20 active:scale-95 hidden md:flex items-center gap-2"
                        >
                            <User size={18} />
                            <span>Get Started</span>
                        </Link>
                    )}
                    <button
                        className="md:hidden text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl animate-in slide-in-from-top-5 duration-200 z-50">
                    <div className="p-4 space-y-2">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    if (link.path && link.path !== '/') {
                                        navigate(link.path);
                                    } else {
                                        if (location.pathname !== '/') {
                                            navigate('/', { state: { targetId: link.id } });
                                        } else {
                                            const element = document.getElementById(link.id);
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }
                                    }
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-colors flex items-center gap-3 ${activeSection === link.id
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {link.name}
                            </button>
                        ))}
                        {!user && (
                            <div className="pt-2 border-t border-gray-100 mt-2">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                                >
                                    <User size={18} />
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
