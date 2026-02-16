import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, BookOpen, ShoppingBag, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const FullCatalog = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['All']);
    const [cart, setCart] = useState([]);
    const [issuedBookIds, setIssuedBookIds] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('popular'); // 'popular', 'price-low', 'price-high', 'newest'
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const BOOK_PRICE = 2; // Fixed price per book

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20); // Threshold to match navbar transition
        };

        window.addEventListener('scroll', handleScroll);

        // Check for category query param
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [location]);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                // Determine API base URL
                const API_URL = import.meta.env.VITE_API_URL;
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                const response = await axios.get(`${baseUrl}/books`);

                // Backend returns { books: [], ... }
                const bookList = response.data.books || [];

                // Ensure unique IDs
                const uniqueBooks = Array.from(new Map(bookList.map(book => [book.id, book])).values());
                setBooks(uniqueBooks);

                // Extract unique categories and sort them
                const uniqueCategories = ['All', ...[...new Set(bookList.map(book => book.category))].sort()];
                setCategories(uniqueCategories);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching books:', error);
                setLoading(false);
            }
        };

        fetchBooks();

        // Load cart from local storage
        const user = JSON.parse(localStorage.getItem('user'));
        const cartKey = user ? `cart_${user.email}` : 'cart';
        const savedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        setCart(savedCart);

        // Fetch issued books if user is logged in
        if (user && (user.id || user._id)) {
            const fetchIssuedBooks = async () => {
                try {
                    const API_URL = import.meta.env.VITE_API_URL;
                    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                    const idToFetch = user.id || user._id;
                    const response = await axios.get(`${baseUrl}/user/auth/profile/${idToFetch}`);
                    const userData = response.data;

                    const activeIds = new Set();
                    if (userData.orders) {
                        userData.orders.forEach(order => {
                            if (order.items) {
                                order.items.forEach(item => {
                                    if (!item.returned) {
                                        activeIds.add(item.googleId || item.id || (item._id ? item._id.toString() : null));
                                    }
                                });
                            }
                        });
                    }
                    setIssuedBookIds(activeIds);
                } catch (error) {
                    console.error('Error fetching issued books:', error);
                }
            };
            fetchIssuedBooks();
        }

        // Listen for cart updates
        const handleCartUpdate = () => {
            const updatedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
            setCart(updatedCart);
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const addToCart = (book) => {
        const user = JSON.parse(localStorage.getItem('user'));

        if (user && (!user.membership || user.membership === 'regular')) {
            alert('Please upgrade your plan to borrow books!');
            navigate('/', { state: { targetId: 'pricing' } });
            return;
        }

        const cartKey = user ? `cart_${user.email}` : 'cart';
        const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]');

        // check if book is already in cart
        if (!currentCart.some(item => item.id === book.id)) {
            const updatedCart = [...currentCart, { ...book, quantity: 1 }];
            localStorage.setItem(cartKey, JSON.stringify(updatedCart));
            setCart(updatedCart);

            // Dispatch event to update navbar cart count
            window.dispatchEvent(new Event('cartUpdated'));
        } else {
            navigate('/cart');
        }
    };

    const getColorIndex = (id) => {
        if (!id) return 0;
        if (typeof id === 'number') return id % 4;
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 4;
    };


    // Filter and Sort Logic
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        if (sortBy === 'price-low') return BOOK_PRICE - BOOK_PRICE; // Fixed price, so no change
        if (sortBy === 'price-high') return BOOK_PRICE - BOOK_PRICE;
        if (sortBy === 'newest') return new Date(b.publishedDate) - new Date(a.publishedDate);
        return a.category.localeCompare(b.category); // Default: Sort by category alphabetically
    });

    const BookCard = ({ book, index }) => {
        const [imgSrc, setImgSrc] = useState(book.image);
        const [hasError, setHasError] = useState(false);

        const handleImageError = () => {
            if (!hasError && book.image) {
                if (book.image.includes('zoom=0')) {
                    setImgSrc(book.image.replace('zoom=0', 'zoom=1'));
                } else if (!book.image.includes('zoom=')) {
                    setHasError(true);
                } else {
                    setHasError(true);
                }
            } else {
                setHasError(true);
            }
        };

        return (
            <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col h-full transform hover:-translate-y-1">
                <div className="relative mb-3 overflow-hidden rounded-lg aspect-[2/3] group-hover:shadow-md transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${index % 4 === 0 ? 'from-blue-50 to-indigo-50' :
                        index % 4 === 1 ? 'from-purple-50 to-pink-50' :
                            index % 4 === 2 ? 'from-amber-50 to-orange-50' :
                                'from-emerald-50 to-green-50'
                        } opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>

                    <div className={`w-full h-full relative z-10 ${getColorIndex(book.id) === 0 ? 'from-blue-100 to-indigo-100' :
                        getColorIndex(book.id) === 1 ? 'from-purple-100 to-pink-100' :
                            getColorIndex(book.id) === 2 ? 'from-amber-100 to-orange-100' :
                                'from-emerald-100 to-green-100'
                        } flex items-center justify-center`}>
                        {!hasError && imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={book.title}
                                className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-500"
                                onError={handleImageError}
                            />
                        ) : (
                            <BookOpen size={32} className="text-gray-900/10 group-hover:scale-110 transition-transform duration-500" />
                        )}
                    </div>

                    {book.quantity < 5 && book.quantity > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm animate-pulse z-20">
                            Only {book.quantity} left
                        </div>
                    )}
                </div>

                <div className="flex flex-col flex-grow">
                    <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors duration-300 min-h-[2.5rem] text-base">
                        {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mb-3 line-clamp-1">{book.author}</p>

                    <div className="mt-auto">
                        <div className="flex flex-col mb-3">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                {book.category}
                            </span>
                            <div className="flex justify-between items-center">
                                {book.available === 0 ? (
                                    <span className="text-red-500 font-bold text-sm">
                                        Out of Stock
                                    </span>
                                ) : (
                                    <span className="text-lg font-bold text-gray-900">₹{BOOK_PRICE}</span>
                                )}
                                <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                    <span className="text-xs font-bold">4.8</span>
                                </div>
                            </div>
                        </div>

                        {book.available === 0 ? (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const user = JSON.parse(localStorage.getItem('user'));
                                    if (!user || !user.email) {
                                        alert('Please login to subscribe to notifications');
                                        return;
                                    }
                                    try {
                                        // Debug alerts
                                        // alert('Debug: Clicked Notify Me');

                                        const API_URL = import.meta.env.VITE_API_URL;
                                        const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

                                        const targetUrl = `${baseUrl}/books/notify/${book.googleId || book.id}`;
                                        // alert(`Debug: Sending request to ${targetUrl}`);

                                        console.log('Sending notify request to:', targetUrl);

                                        await axios.post(targetUrl, {
                                            email: user.email,
                                            userId: user.id
                                        });
                                        alert('You will be notified when this book is back in stock!');
                                    } catch (error) {
                                        console.error('Notify error:', error);
                                        alert(error.response?.data?.message || 'Failed to subscribe to notifications');
                                    }
                                }}
                                className="w-full bg-indigo-50 text-indigo-600 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors text-sm"
                            >
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Notify Me
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const isIssued = issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id);
                                    if (isIssued) return;
                                    addToCart(book);
                                }}
                                disabled={issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id)}
                                title={issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id)}
                                className={`w-full py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm ${(issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id))
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : cart.some(item => item.id === book.id)
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-gray-900 text-white shadow-lg shadow-gray-200 hover:bg-indigo-600 hover:shadow-indigo-200 hover:-translate-y-0.5'
                                    }`}
                            >
                                {(issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id)) ? <BookOpen size={16} /> : <ShoppingBag size={16} />}
                                {(issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id)) ? 'Issued' : (cart.some(item => item.id === book.id) ? 'View' : 'Add to Cart')}
                            </button>
                        )}
                    </div>
                </div>
            </div >
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Browse Collection</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">Explore our extensive library of curated books for every taste and interest.</p>
                </div>

                {/* Search and Filters */}
                <div className={`transition-all duration-300 z-30 border p-4 mb-8 ${isScrolled
                    ? 'sticky top-20 bg-white/80 backdrop-blur-md shadow-sm border-gray-200/50 rounded-2xl'
                    : 'bg-white rounded-2xl shadow-sm border-gray-100 sticky top-24'
                    }`}>
                    <div className="flex flex-col-reverse md:flex-row gap-4 justify-between items-center">

                        {/* Categories (Left) */}
                        <div className="flex-1 w-full overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                            <div className="flex gap-2.5">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === category
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar (Right) */}
                        <div className="relative w-full md:w-72 flex-shrink-0">
                            <Search className="absolute left-3 rounded-full  top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search books..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50/50 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No books found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                            className="mt-4 text-indigo-600 font-medium hover:text-indigo-800"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredBooks.map((book, index) => (
                            <BookCard key={book.id} book={book} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FullCatalog;
