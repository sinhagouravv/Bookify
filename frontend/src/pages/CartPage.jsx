import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Plus, Minus, Crown, Tag, Info } from 'lucide-react';
import axios from 'axios';
import useRazorpay from '../hooks/useRazorpay';
import { generateInvoice } from '../utils/invoiceGenerator';
import FooterPolicyModal from '../components/FooterPolicyModal';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [membership, setMembership] = useState('regular'); // 'regular', 'premium', 'elite'

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    // Footer Policy Modal State
    const [policyModal, setPolicyModal] = useState({ isOpen: false, type: 'terms' });

    const openPolicy = (type, e) => {
        if (e) e.preventDefault();
        setPolicyModal({ isOpen: true, type });
    };

    const isRazorpayLoaded = useRazorpay();

    const navigate = useNavigate();
    const BOOK_PRICE = 2; // Fixed price per book

    const [allBooks, setAllBooks] = useState([]);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL;
                const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
                const response = await axios.get(`${baseUrl}/books`);
                const bookList = response.data.books || [];
                // Ensure unique IDs
                const uniqueBooks = Array.from(new Map(bookList.map(book => [book.id, book])).values());
                setAllBooks(uniqueBooks);
            } catch (error) {
                console.error('Error fetching books:', error);
            }
        };
        fetchBooks();
    }, []);

    const handleExploreAddToCart = (book) => {
        const currentCart = [...cartItems];
        // check if book is already in cart (shouldn't be reachable ideally due to filter, but safe check)
        if (!currentCart.some(item => item.id === book.id)) {
            const updatedCart = [...currentCart, { ...book, quantity: 1 }];
            updateCart(updatedCart);
        }
    };

    // Filter books not in cart and ensure unique categories (max 15)
    const exploreBooks = useMemo(() => {
        const notInCart = allBooks.filter(book => !cartItems.some(item => item.id === book.id));
        const uniqueCategoryBooks = [];
        const seenCategories = new Set();

        for (const book of notInCart) {
            if (book.category && !seenCategories.has(book.category)) {
                uniqueCategoryBooks.push(book);
                seenCategories.add(book.category);
            }
            if (uniqueCategoryBooks.length >= 15) break;
        }
        return uniqueCategoryBooks;
    }, [allBooks, cartItems]);


    useEffect(() => {
        const loadCart = () => {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            // Set membership if available
            if (user && user.membership) {
                setMembership(user.membership);
            }

            const cartKey = user ? `cart_${user.email}` : 'cart';
            let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

            // Normalize cart to ensure quantity exists
            cart = cart.map(item => ({
                ...item,
                quantity: item.quantity || 1
            }));

            setCartItems(cart);
        };

        loadCart();

        const handleCartUpdate = () => loadCart();
        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const updateCart = (newCart) => {
        setCartItems(newCart);
        const user = JSON.parse(localStorage.getItem('user'));
        const cartKey = user ? `cart_${user.email}` : 'cart';
        localStorage.setItem(cartKey, JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const handleQuantityChange = async (id, change) => {
        const updatedCart = [...cartItems];
        const itemIndex = updatedCart.findIndex(item => item.id === id);

        if (itemIndex === -1) return;

        const item = updatedCart[itemIndex];
        const newQuantity = item.quantity + change;

        if (newQuantity < 1) {
            // Remove item if quantity goes below 1
            updateCart(updatedCart.filter(i => i.id !== id));
            return;
        }

        if (change > 0) {
            // Check stock limit
            if (item.available !== undefined && newQuantity > item.available) {
                alert(`Sorry, only ${item.available} copies available.`);
                return;
            }
        }

        updatedCart[itemIndex].quantity = newQuantity;
        updateCart(updatedCart);
    };

    const handleRemove = (id) => {
        updateCart(cartItems.filter(item => item.id !== id));
    };

    // Coupon Logic
    const handleApplyCoupon = (selectedCode) => {
        setCouponError('');
        const code = (selectedCode || couponCode).trim().toUpperCase();

        if (!code) return;

        // Helper to check usage count
        const getUsageCount = (coupon) => {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user || !user.orders) return 0;
            return user.orders.filter(order => order.coupon === coupon).length;
        };

        if (code === 'BOOKIFY10') {
            const usageCount = getUsageCount('BOOKIFY10');
            let limit = 3;
            if (membership === 'premium') limit = 6;
            if (membership === 'elite') limit = 10;

            if (usageCount >= limit) {
                setCouponError(`You have reached the limit of ${limit} uses for this coupon.`);
                setAppliedCoupon(null);
                return;
            }

            setAppliedCoupon({ code, type: 'percent', value: 10 });
            setCouponCode('');
        } else if (code === 'WELCOME50') {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (user && user.orders && user.orders.length > 0) {
                setCouponError('This coupon is valid only for your first order.');
                setAppliedCoupon(null);
                return;
            }

            setAppliedCoupon({ code, type: 'percent', value: 50 });
            setCouponCode('');
        } else if (code === 'SAVE15') {
            const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            if (totalItems < 3) {
                setCouponError('SAVE15 requires at least 3 books in your cart.');
                setAppliedCoupon(null);
                return;
            }
            setAppliedCoupon({ code, type: 'percent', value: 15 });
            setCouponCode('');
        } else if (code === 'SAVE20') {
            const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            if (totalItems < 5) {
                setCouponError('SAVE20 requires at least 5 books in your cart.');
                setAppliedCoupon(null);
                return;
            }
            setAppliedCoupon({ code, type: 'percent', value: 20 });
            setCouponCode('');
        } else if (code === 'SAVE25') {
            const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            if (totalItems < 10) {
                setCouponError('SAVE25 requires at least 10 books in your cart.');
                setAppliedCoupon(null);
                return;
            }
            setAppliedCoupon({ code, type: 'percent', value: 25 });
            setCouponCode('');
        } else if (code === 'FLAT10') {
            // Formerly FLAT30, now ₹10 for orders > ₹30
            const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            const currentSubtotal = totalItems * BOOK_PRICE;

            if (currentSubtotal < 30) {
                setCouponError('FLAT10 requires a minimum subtotal of ₹30');
                setAppliedCoupon(null);
                return;
            }

            setAppliedCoupon({ code, type: 'flat', value: 10 });
            setCouponCode('');
        } else {
            setCouponError('Invalid coupon code');
            setAppliedCoupon(null);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;
        if (!isRazorpayLoaded) {
            alert('Payment gateway is still loading. Please wait a moment.');
            return;
        }

        // Recalculate totals for checkout confirmation
        const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
        const subtotal = totalItems * BOOK_PRICE;
        const GST_RATE = 0.18;
        const gstAmount = subtotal * GST_RATE;
        const totalBeforeDiscount = subtotal + gstAmount;

        // Membership Discount Logic (Applied on Subtotal)
        let membershipDiscountRate = 0;
        if (membership === 'premium') membershipDiscountRate = 0.07;
        if (membership === 'elite') membershipDiscountRate = 0.15;

        const membershipDiscountAmount = subtotal * membershipDiscountRate;

        // Platform fee is technically 0/Free for everyone with this new logic
        // But we use the row to display the status/discount text
        const platformFee = 0;

        let currentTotal = totalBeforeDiscount - membershipDiscountAmount + platformFee;

        // Apply Coupon logic for checkout calculation matches render logic
        let couponDiscountAmount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'percent') {
                couponDiscountAmount = subtotal * (appliedCoupon.value / 100);
            } else if (appliedCoupon.type === 'flat') {
                couponDiscountAmount = appliedCoupon.value;
            }
        }

        const finalTotal = Math.max(0, currentTotal - couponDiscountAmount);

        // Determine API base URL
        const API_URL = import.meta.env.VITE_API_URL;
        const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user) {
            alert("Please login to checkout.");
            navigate('/login');
            return;
        }

        const confirmCheckout = window.confirm(`Proceed to payment of ₹${finalTotal.toFixed(2)}?`);

        if (confirmCheckout) {
            setLoading(true);
            try {
                // 1. Get Razorpay Key
                const { data: { key } } = await axios.get(`${baseUrl}/payment/key`);

                // 2. Create Order
                const { data: order } = await axios.post(`${baseUrl}/payment/create-order`, {
                    amount: finalTotal,
                    currency: 'INR',
                    userId: user._id || user.id, // Pass userId for limit check
                    items: cartItems // Pass items for limit check
                });

                // 3. Open Razorpay Modal
                const options = {
                    key,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'Bookify',
                    description: 'Book Purchase',
                    order_id: order.id,
                    handler: async function (response) {
                        try {
                            // 4. Verify Payment
                            const verifyRes = await axios.post(`${baseUrl}/payment/verify-payment`, {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verifyRes.data.success) {
                                // 5. Save Order in Backend
                                const payload = {
                                    items: cartItems.map(item => ({
                                        id: item.id,
                                        quantity: item.quantity,
                                        title: item.title,
                                        image: item.image,
                                        author: item.author
                                    })),
                                    userId: user._id || user.id,
                                    coupon: appliedCoupon ? appliedCoupon.code : null,
                                    finalAmount: finalTotal,
                                    paymentId: response.razorpay_payment_id,
                                    orderId: response.razorpay_order_id
                                };

                                const checkoutRes = await axios.post(`${baseUrl}/books/checkout`, payload);

                                if (checkoutRes.data.success) {
                                    alert('Payment Successful! Books reserved.');
                                    // Update local user orders
                                    const newOrder = {
                                        date: new Date(),
                                        total: finalTotal,
                                        items: payload.items,
                                        paymentId: response.razorpay_payment_id
                                    };
                                    const updatedUser = { ...user, orders: [...(user.orders || []), newOrder] };
                                    localStorage.setItem('user', JSON.stringify(updatedUser));
                                    // Trigger event for Navbar to update 'Reading' link visibility immediately
                                    window.dispatchEvent(new Event('booksUpdated'));

                                    updateCart([]);
                                    setAppliedCoupon(null);

                                    // Auto-generate Invoice
                                    const paymentData = {
                                        id: response.razorpay_payment_id,
                                        date: new Date(),
                                        amount: finalTotal,
                                        status: 'Completed',
                                        itemsCount: cartItems.length,
                                        items: cartItems.map(item => ({ title: item.title, quantity: item.quantity, price: BOOK_PRICE })), // Send unit price
                                        type: 'book',
                                        paymentMethod: 'Razorpay',
                                        orderId: response.razorpay_order_id,
                                        name: user.name,
                                        email: user.email,
                                        // Detailed Breakdown
                                        subtotal: subtotal,
                                        gst: gstAmount,
                                        platformFee: platformFee,
                                        membershipDiscount: membershipDiscountAmount,
                                        couponDiscount: couponDiscountAmount
                                    };
                                    generateInvoice(paymentData, user);

                                    navigate('/profile'); // Redirect to profile or home
                                }
                            }
                        } catch (err) {
                            console.error("Payment Verification/Checkout Failed:", err);
                            const errorMessage = err.response?.data?.message || err.response?.data?.error || "Payment verification failed. Please contact support if amount deducted.";
                            alert(errorMessage);
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: user.phone || ''
                    },
                    theme: {
                        color: '#4F46E5'
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false);
                            alert('Payment cancelled.');
                        }
                    }
                };

                const rzp1 = new window.Razorpay(options);
                rzp1.on('payment.failed', function (response) {
                    alert(`Payment Failed: ${response.error.description}`);
                    setLoading(false);
                });
                rzp1.open();

            } catch (error) {
                console.error("Payment Error:", error);
                const msg = error.response?.data?.message || 'Payment processing failed. Please try again.';
                alert(msg);
                setLoading(false);
            }
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

    // --- Calculation Logic for Render ---
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = totalItems * BOOK_PRICE;
    const GST_RATE = 0.18;
    const gstAmount = subtotal * GST_RATE;
    const totalBeforeDiscount = subtotal + gstAmount;

    // Membership Discount
    let membershipDiscountRate = 0;
    if (membership === 'premium') membershipDiscountRate = 0.07;
    if (membership === 'elite') membershipDiscountRate = 0.15;

    // Discount applied on Subtotal per user request ("off should be at the sub-total")
    const membershipDiscountAmount = subtotal * membershipDiscountRate;

    // Platform Fee (Variable for calculation is 0, display handled separately)
    const platformFee = 0;

    // Running Total before Coupon
    const totalAfterMembershipAndFee = totalBeforeDiscount - membershipDiscountAmount + platformFee;

    // Coupon Discount
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
            // UPDATED: Percent discount is based on SUBTOTAL now
            couponDiscountAmount = subtotal * (appliedCoupon.value / 100);
        } else if (appliedCoupon.type === 'flat') {
            couponDiscountAmount = appliedCoupon.value;
        }
    }

    // Final Total
    const finalTotal = Math.max(0, totalAfterMembershipAndFee - couponDiscountAmount);


    const [brokenImageIds, setBrokenImageIds] = useState(new Set());

    const handleImageError = (id) => {
        setBrokenImageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    return (
        <div className="h-screen bg-gray-50/50 flex flex-col pt-28 pb-2 px-6 ">
            <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Your Cart</h1>
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-400">
                            <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8 max-w-md">
                            Looks like you haven't added any books yet. Explore our extensive library to find your next read.
                        </p>
                        <button
                            onClick={() => navigate('/explore')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 hover:-translate-y-1 flex items-center gap-2"
                        >
                            <BookOpen size={18} /> Browse Complete Library
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Cart Items List */}
                            <div className="lg:col-span-2 space-y-4 max-h-[520px] overflow-y-auto hide-scrollbar">
                                {cartItems.map((book) => (
                                    <div key={book.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-5 group transition-all hover:shadow-md">
                                        <div className={`w-24 h-32 rounded-xl flex-shrink-0 bg-gradient-to-br ${getColorIndex(book.id) === 0 ? 'from-orange-100 to-amber-100' :
                                            getColorIndex(book.id) === 1 ? 'from-blue-100 to-cyan-100' :
                                                getColorIndex(book.id) === 2 ? 'from-purple-100 to-pink-100' :
                                                    'from-emerald-100 to-green-100'
                                            } flex items-center justify-center overflow-hidden shadow-inner`}>
                                            {book.image && !brokenImageIds.has(book.id) ? (
                                                <img
                                                    src={book.image}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                    onError={() => handleImageError(book.id)}
                                                />
                                            ) : (
                                                <BookOpen size={32} className="text-gray-400/50" />
                                            )}
                                        </div>

                                        <div className="flex-grow flex flex-col py-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                                                    <p className="text-sm text-gray-500 font-medium">{book.author}</p>
                                                </div>
                                                <span className="text-lg font-bold text-gray-900">₹{BOOK_PRICE * (book.quantity || 1)}</span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wide">
                                                    {book.category}
                                                </span>

                                                <div className="flex items-center gap-3">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                                        <button
                                                            onClick={() => handleQuantityChange(book.id, -1)}
                                                            className="p-1 text-gray-500 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold text-gray-900">{book.quantity || 1}</span>
                                                        <button
                                                            onClick={() => handleQuantityChange(book.id, 1)}
                                                            className="p-1 text-gray-500 hover:text-green-600 hover:bg-white rounded-md transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemove(book.id)}
                                                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-28">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            Order Summary
                                        </h2>

                                        <div className="space-y-3.5 mb-4">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Subtotal ({totalItems} items)</span>
                                                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span className="flex items-center gap-1 group relative cursor-default">
                                                    GST (18%)
                                                    <Info size={14} className="text-gray-400" />
                                                    {/* Custom Tooltip */}
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                                        GST applied as per Indian tax laws
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                    </span>
                                                </span>
                                                <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                                            </div>

                                            <div className="flex justify-between text-gray-600">
                                                <span className="flex items-center gap-1 group relative cursor-default">
                                                    Platform Fee
                                                    <Info size={14} className="text-gray-400" />
                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                                        {membership === 'elite' ? 'Elite members get 15% OFF on every purchase' :
                                                            membership === 'premium' ? 'Premium members get 7% OFF on every purchase' :
                                                                'Basic members get 0% OFF on every purchase'}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                    </span>
                                                </span>
                                                <span className="font-medium text-emerald-600">
                                                    {membership === 'elite' ? '15% OFF' :
                                                        membership === 'premium' ? '7% OFF' :
                                                            'FREE'}
                                                </span>
                                            </div>

                                            {/* Coupon Section */}
                                            <div className="flex justify-between items-center text-gray-600 relative">
                                                <span className="flex items-center gap-2">
                                                    Coupon Code
                                                </span>

                                                {appliedCoupon ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-emerald-600 font-medium text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                            {appliedCoupon.code}
                                                            <span className="text-xs ml-1 opacity-75">
                                                                ({appliedCoupon.value}{appliedCoupon.type === 'percent' ? '%' : ' flat'} off)
                                                            </span>
                                                        </span>
                                                        <button
                                                            onClick={handleRemoveCoupon}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                            title="Remove coupon"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsCouponDropdownOpen(!isCouponDropdownOpen)}
                                                            className="text-indigo-600 font-medium text-sm hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                                        >
                                                            Select Coupon
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {isCouponDropdownOpen && (
                                                            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                                                                <div className="p-3 bg-gray-50 border-b border-gray-100">
                                                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Coupons</h3>
                                                                </div>
                                                                <div className="max-h-64 overflow-y-auto">
                                                                    {[
                                                                        { code: 'BOOKIFY10', desc: '10% off (Limited use)', color: 'text-blue-600', bg: 'bg-blue-50' },
                                                                        { code: 'WELCOME50', desc: '50% off (New users only)', color: 'text-purple-600', bg: 'bg-purple-50' },
                                                                        { code: 'SAVE15', desc: '15% off (3+ books)', color: 'text-orange-600', bg: 'bg-orange-50' },
                                                                        { code: 'SAVE20', desc: '20% off (5+ books)', color: 'text-amber-600', bg: 'bg-amber-50' },
                                                                        { code: 'SAVE25', desc: '25% off (10+ books)', color: 'text-red-600', bg: 'bg-red-50' },
                                                                        { code: 'FLAT10', desc: 'Flat ₹10 off (Orders > ₹30)', color: 'text-emerald-600', bg: 'bg-emerald-50' }
                                                                    ].map((coupon) => (
                                                                        <button
                                                                            key={coupon.code}
                                                                            onClick={() => {
                                                                                handleApplyCoupon(coupon.code);
                                                                                setIsCouponDropdownOpen(false);
                                                                            }}
                                                                            className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                                                                        >
                                                                            <div className="flex justify-between items-center mb-1">
                                                                                <span className={`font-bold text-sm ${coupon.color} ${coupon.bg} px-2 py-0.5 rounded text-xs`}>
                                                                                    {coupon.code}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                                                                                {coupon.desc}
                                                                            </p>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}


                                                        {/* Backdrop to close dropdown */}
                                                        {isCouponDropdownOpen && (
                                                            <div className="fixed inset-0 z-40" onClick={() => setIsCouponDropdownOpen(false)}></div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}

                                            {/* Discount Section */}
                                            {(membershipDiscountAmount + couponDiscountAmount) > 0 && (
                                                <div className="flex justify-between text-emerald-700 mt-3">
                                                    <span>Discount</span>
                                                    <span className="font-medium">
                                                        - ₹{(membershipDiscountAmount + couponDiscountAmount).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="border-t border-dashed border-gray-200 my-4"></div>
                                            <div className="flex justify-between text-lg font-bold text-gray-900 mt">
                                                <span>Total</span>
                                                <span>₹{finalTotal.toFixed(2)}</span>
                                            </div>
                                            {(membershipDiscountAmount + couponDiscountAmount) > 0 && (
                                                <div className="bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-lg text-center mt-3 border border-emerald-100 animate-fade-in">
                                                    🎉 You have saved ₹{(membershipDiscountAmount + couponDiscountAmount).toFixed(2)} on this order
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            onClick={handleCheckout}
                                            disabled={loading}
                                            className={`w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-gray-900/10 hover:shadow-xl transition-all hover:-translate-y-0.5 mb-4 flex items-center justify-center gap-2 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? 'Processing...' : `Checkout ₹${finalTotal.toFixed(2)}`} <ArrowRight size={18} />
                                        </button>

                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-2">
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                                <span>Secure Checkout</span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                By placing your order, you agree to our{' '}
                                                <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                                    Terms of Service
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Explore More Section */}
                        {cartItems.length >= 3 && exploreBooks.length > 0 && (
                            <div className="mt-1 mb-25 animate-fade-in border-t border-gray-200 pt-5">
                                <div className="flex items-end justify-between mb-8">
                                    <div >
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Explore More</h2>
                                        <p className="text-gray-500">Discover more books to add to your reading list.</p>
                                    </div>
                                    <Link to="/explore" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                        View All <ArrowRight size={16} />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {exploreBooks.map((book, index) => (
                                        <div key={book.id} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col h-full transform hover:-translate-y-1">
                                            <div className="relative mb-3 overflow-hidden rounded-lg aspect-[2/3] group-hover:shadow-md transition-all duration-300">
                                                <div className={`absolute inset-0 bg-gradient-to-br ${index % 4 === 0 ? 'from-blue-50 to-indigo-50' :
                                                    index % 4 === 1 ? 'from-purple-50 to-pink-50' :
                                                        index % 4 === 2 ? 'from-amber-50 to-orange-50' :
                                                            'from-emerald-50 to-green-50'
                                                    } opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>

                                                <div className={`w-full h-full relative z-10 flex items-center justify-center bg-gray-50`}>
                                                    {book.image ? (
                                                        <img
                                                            src={book.image}
                                                            alt={book.title}
                                                            className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <BookOpen size={32} className="text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col flex-grow">
                                                <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 mb-1 text-sm group-hover:text-indigo-600 transition-colors">
                                                    {book.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium mb-2 line-clamp-1">{book.author}</p>
                                                <div className="mt-auto">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-bold text-gray-900">₹{BOOK_PRICE}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleExploreAddToCart(book)}
                                                        className="w-full bg-gray-900 text-white text-xs py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-600 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Plus size={12} /> Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="border-t border-gray-200 mt-auto py-4 flex flex-col md:flex-row justify-center gap-8 md:gap-11 items-center text-xs text-gray-400">
                    <p>&copy; 2026 Bookify Systems. All rights reserved</p>
                    <div className="flex gap-6 md:gap-11 flex-wrap justify-center">
                        <button onClick={(e) => openPolicy('terms', e)} className="hover:text-gray-600 transition-colors">Terms of Service</button>
                        <button onClick={(e) => openPolicy('privacy', e)} className="hover:text-gray-600 transition-colors">Privacy Policy</button>
                        <button onClick={(e) => openPolicy('security', e)} className="hover:text-gray-600 transition-colors">Security</button>
                        <button onClick={(e) => openPolicy('status', e)} className="hover:text-gray-600 transition-colors">Status</button>
                        <button onClick={(e) => openPolicy('docs', e)} className="hover:text-gray-600 transition-colors">Docs</button>
                        <button onClick={(e) => openPolicy('refund', e)} className="hover:text-gray-600 transition-colors">Refund Policy</button>
                        <button onClick={(e) => openPolicy('community', e)} className="hover:text-gray-600 transition-colors">Community</button>
                        <button onClick={(e) => openPolicy('cookie', e)} className="hover:text-gray-600 transition-colors">Cookie Policy</button>
                    </div>
                </div>
            </div>

            <FooterPolicyModal
                isOpen={policyModal.isOpen}
                onClose={() => setPolicyModal({ ...policyModal, isOpen: false })}
                type={policyModal.type}
            />
        </div>
    );
};

export default CartPage;
