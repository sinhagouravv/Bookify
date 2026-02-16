import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, BookOpen, Clock, Calendar, User, AlignLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

const BookReadingModal = ({ book, onClose, onUpdate }) => {
    const [fullBook, setFullBook] = useState(book);
    const [loadingDesc, setLoadingDesc] = useState(false);
    const [showCompletionMsg, setShowCompletionMsg] = useState(false);

    // Effect for checking completion (Confetti)
    useEffect(() => {
        if (parseInt(fullBook.progress) >= 100) {
            // Trigger confetti if not already shown this session
            if (!showCompletionMsg) {
                setShowCompletionMsg(true);
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });

                // Hide message after 4 seconds
                const timer = setTimeout(() => {
                    setShowCompletionMsg(false);
                }, 4000);

                return () => clearTimeout(timer);
            }
        }
    }, [fullBook.progress]);

    // Handle Read Again (Reset)
    const handleReadAgain = async () => {
        try {
            if (onUpdate) {
                await onUpdate(fullBook, true); // true for reset
                onClose();
            } else {
                console.warn("onUpdate prop missing, cannot reset");
                onClose();
            }
        } catch (e) {
            console.error("Failed to reset book", e);
            onClose();
        }
    };

    // Effect for fetching book details
    useEffect(() => {
        const fetchBookDetails = async () => {
            // If description is missing or short placeholder, try to fetch full details
            if (!book.description || book.description.length < 50) {
                setLoadingDesc(true);
                try {
                    const API_URL = import.meta.env.VITE_API_URL;
                    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                    // Use standard book ID logic
                    const bookId = book.id || book._id || book.bookId;
                    if (!bookId) return;

                    const response = await axios.get(`${baseUrl}/books/${bookId}`);
                    if (response.data) {
                        setFullBook(prev => ({
                            ...prev,
                            description: response.data.description || prev.description,
                            category: response.data.category || prev.category
                        }));
                    }
                } catch (error) {
                    // Silent fail, keep existing data
                    // console.log("Could not fetch extra details for popup");
                } finally {
                    setLoadingDesc(false);
                }
            }
        };

        if (book) {
            setFullBook(book); // Reset to prop
            // Check if we need to fetch
            fetchBookDetails();
        }
    }, [book]);

    if (!book) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-gray-500 hover:text-gray-900 rounded-full transition-colors z-10 backdrop-blur-sm"
                >
                    <X size={24} />
                </button>

                {/* Left Side - Image */}
                <div className="w-full md:w-2/5 bg-gray-100 relative min-h-[300px] md:min-h-full">
                    {fullBook.image ? (
                        <img
                            src={fullBook.image}
                            alt={fullBook.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <BookOpen size={64} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden"></div>
                </div>

                {/* Right Side - Content */}
                <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col overflow-y-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-3">
                            <span className="px-3 py-1 bg-indigo-50 rounded-full">
                                {fullBook.category || 'General'}
                            </span>
                            {fullBook.hasStarted && (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-1">
                                    <Clock size={12} /> {fullBook.progress > 0 ? `${fullBook.progress}% Read` : 'In Progress'}
                                </span>
                            )}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                            {fullBook.title}
                        </h2>
                        <p className="text-lg text-gray-500 font-medium flex items-center gap-2">
                            <User size={18} />
                            {fullBook.author || 'Unknown Author'}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {fullBook.hasStarted && (
                        <div className="mb-8">
                            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                <span>Reading Progress</span>
                                <span>{fullBook.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${fullBook.progress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Calendar size={12} /> Issued On
                            </div>
                            <div className="font-bold text-gray-900">
                                {new Date(fullBook.orderDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock size={12} /> Due Date
                            </div>
                            <div className={`font-bold ${new Date(fullBook.dueDate) < new Date() ? 'text-red-500' : 'text-gray-900'}`}>
                                {new Date(fullBook.dueDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-indigo text-gray-600 mb-8 flex-1">
                        <h3 className="text-gray-900 font-bold text-lg mb-2 flex items-center gap-2">
                            <AlignLeft size={20} className="text-gray-400" /> Description
                        </h3>
                        {loadingDesc ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                            </div>
                        ) : (
                            <p className="leading-relaxed">
                                {fullBook.description || "No description available for this book. Dive in to discover the story yourself!"}
                            </p>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-100 relative">
                        {showCompletionMsg && (
                            <div className="absolute -top-16 left-0 right-0 bg-green-500 text-white text-center py-2 rounded-lg font-bold animate-bounce shadow-lg z-20">
                                🎉 You have completed the {fullBook.title} book!
                            </div>
                        )}

                        {parseInt(fullBook.progress) >= 100 ? (
                            <button
                                onClick={handleReadAgain}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-1 flex items-center justify-center gap-3"
                            >
                                <BookOpen size={24} />
                                Read Again
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    onClose();
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1 flex items-center justify-center gap-3"
                            >
                                <BookOpen size={24} />
                                {fullBook.hasStarted ? 'Continue Reading' : 'Start Reading'}
                            </button>
                        )}

                        <p className="text-center text-xs text-gray-400 mt-3">
                            {parseInt(fullBook.progress) >= 100 ? "Start a fresh journey with this book." : "Clicking this will update your progress by 5%."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookReadingModal;
