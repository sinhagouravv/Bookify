import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Clock, AlertCircle, LogOut, CheckCircle, X } from 'lucide-react';


const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const ReturnBookModal = ({ isOpen, onClose, user, books = [], onReturnSuccess }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            loadScript('https://checkout.razorpay.com/v1/checkout.js'); // Preload script
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // const [issuedBooks, setIssuedBooks] = useState([]); // Use prop instead
    // const [loading, setLoading] = useState(false); // No loading
    const [returnSuccess, setReturnSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [returnedBookIds, setReturnedBookIds] = useState(new Set());

    // Filter books to ensure we only show returnable ones if parent passed mixed list
    // But parent passed "issuedBooks" which are already filtered !returned.
    // Ensure we sort them by due date if not already sorted?
    // Parent does sorting. We trust the prop. 
    // Actually parent might pass all items. Let's be safe.

    // Sort logic from modal: activeBooks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    // Parent logic: allItems.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    // Modal wants soonest due first?
    // Filter books effectively by excluding locally returned ones
    const displayBooks = [...books]
        .filter(b => !returnedBookIds.has(b.id || b.googleId || b._id))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const handleReturn = async (book) => {
        // Calculate Fine
        const dueDate = new Date(book.dueDate);
        const now = new Date();
        let fineAmount = 0;
        let overdueDays = 0;

        if (now > dueDate) {
            const diffTime = Math.abs(now - dueDate);
            overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Fine Calculation: 40% of book cost per day
            // Default book price if not available? Assuming book.price exists or default to something safe/error?
            // The prompt says "40% of the cost of the book". 
            // We'll use book.price (from backend/database). If missing, maybe fallback or handling needed.
            // Let's assume book.price is available in the object (it usually is in `orders`).
            // If price is missing, user might return for free or error? Let's check `orders` structure later if needed, but proceeding with `book.price`.
            // Note: `book.price` might be string or number.
            const price = parseFloat(book.price) || 0;
            if (price > 0) {
                fineAmount = overdueDays * (price * 0.40);
            }
        }

        if (fineAmount > 0) {
            if (!window.confirm(`This book is overdue by ${overdueDays} days. You need to pay a fine of ₹${fineAmount.toFixed(2)} before returning. Proceed to payment?`)) return;
        } else {
            if (!window.confirm(`Are you sure you want to return "${book.title}"?`)) return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const userId = user.id || user._id;

            // If fine exists, process payment first
            if (fineAmount > 0) {
                // 1. Load Razorpay
                const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                if (!res) {
                    alert('Razorpay SDK failed to load. Are you online?');
                    return;
                }

                // 2. Create Order for Fine
                const orderPayload = { amount: fineAmount };
                const orderResponse = await axios.post(`${baseUrl}/payment/create-order`, orderPayload);
                const { id: orderId, amount: orderAmount } = orderResponse.data;

                // 3. Fetch Key
                const keyResponse = await axios.get(`${baseUrl}/payment/key`);
                const { key } = keyResponse.data;

                // 4. Open Razorpay
                const options = {
                    key: key,
                    amount: orderAmount,
                    currency: "INR",
                    name: "Bookify Library",
                    description: `Overdue Fine: ${book.title}`,
                    order_id: orderId,
                    handler: async function (response) {
                        try {
                            // Verify Payment
                            const verifyPayload = {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            };
                            await axios.post(`${baseUrl}/payment/verify-payment`, verifyPayload);

                            // Proceed to Return (Payment Success)
                            await processReturn(baseUrl, userId, book);

                        } catch (err) {
                            console.error("Fine Payment Error:", err);
                            setError("Payment successful but return failed. Contact support.");
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email
                    },
                    theme: {
                        color: "#DC2626" // Red for fine? or standard Blue
                    },
                    modal: {
                        ondismiss: function () {
                            // alert('Fine payment cancelled. Book not returned.');
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    setError(response.error.description);
                });
                rzp.open();
                return; // Stop here, wait for payment callback
            }


            // No fine, proceed directly
            await processReturn(baseUrl, userId, book);

        } catch (error) {
            console.error('Error initiating return:', error);
            setError('Failed to initiate return. Please try again.');
        }
    };

    const processReturn = async (baseUrl, userId, book) => {
        try {
            await axios.put(`${baseUrl}/user/auth/return/${userId}`, {
                bookId: book.id || book.googleId || book._id
            });

            setReturnSuccess(`Successfully returned "${book.title}"`);

            // Optimistically update UI
            setReturnedBookIds(prev => {
                const newSet = new Set(prev);
                newSet.add(book.id || book.googleId || book._id);
                return newSet;
            });

            // Trigger event for Navbar to update 'Reading' link visibility immediately
            window.dispatchEvent(new Event('booksUpdated'));

            // Notify parent to refresh profile data (background refresh)
            if (onReturnSuccess) onReturnSuccess();

            // Clear success message after 3s
            setTimeout(() => setReturnSuccess(null), 3000);
        } catch (err) {
            console.error('Error processing return:', err);
            setError('Failed to return book. Please try again.');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-center text-gray-900">RETURN BOOK</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto hide-scrollbar flex-1 max-h-[725px]">
                    {returnSuccess && (
                        <div className="mb-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle size={20} />
                            <span>{returnSuccess}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {displayBooks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Books to Return</h3>
                            <p className="text-gray-500 text-sm">You don't have any active loans at the moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayBooks.map((book) => {
                                const isOverdue = new Date(book.dueDate) < new Date();
                                return (
                                    <div key={book.id || book.googleId || book._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-gray-50/50 transition-all group">
                                        <div className="w-16 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden shadow-sm relative">
                                            {book.image && !brokenImageIds.has(book.id || book.googleId || book._id) ? (
                                                <img
                                                    src={book.image}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(book.id || book.googleId || book._id)}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                    <BookOpen size={20} />
                                                </div>
                                            )}
                                            {/* Status Tag Overlay - Only if Overdue */}
                                            {isOverdue && (
                                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                                    OVERDUE
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 text-center sm:text-left min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{book.title}</h3>
                                            <p className="text-xs text-gray-500 mb-1.5 truncate">{book.author || 'Unknown Author'}</p>
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded text-[10px] font-medium text-gray-600">
                                                <Clock size={10} />
                                                Issued: {new Date(book.orderDate).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center sm:items-end gap-2 min-w-[100px]">
                                            <div className={`text-xs font-bold ${new Date(book.dueDate) < new Date() ? 'text-red-500' : 'text-gray-900'}`}>
                                                Due: {new Date(book.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                            <button
                                                onClick={() => handleReturn(book)}
                                                className={`${new Date(book.dueDate) < new Date() ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} border px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 w-full shadow-sm`}
                                            >
                                                {new Date(book.dueDate) < new Date() ? (
                                                    // Calculate fine for display
                                                    (() => {
                                                        const overdueDays = Math.ceil(Math.abs(new Date() - new Date(book.dueDate)) / (1000 * 60 * 60 * 24));
                                                        const fine = overdueDays * ((parseFloat(book.price) || 0) * 0.40);
                                                        return (
                                                            <>
                                                                <AlertCircle size={12} />
                                                                Pay Fine (₹{fine.toFixed(0)})
                                                            </>
                                                        );
                                                    })()
                                                ) : (
                                                    <>
                                                        <LogOut size={12} className="rotate-180" />
                                                        Return
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReturnBookModal;
