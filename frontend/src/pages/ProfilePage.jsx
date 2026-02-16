import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, BookOpen, Clock, Calendar, LogOut, Shield, Award, Star, CreditCard, Bell, ChevronRight, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { generateInvoice } from '../utils/invoiceGenerator';
import 'jspdf-autotable';
import confetti from 'canvas-confetti';
import PricingModal from '../components/PricingModal';
import ReturnBookModal from '../components/ReturnBookModal';
import RenewBookModal from '../components/RenewBookModal';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-reading'); // 'my-reading', 'issued', 'history', 'due-date', 'payments', 'notifications'
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();

    const [brokenImageIds, setBrokenImageIds] = useState(new Set());

    const handleImageError = (id) => {
        setBrokenImageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }

        if (location.state?.openUpgrade) {
            setShowPricingModal(true);
            window.history.replaceState({}, document.title);
        }
        if (location.state?.openReturn) {
            setShowReturnModal(true);
            window.history.replaceState({}, document.title);
        }
        if (location.state?.openRenew) {
            setShowRenewModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const fetchUserData = async () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        try {
            // Fetch fresh data from backend
            const API_URL = import.meta.env.VITE_API_URL;
            const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
            // Use the new profile endpoint
            const idToFetch = parsedUser.id || parsedUser._id;
            const response = await axios.get(`${baseUrl}/user/auth/profile/${idToFetch}`);
            setUser(response.data);

            // Fetch Notifications
            const notifResponse = await axios.get(`${baseUrl}/notifications?userId=${idToFetch}`);
            setNotifications(notifResponse.data.notifications.map(n => ({
                id: n._id,
                type: n.type,
                title: getNotificationTitle(n.type),
                message: n.message,
                date: new Date(n.createdAt),
                read: n.isRead
            })));

        } catch (error) {
            console.error('Error fetching profile or notifications:', error);
            // Fallback to localStorage data, but try not to if possible. 
            // We shouldn't rely on localStorage if we just updated stuff.
            setUser(parsedUser);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [navigate, showPricingModal]); // Remove showReturnModal from dependency as we manually trigger it now

    const getNotificationTitle = (type) => {
        switch (type) {
            case 'book_due': return 'Book Due Soon';
            case 'membership_upgraded': return 'Membership Upgraded';
            case 'payment_received': return 'Payment Successful';
            case 'book_issued': return 'Book Issued';
            case 'book_returned': return 'Book Returned';
            case 'user_registered': return 'Welcome to Bookify';
            case 'out_of_stock': return 'Stock Alert';
            case 'low_stock': return 'Low Stock Alert';
            default: return 'Notification';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
        window.location.reload();
    };

    const handleUpgradeSuccess = (planName) => {
        setShowPricingModal(false);
        // Refresh user data is handled by useEffect dependency on showPricingModal

        // Trigger Confetti
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
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // Optional: Show success alert or notification
        alert(`Congratulations! You are now a ${planName} member.`);
    };

    if (loading) return (
        <div className="min-h-screen pt-28 flex justify-center items-start bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!user) return null;

    // Helper to calculate "Issued" vs "History"
    const allItems = user.orders
        ?.filter(order => order.type !== 'subscription')
        .flatMap(order =>
            order.items.map(item => {
                const membership = user.membership || 'regular';
                const durationDays = {
                    'basic': 7,
                    'premium': 15,
                    'elite': 30,
                    'regular': 7
                }[membership] || 7;

                return {
                    ...item,
                    orderDate: order.date,
                    dueDate: item.dueDate ? new Date(item.dueDate) : new Date(new Date(order.date).getTime() + durationDays * 24 * 60 * 60 * 1000)
                };
            })
        ) || [];

    // Sort by date new to old
    allItems.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    // Filter active books (all not returned)
    const issuedBooks = allItems.filter(item => !item.returned);
    const historyBooks = allItems;
    const returnedCount = allItems.filter(item => item.returned).length;
    const overdueCount = allItems.filter(item => !item.returned && new Date(item.dueDate) <= new Date()).length;

    // Payments Data (derived from orders)
    const payments = user.orders?.map(order => ({
        id: order._id || order.paymentId || Math.random().toString(36).substr(2, 9),
        date: order.date,
        amount: Number(order.total).toFixed(2),
        status: 'Completed',
        itemsCount: order.items.length,
        items: order.items,
        type: order.type || 'book', // 'subscription' or 'book' (default)
        paymentMethod: 'Razorpay',
        orderId: order.orderId,
        // Detailed breakdown fields for Invoice
        subtotal: order.subtotal,
        gst: order.gst,
        platformFee: order.platformFee,
        membershipDiscount: order.membershipDiscount,
        couponDiscount: order.couponDiscount
    })).sort((a, b) => new Date(b.date) - new Date(a.date)) || [];



    const handleGenerateInvoice = (payment) => {
        generateInvoice(payment, user);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'payments':
                return (
                    <div className="space-y-4 max-h-[690px] overflow-y-auto pr-2 hide-scrollbar">
                        {payments.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No payment history available.</p>
                            </div>
                        ) : (
                            payments.map((payment, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4.5 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all bg-white group gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                            <CheckCircle size={19} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">
                                                {payment.type === 'subscription'
                                                    ? `Payment for ${payment.items[0]?.title || 'Membership'}`
                                                    : `Payment for ${payment.itemsCount} ${payment.itemsCount === 1 ? 'Book' : 'Books'}`
                                                }
                                            </h3>
                                            <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()} • {new Date(payment.date).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-16 md:pl-0">
                                        <div className="flex flex-col items-end">
                                            <div className="font-bold text-gray-900 text-lg">₹{payment.amount}</div>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                {payment.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleGenerateInvoice(payment)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0"
                                            title="Download Invoice"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-4 max-h-[690px] overflow-y-auto hide-scrollbar">
                        {notifications.map((notif) => (
                            <div key={notif.id} className={`p-4.5 rounded-2xl border transition-all flex gap-4 ${notif.read ? 'bg-white border-gray-100' : 'bg-indigo-50/30 border-indigo-100'}`}>
                                <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                                    ${notif.type === 'alert' ? 'bg-red-100 text-red-600' :
                                        notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {notif.type === 'alert' ? <AlertCircle size={20} /> :
                                        notif.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h3>
                                        <span className="text-xs text-gray-400">{notif.date.toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>
                                </div>
                                {!notif.read && <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2"></div>}
                            </div>
                        ))}
                    </div>
                );
            default:
                const readBooks = allItems.filter(item => item.hasStarted === true && !item.returned);
                const contentData = activeTab === 'my-reading' ? readBooks :
                    activeTab === 'issued' ? issuedBooks :
                        activeTab === 'due-date' ? issuedBooks :
                            historyBooks;



                // return (
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[690px] overflow-y-auto pr-2 hide-scrollbar">
                        {contentData.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 col-span-full">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No books found in this section.</p>
                            </div>
                        ) : (
                            contentData.map((book, idx) => (
                                <div key={idx} className="flex flex-row items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all group bg-white h-full">
                                    <div className="w-16 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden shadow-sm">
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
                                    </div>

                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <h3 className="font-bold text-gray-900 mb-0.5 text-sm truncate group-hover:text-indigo-600 transition-colors" title={book.title}>{book.title}</h3>
                                        <p className="text-xs text-gray-500 mb-1.5 truncate">{book.author || 'Unknown Author'}</p>
                                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                                Qty: {activeTab === 'my-reading' ? 1 : book.quantity}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${book.returned ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {activeTab === 'history'
                                                    ? (book.returned ? 'Returned' : 'Issued')
                                                    : (new Date(book.dueDate) <= new Date() ? 'Returned' : (activeTab === 'issued' ? 'Issued' : (activeTab === 'due-date' ? 'Due' : 'Reading')))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center sm:items-end gap-0.5 min-w-[90px]">
                                        {activeTab === 'my-reading' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/reading?bookId=${book.id || book.googleId}`);
                                                }}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                Continue Reading
                                            </button>
                                        ) : (
                                            <>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                    {activeTab === 'history'
                                                        ? (book.returned ? 'Returned' : 'Issued')
                                                        : (activeTab === 'issued' ? 'Issued' : 'Due')}
                                                </div>
                                                <div className={`font-bold text-sm ${(activeTab !== 'history' && activeTab !== 'issued') && new Date(book.dueDate) < new Date(new Date().setDate(new Date().getDate() + 2))
                                                    ? 'text-red-500'
                                                    : 'text-gray-900'
                                                    }`}>
                                                    {activeTab === 'history'
                                                        ? (book.returned
                                                            ? (book.returnedDate ? new Date(book.returnedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A')
                                                            : new Date(book.orderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
                                                        : new Date(activeTab === 'issued' ? book.orderDate : book.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div >
                            ))
                        )}
                    </div >
                );

        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-21 pb-6 px-6" >
            <div className="max-w-7xl mx-auto ">
                {/* Header Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4.5 mb-4 flex flex-col md:flex-row items-center md:items-start gap-4 relative">
                    {/* Background Decoration Wrapper */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                        <div className="absolute top-0 right-0 p-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
                    </div>

                    <div className="relative group z-10">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-1 shadow-xl">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <span className="text-4xl font-bold text-indigo-600">
                                    {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                </span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-emerald-500 p-1.5 rounded-full border-4 border-white"></div>
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-center md:justify-start">
                            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                            <div className="relative group">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 cursor-default
                                    ${user.membership === 'elite' ? 'bg-amber-100 text-amber-700' :
                                        user.membership === 'premium' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {user.membership === 'elite' && <Star size={12} fill="currentColor" />}
                                    {user.membership === 'premium' && <Award size={12} />}
                                    {user.membership || 'Basic'} Member
                                </span>

                                {/* Hover Popup */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                                    <div className="text-xs space-y-2">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                            <span className="text-gray-500">Member Since</span>
                                            <span className="font-semibold text-gray-900">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2025'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                                            <span className="text-gray-500">Expires On</span>
                                            <span className="font-semibold text-gray-900">
                                                {user.createdAt
                                                    ? new Date(new Date(user.createdAt).setFullYear(new Date(user.createdAt).getFullYear() + 1)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '12 Mar 2026'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2">
                                            <span className="text-gray-500">Max Books</span>
                                            <span className="font-semibold text-gray-900">
                                                {user.membership === 'elite' ? 50 : user.membership === 'premium' ? 20 : 5}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Currently Issued</span>
                                            <span className="font-semibold text-gray-900">{issuedBooks.length}</span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                                            <span className="font-medium text-gray-600">Remaining</span>
                                            <span className="font-bold text-emerald-600">
                                                {(user.membership === 'elite' ? 50 : user.membership === 'premium' ? 20 : 5) - issuedBooks.length}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Triangle Arrow */}
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-gray-100 transform rotate-45"></div>
                                </div>
                            </div>
                            <div className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-1 cursor-default">
                                <User size={12} />
                                {(user.role || 'Student').toUpperCase()}
                            </div>
                        </div>
                        <p className="text-gray-500 mb-6 flex items-center justify-center md:justify-start gap-2">
                            {user.email}
                        </p>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <div className="bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Books Issued</span>
                                <span className="text-xs font-bold text-gray-900">{issuedBooks.length}</span>
                            </div>
                            <div className="bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Reads</span>
                                <span className="text-xs font-bold text-gray-900">{user.booksRead || 0}</span>
                            </div>
                            <div className="bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Returned Books</span>
                                <span className="text-xs font-bold text-gray-900">{returnedCount || 0}</span>
                            </div>
                            {overdueCount > 0 && (
                                <div className="bg-red-50 px-3 py-2 rounded-2xl border border-red-100 flex items-center gap-3">
                                    <span className="text-xs text-red-500 font-medium uppercase tracking-wide">Overdue</span>
                                    <span className="text-xs font-bold text-red-900">{overdueCount}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* <div className="flex flex-col md:flex-row gap-3 relative z-10 mt-4 md:mt-0 w-full md:w-auto"> */}
                    <div className="flex flex-col gap-2 relative z-10 mt-1 md:mt-0 w-full md:w-auto md:self-center">
                        {user.membership !== 'elite' && (
                            <button
                                onClick={() => setShowPricingModal(true)}
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border border-transparent px-4 py-1.5 rounded-lg font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 cursor-pointer w-full md:w-auto tracking-wider"
                            >
                                <Award size={12.5} />
                                Upgrade
                            </button>
                        )}
                        <button
                            onClick={() => setShowReturnModal(true)}
                            className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-lg font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm tracking-wider"
                        >
                            <LogOut size={12.5} className="rotate-180" />
                            Return
                        </button>
                        <button
                            onClick={() => setShowRenewModal(true)}
                            className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-1.5 rounded-lg font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm tracking-wider"
                        >
                            <LogOut size={12.5} className="rotate-180" />
                            Renew
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-red-500 border border-red-100 hover:bg-red-50 px-4 py-1.5 rounded-lg font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm tracking-wider"
                        >
                            <LogOut size={12.5} />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[550px]">
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {[
                            { id: 'my-reading', icon: CheckCircle, label: 'My Reading' },
                            { id: 'issued', icon: BookOpen, label: 'Issued Books' },
                            { id: 'due-date', icon: Calendar, label: 'Due Dates' },
                            { id: 'history', icon: Clock, label: 'History' },
                            { id: 'payments', icon: CreditCard, label: 'Payments' },
                            { id: 'notifications', icon: Bell, label: 'Notifications' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 min-w-[120px] text-center font-medium text-sm transition-all relative ${activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <tab.icon size={14} />
                                    {tab.label}
                                </span>
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="p-4">
                        {renderContent()}
                    </div>
                    {showPricingModal && (
                        <PricingModal
                            isOpen={showPricingModal}
                            onClose={() => setShowPricingModal(false)}
                            onUpgradeSuccess={handleUpgradeSuccess}
                            userPlan={user.plan}
                        />
                    )}

                    {showReturnModal && (
                        <ReturnBookModal
                            isOpen={showReturnModal}
                            onClose={() => setShowReturnModal(false)}
                            user={user}
                            books={issuedBooks}
                            onReturnSuccess={() => {
                                fetchUserData();
                            }}
                        />
                    )}

                    {showRenewModal && (
                        <RenewBookModal
                            isOpen={showRenewModal}
                            onClose={() => setShowRenewModal(false)}
                            user={user}
                            books={issuedBooks}
                            onRenewSuccess={() => {
                                fetchUserData();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
