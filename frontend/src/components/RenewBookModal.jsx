import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Clock, AlertCircle, RefreshCw, CheckCircle, X, Calendar } from 'lucide-react';


const loadScript = (src) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const RenewBookModal = ({ isOpen, onClose, user, books = [], onRenewSuccess }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            loadScript('https://checkout.razorpay.com/v1/checkout.js');
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const [renewSuccess, setRenewSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [renewedBookIds, setRenewedBookIds] = useState(new Set());

    const displayBooks = [...books]
        .filter(b => !renewedBookIds.has(b.id || b.googleId || b._id))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const handleRenew = async (book) => {
        const renewalFee = 2; // ₹2
        const membership = user.membership || 'regular';
        const durationDays = {
            'basic': 7,
            'premium': 15,
            'elite': 30,
            'regular': 7
        }[membership] || 7;

        // Confirm
        // We can just rely on payment modal as confirmation, or keep a simple confirm.
        // User requested "popup should come up".
        // Let's call create-order first.

        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            const userId = user.id || user._id;

            // 1. Load Razorpay
            const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // 2. Create Order
            const orderPayload = { amount: renewalFee }; // ₹2
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
                description: `Renew Book: ${book.title}`,
                order_id: orderId,
                handler: async function (response) {
                    // Payment Successful -> Call Renew
                    try {
                        const verifyPayload = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        };
                        // Verify payment backend check (optional but recommended)
                        // If backend verify succeeds, we proceed.
                        // For simplicity, we can trust the success callback for now and let the renew endpoint handle business logic.
                        // But verifying payment is better.
                        // Let's call renew endpoint directly for now as per plan, assuming payment success is enough trust for this feature or create verify endpoint.
                        // Actually, backend payment controller has verify-payment.

                        await axios.post(`${baseUrl}/payment/verify-payment`, verifyPayload);

                        // Call Renew
                        await axios.put(`${baseUrl}/user/auth/renew/${userId}`, {
                            bookId: book.id || book.googleId || book._id
                        });

                        setRenewSuccess(`Successfully renewed "${book.title}" (+${durationDays} days)`);

                        setRenewedBookIds(prev => {
                            const newSet = new Set(prev);
                            newSet.add(book.id || book.googleId || book._id);
                            return newSet;
                        });

                        // Trigger event for Navbar to update 'Reading' link visibility immediately
                        window.dispatchEvent(new Event('booksUpdated'));

                        if (onRenewSuccess) onRenewSuccess();
                        setTimeout(() => setRenewSuccess(null), 3000);

                    } catch (err) {
                        console.error("Renewal Error after payment:", err);
                        setError("Payment successful but renewal failed. Contact support.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email
                },
                theme: {
                    color: "#4F46E5"
                },
                modal: {
                    ondismiss: function () {
                        // alert('Renewal cancelled');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error('Error initiating renewal:', error);
            setError(error.response?.data?.message || 'Failed to initiate renewal. Please try again.');
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
                        <h2 className="text-xl font-bold text-center text-gray-900">RENEW BOOK</h2>
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
                    {renewSuccess && (
                        <div className="mb-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle size={20} />
                            <span>{renewSuccess}</span>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Books to Renew</h3>
                            <p className="text-gray-500 text-sm">You don't have any books eligible for renewal.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayBooks.map((book) => {
                                const isOverdue = new Date(book.dueDate) < new Date();

                                const membership = user.membership || 'regular';
                                const durationDays = {
                                    'basic': 7,
                                    'premium': 15,
                                    'elite': 30,
                                    'regular': 7
                                }[membership] || 7;

                                const orderDate = new Date(book.orderDate);
                                const daysHeld = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
                                const isEligible = daysHeld >= 5;
                                const daysRemaining = Math.max(0, Math.ceil(5 - daysHeld));

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
                                                Expires: {new Date(book.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center sm:items-end gap-2 min-w-[100px]">
                                            <button
                                                onClick={() => handleRenew(book)}
                                                disabled={!isEligible}
                                                className={`${isEligible ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 w-full`}
                                                title={!isEligible ? `Available in ${daysRemaining} days (min 5 days required)` : ''}
                                            >
                                                <RefreshCw size={12} className={!isEligible ? 'opacity-50' : ''} />
                                                {isEligible ? `Renew (₹2)` : `Wait ${daysRemaining}d`}
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

export default RenewBookModal;
