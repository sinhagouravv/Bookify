const Notification = require('../models/Notification');

// Helper to create notification
exports.createNotification = async (type, message, data = {}) => {
    try {
        // Extract userId if present in data, as it's a common pattern
        const { userId, ...restData } = data;
        await Notification.create({
            type,
            message,
            data,
            userId: userId || data.userId || null // Ensure userId is captured
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Get all notifications
exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = {};

        if (userId) {
            filter.userId = userId;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 notifications

        const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Mark as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
