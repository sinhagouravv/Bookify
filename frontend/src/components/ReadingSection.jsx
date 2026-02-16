import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';

const ReadingSection = () => {
    const [issuedBooks, setIssuedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                setUser(null);
                setLoading(false);
            }
        };

        checkUser();
        window.addEventListener('storage', checkUser);
        return () => window.removeEventListener('storage', checkUser);
    }, []);

    useEffect(() => {
        const fetchIssuedBooks = async () => {
            if (!user) return;

            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                const idToFetch = user.id || user._id;

                const response = await axios.get(`${baseUrl}/user/auth/profile/${idToFetch}`);
                const userData = response.data;

                console.log('ReadingSection: Fetched userData:', userData);

                const allItems = userData.orders
                    ?.filter(order => order.type !== 'subscription')
                    .flatMap(order => {
                        if (!order.items || !Array.isArray(order.items)) {
                            console.warn('ReadingSection: Order missing items:', order);
                            return [];
                        }
                        return order.items.map(item => ({
                            ...item,
                            orderDate: order.date,
                            // Ensure 14 days from order date, fallback to now if missing
                            dueDate: new Date(new Date(order.date || Date.now()).getTime() + 14 * 24 * 60 * 60 * 1000)
                        }));
                    }) || [];

                console.log('ReadingSection: Processed Books:', allItems);

                // Filter for books that are NOT yet "returned" (i.e., due date is in future)
                // AND Deduplicate based on book ID (keep the latest one if repeated)

                // Sort by due date descending (latest first)
                allItems.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

                // Deduplicate
                const uniqueBooksMap = new Map();
                allItems.forEach(item => {
                    // Use item._id or item.bookId or item.title as key
                    const key = item._id || item.id || item.title;
                    if (!uniqueBooksMap.has(key)) {
                        uniqueBooksMap.set(key, item);
                    }
                });

                const uniqueBooks = Array.from(uniqueBooksMap.values());

                // Filter: Only show books where due date is > now (Active/Issued)
                // If user wants ALL books ever issued, remove the date filter. 
                // But context "Reading Section" implies active reading.
                // However, "all the books that are issue" might mean "currently holding".
                // If logic relies on date for "returned", then valid check is date > now.
                // If user says "no book available", maybe their books are overdue?
                // Let's widen the filter slightly or check if they have active books.

                // For now, adhere to "Active" check but ensure it works.
                // If the user just issued a book, date + 14 days > now.

                const activeBooks = uniqueBooks.filter(item => new Date(item.dueDate) > new Date() && !item.returned);

                setIssuedBooks(activeBooks);
            } catch (error) {
                console.error('Error fetching reading list:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchIssuedBooks();
        }
    }, [user]);

    const handleRead = async (book) => {
        const isStarted = book.hasStarted;
        const bookId = book.id || book.googleId;

        if (!isStarted) {
            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

                // Call API to mark as started BEFORE navigating
                await axios.put(`${baseUrl}/user/auth/read/${user.id || user._id}`, {
                    bookId: bookId
                });

                // Dispatch event to update profile if needed
                window.dispatchEvent(new Event('storage'));
            } catch (error) {
                console.error('Error updating read count:', error);
            }
        }

        // Navigate to Reading Page with bookId to trigger popup
        navigate(`/reading?bookId=${bookId}`);
    };

    const [brokenImageIds, setBrokenImageIds] = useState(new Set());

    const handleImageError = (id) => {
        setBrokenImageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    if (!user) return null; // Don't show section if not logged in

    return (
        <section id="reading" className="py-24 bg-white relative overflow-hidden px-6 ">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-50/50 skew-x-12 translate-x-32 z-0"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-12 text-center mt-11">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight animate-in slide-in-from-bottom duration-700">
                        Continue <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Reading</span>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : issuedBooks.length === 0 ? (
                    <div className="bg-gray-50 rounded-3xl p-12 text-center border border-gray-100">
                        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No active reads</h3>
                        <p className="text-gray-500 mb-6">Start your reading journey by exploring our catalog.</p>
                        <button
                            onClick={() => {
                                const catalogSection = document.getElementById('catalog');
                                if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                        >
                            Browse Catalog <ChevronRight size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {issuedBooks.slice(0, 9).map((book, idx) => (
                                <div key={idx} className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="flex gap-5">
                                        <div className="w-24 h-36 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300 relative">
                                            {book.image && !brokenImageIds.has(book._id || book.id || book.googleId) ? (
                                                <img
                                                    src={book.image}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(book._id || book.id || book.googleId)}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                    <BookOpen size={32} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-3">{book.author || 'Unknown'}</p>

                                            <div className="mt-auto pt-3 border-t border-gray-50">
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

                        {issuedBooks.length > 9 && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={() => navigate('/reading')}
                                    className="group bg-white text-gray-900 border border-gray-100 px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl hover:border-indigo-100 flex items-center justify-center gap-2 mx-auto"
                                >
                                    View All Books
                                    <ChevronRight size={18} className="group-hover:translate-x-1 text-indigo-600 transition-transform duration-300" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ReadingSection;
