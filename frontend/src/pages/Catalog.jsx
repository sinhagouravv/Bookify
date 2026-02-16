import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Catalog = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    const [issuedBookIds, setIssuedBookIds] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const loadCart = () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                setCartItems([]);
                return;
            }
            const cartKey = `cart_${user.email}`;
            const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
            setCartItems(cart);

            // Fetch issued books
            if (user && (user.id || user._id)) {
                const fetchIssuedBooks = async () => {
                    try {
                        const API_URL = import.meta.env.VITE_API_URL;
                        const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                        const idToFetch = user.id || user._id;
                        const response = await fetch(`${baseUrl}/user/auth/profile/${idToFetch}`);
                        const userData = await response.json();

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
        };
        loadCart();
        window.addEventListener('cartUpdated', loadCart);
        return () => window.removeEventListener('cartUpdated', loadCart);
    }, []);

    const addToCart = (book) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/login');
            return;
        }

        // Check for membership status
        // 'regular' is the default/basic plan with no borrowing rights yet
        if (!user.membership || user.membership === 'regular') {
            alert('Please upgrade your plan to borrow books!');
            navigate('/', { state: { targetId: 'pricing' } });
            return;
        }

        const cartKey = `cart_${user.email}`;
        const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        // Check if book is already in cart to avoid duplicates (optional but good UX)
        if (!currentCart.find(item => item.id === book.id)) {
            const updatedCart = [...currentCart, { ...book, quantity: 1 }];
            localStorage.setItem(cartKey, JSON.stringify(updatedCart));

            // Dispatch event for Navbar to update
            window.dispatchEvent(new Event('cartUpdated'));
            // alert(`${book.title} added to cart!`); // Optional: Remove alert if button change is enough feedback? User didn't ask to remove it, but button change is better feedback. I'll keep alert for now or maybe remove it for smoother flow. User said "it should show view cart". Button change is distinct. I'll remove alert to be modern.
        } else {
            // Already in cart - specific logic handled by button state, but good fallback
            navigate('/cart');
        }

    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const response = await fetch(`${baseUrl}/books?limit=10`);
            const data = await response.json();
            // Sort by category alphabetically
            // Backend returns { books: [], ... }
            const bookList = data.books || [];
            const sorted = bookList.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
            setBooks(sorted);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching books:', error);
            setLoading(false);
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

    const handleImageError = (bookId) => {
        setBooks(prevBooks => prevBooks.map(b =>
            b.id === bookId ? { ...b, image: null } : b
        ));
    };

    return (
        <div id="catalog" className="scroll-mt-8 min-h-screen flex flex-col justify-center py-10 px-6 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-center">
                <div className="flex justify-center mb-6">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 text-center">Featured Collection</h1>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse bg-white rounded-2xl h-64"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {books.map((book) => (
                            <div key={book.id} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col h-full">
                                <div className={`h-60 w-full rounded-lg mb-1.5 overflow-hidden relative bg-gradient-to-br ${getColorIndex(book.id) === 0 ? 'from-orange-100 to-amber-100' :
                                    getColorIndex(book.id) === 1 ? 'from-blue-100 to-cyan-100' :
                                        getColorIndex(book.id) === 2 ? 'from-purple-100 to-pink-100' :
                                            'from-emerald-100 to-green-100'
                                    } flex items-center justify-center`}>
                                    {book.image ? (
                                        <img
                                            src={book.image}
                                            alt={book.title}
                                            className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-500"
                                            onError={() => handleImageError(book.id)}
                                        />
                                    ) : (
                                        <BookOpen size={32} className="text-gray-900/10 group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                                </div>
                                <div className="flex-grow">
                                    <div className="mb-0.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wide truncate">{book.category}</div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-0.5 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{book.title}</h3>
                                    <p className="text-gray-500 text-xs truncate">{book.author}</p>
                                </div>
                                <div className="mt-1 pt- border-t border-gray-100 flex justify-between items-center">
                                    <span className={`text-[12px] font-semibold ${book.available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {book.available === 0 ? 'Out of stock' : `${book.available} left`}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (book.available === 0) {
                                                alert(`You will be notified when "${book.title}" is back in stock!`);
                                                return;
                                            }
                                            const isIssued = issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id);
                                            if (isIssued) return;

                                            if (cartItems.some(item => item.id === book.id)) {
                                                navigate('/cart');
                                            } else {
                                                addToCart(book);
                                            }
                                        }}
                                        disabled={false} // actually checking specifically for issued in styling to keep consistency with FullCatalog approach
                                        className={`text-[10px] font-bold px-3 py-1.5 rounded transition-colors ${book.available === 0
                                            ? 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                            : (issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id))
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                : cartItems.some(item => item.id === book.id)
                                                    ? 'text-white bg-green-600 hover:bg-green-700'
                                                    : 'text-gray-900 bg-gray-100 hover:text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                        title={(issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id))}
                                    >
                                        {book.available === 0 ? 'Notify Me' : (issuedBookIds.has(book.id) || issuedBookIds.has(book.googleId) || issuedBookIds.has(book._id)) ? 'Issued' : (cartItems.some(item => item.id === book.id) ? 'View' : 'Add')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-7 text-center">
                    <button
                        onClick={() => navigate('/explore')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
                    >
                        Explore More Categories
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Catalog;
