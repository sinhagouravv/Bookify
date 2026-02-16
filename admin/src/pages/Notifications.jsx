import { useState, useEffect } from 'react';
import { Bell, Check, Search } from 'lucide-react';

const Notifications = () => {
    console.log('Notifications Component Rendering...');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [search, setSearch] = useState('');

    const fetchNotifications = async () => {
        try {
            console.log('Notifications Page: Fetching...');
            setLoading(true);
            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            console.log('Notifications Page Data:', data);

            if (Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
            } else {
                console.error('Invalid notifications data format:', data);
                setNotifications([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications page:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('http://localhost:5001/api/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'user_registered': return 'bg-blue-100 text-blue-600';
            case 'user_login': return 'bg-indigo-100 text-indigo-600';
            case 'payment_received': return 'bg-green-100 text-green-600';
            case 'low_stock': return 'bg-red-100 text-red-600';
            case 'membership_upgraded': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const filteredNotifications = Array.isArray(notifications) ? notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'read') return n.isRead;
        if (filter === 'payment') return ['payment_received', 'membership_upgraded'].includes(n.type);
        return true;
    }).filter(n =>
        (n.message || '').toLowerCase().includes(search.toLowerCase()) ||
        (n.type || '').toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Check size={16} /> Mark all read
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'unread', 'read', 'payment'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Bell size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No notifications found matching your filters.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-4 hover:bg-gray-50 transition-colors flex gap-4 ${!notification.isRead ? 'bg-indigo-50/10' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                                    <Bell size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 inline-block px-2 py-1 rounded">
                                        Type: {notification.type}
                                    </p>
                                    {/* Display Data Preview */}
                                    {notification.data && Object.keys(notification.data).length > 0 && (
                                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                            {notification.type === 'user_registered' && (
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                                    <div className="text-right font-medium">User ID:</div> <div className="font-mono">{notification.data.userId}</div>
                                                    {notification.data.email && <><div className="text-right font-medium">Email:</div> <div>{notification.data.email}</div></>}
                                                </div>
                                            )}
                                            {notification.type === 'payment_received' && (
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                                    <div className="text-right font-medium">Amount:</div> <div>₹{Number(notification.data.amount).toFixed(2)}</div>
                                                    <div className="text-right font-medium">Payment ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.paymentId || 'N/A'}</div>
                                                    <div className="text-right font-medium">Order ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.orderId}</div>
                                                    {notification.data.userId && <><div className="text-right font-medium">User ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.userId}</div></>}
                                                </div>
                                            )}
                                            {notification.type === 'low_stock' && (
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                                    <div className="text-right font-medium">Book:</div> <div>{notification.data.bookTitle}</div>
                                                    <div className="text-right font-medium">Remaining:</div> <div className="text-red-600 font-bold">{notification.data.available}</div>
                                                </div>
                                            )}
                                            {notification.type === 'book_issued' && (
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                                    <div className="text-right font-medium">Items:</div>
                                                    <div>
                                                        {notification.data.items && notification.data.items.map((item, idx) => (
                                                            <span key={idx} className="block">{item.title} (x{item.quantity})</span>
                                                        ))}
                                                    </div>
                                                    <div className="text-right font-medium">Order ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.orderId}</div>
                                                    {notification.data.userId && <><div className="text-right font-medium">User ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.userId}</div></>}
                                                </div>
                                            )}
                                            {notification.type === 'out_of_stock' && (
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                                    <div className="text-right font-medium">Book:</div> <div className="font-bold text-red-600">{notification.data.title}</div>
                                                    <div className="text-right font-medium">Stock:</div> <div className="font-mono text-red-600">0</div>
                                                </div>
                                            )}
                                            {notification.type === 'membership_upgraded' && (
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                                    <div className="text-right font-medium">Plan:</div> <div>{notification.data.plan}</div>
                                                    <div className="text-right font-medium">Amount:</div> <div>₹{Number(notification.data.amount).toFixed(2)}</div>
                                                    <div className="text-right font-medium">Payment ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.paymentId || 'N/A'}</div>
                                                    <div className="text-right font-medium">User ID:</div> <div className="font-mono text-xs pt-0.5">{notification.data.userId}</div>
                                                </div>
                                            )}
                                            {/* Fallback for other types */}
                                            {!['user_registered', 'payment_received', 'low_stock', 'membership_upgraded', 'book_issued', 'out_of_stock'].includes(notification.type) && (
                                                <pre className="whitespace-pre-wrap font-mono">
                                                    {JSON.stringify(notification.data, null, 2).replace(/[{"}]/g, '')}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification._id)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
