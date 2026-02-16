import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';

const NotificationDropdown = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/notifications');
            const data = await res.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Optional: Poll every 3 seconds
        const interval = setInterval(fetchNotifications, 3000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('http://localhost:5001/api/notifications/read-all', { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                            >
                                Mark all read <Check size={12} className="ml-1" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notification.isRead ? 'bg-indigo-50/30' : ''}`}
                                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                                            <Bell size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-50 bg-gray-50/50 text-center">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 w-full py-1"
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
