import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';
import BookReadingModal from '../components/BookReadingModal';
import { useLocation } from 'react-router-dom';

const ReadingPage = () => {
    const [issuedBooks, setIssuedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchIssuedBooks = async () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                navigate('/login');
                return;
            }

            const parsedUser = JSON.parse(storedUser);
            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                const idToFetch = parsedUser.id || parsedUser._id;

                const response = await axios.get(`${baseUrl}/user/auth/profile/${idToFetch}`);
                const userData = response.data;

                console.log('ReadingPage: Fetched userData:', userData);

                // Derive issued books from orders
                const allItems = userData.orders
                    ?.filter(order => order.type !== 'subscription')
                    .flatMap(order => {
                        if (!order.items || !Array.isArray(order.items)) {
                            console.warn('ReadingPage: Order missing items:', order);
                            return [];
                        }
                        return order.items.map(item => ({
                            ...item,
                            orderDate: order.date,
                            // Ensure 14 days from order date
                            dueDate: new Date(new Date(order.date || Date.now()).getTime() + 14 * 24 * 60 * 60 * 1000)
                        }));
                    }) || [];

                console.log('ReadingPage: Processed Books:', allItems);

                // Sort by due date descending (latest first)
                allItems.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

                // Deduplicate
                const uniqueBooksMap = new Map();
                allItems.forEach(item => {
                    // Use bookId or title for robust deduplication of "Same Book"
                    const key = item.bookId || item.title || item._id;
                    if (!uniqueBooksMap.has(key)) {
                        uniqueBooksMap.set(key, item);
                    }
                });

                const uniqueBooks = Array.from(uniqueBooksMap.values());

                // Filter out returned books logic
                const activeReadingBooks = uniqueBooks.filter(item => !item.returned);

                // SHOW ALL BOOKS regardless of due date (User "My Library")
                setIssuedBooks(activeReadingBooks);

                // Redirect if no books are issued
                if (activeReadingBooks.length === 0) {
                    navigate('/');
                }

                // Check for bookId query param to open modal automatically
                const searchParams = new URLSearchParams(location.search);
                const bookIdFromUrl = searchParams.get('bookId');

                if (bookIdFromUrl && uniqueBooks.length > 0) {
                    const foundBook = uniqueBooks.find(b => (b.id === bookIdFromUrl || b.googleId === bookIdFromUrl));
                    if (foundBook) {
                        setSelectedBook(foundBook);
                    }
                }
            } catch (error) {
                console.error('Error fetching reading list:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchIssuedBooks();
    }, [navigate, location.search]);

    const handleRead = async (book, reset = false) => {
        // Open Modal immediately with current book data if not resetting from within modal
        if (!reset) {
            const currentBook = book;
            setSelectedBook(currentBook);
        }

        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const parsedUser = JSON.parse(storedUser);

            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

            // Call API - This now returns the updated progress
            console.log(`[DEBUG] sending read update for ${book.id || book.googleId}, reset: ${reset}`);
            const response = await axios.put(`${baseUrl}/user/auth/read/${parsedUser.id || parsedUser._id}`, {
                bookId: book.id || book.googleId || book._id,
                reset: reset
            });

            console.log('[DEBUG] API Response:', response.data);

            const { progress, hasStarted } = response.data;

            // Update local state with new progress from backend
            // Use functional state update to ensure we have latest `issuedBooks`
            setIssuedBooks(prevBooks => {
                const updatedBooks = prevBooks.map(b => {
                    // Robust matching: Check all possible ID fields
                    const isMatch = (b.id && (b.id === book.id || b.id === book.googleId)) ||
                        (b.googleId && (b.googleId === book.googleId || b.googleId === book.id)) ||
                        (b._id && (b._id === book._id || b._id === book.id));

                    if (isMatch) {
                        return { ...b, hasStarted: true, progress: progress };
                    }
                    return b;
                });

                // Update the currently open modal's book data too if it matches
                // We do this inside the effect of the state change or just strictly here
                // Note: updating selectedBook separately is fine
                return updatedBooks;
            });

            // Update selectedBook separately to ensure Modal gets new props
            setSelectedBook(prev => {
                if (prev) {
                    const isMatch = (prev.id && (prev.id === book.id || prev.id === book.googleId)) ||
                        (prev.googleId && (prev.googleId === book.googleId || prev.googleId === book.id)) ||
                        (prev._id && (prev._id === book._id || prev._id === book.id));
                    if (isMatch) {
                        return { ...prev, hasStarted: true, progress: progress };
                    }
                }
                return prev;
            });

            // Dispatch event for other listeners
            window.dispatchEvent(new Event('storage'));

        } catch (error) {
            console.error('Error updating read count:', error);
        }
    };

    const [brokenImageIds, setBrokenImageIds] = useState(new Set());

    const handleImageError = (id) => {
        setBrokenImageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    if (loading) return (
        <div className="min-h-screen pt-28 flex justify-center items-start bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8 animate-in slide-in-from-bottom duration-500">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Reading List</span>
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Access your digital library, track your progress, and continue your reading journey.
                    </p>
                </div>

                {issuedBooks.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
                        <BookOpen size={64} className="mx-auto text-gray-200 mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Books Issued</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">You haven't issued any books yet. Browse our catalog to find your next read.</p>
                        <button
                            onClick={() => navigate('/catalog')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200"
                        >
                            Browse Catalog
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {issuedBooks.map((book, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
                                <div className="flex gap-5">
                                    <div className="w-24 h-36 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                                        {book.image && !brokenImageIds.has(book.id || book.googleId || book._id) ? (
                                            <img
                                                src={book.image}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                                onError={() => handleImageError(book.id || book.googleId || book._id)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                <BookOpen size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                            {book.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-3">{book.author || 'Unknown Author'}</p>

                                        <div className="mt-auto">
                                            <div className="flex flex-col gap-1 text-xs font-medium text-gray-500 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-gray-400" />
                                                    Issue: <span className="text-gray-700">{new Date(book.orderDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-amber-600">
                                                    <Clock size={12} />
                                                    Due: {new Date(book.dueDate).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleRead(book)}
                                                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${book.hasStarted
                                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30'
                                                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30'
                                                    }`}
                                            >
                                                <BookOpen size={16} />
                                                {book.hasStarted ? 'Continue Reading' : 'Read Book'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Reading Modal */}
            {selectedBook && (
                <BookReadingModal
                    book={selectedBook}
                    onClose={() => {
                        setSelectedBook(null);
                        // Clear param from URL without reload
                        navigate('/reading', { replace: true });
                    }}
                    onUpdate={(book, reset) => handleRead(book, reset)}
                />
            )}
        </div>
    );
};

export default ReadingPage;
