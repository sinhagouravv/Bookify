const mongoose = require('mongoose');
const path = require('path');
// Load env from backend root
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Notification = require('../src/models/Notification');
const connectDB = require('../src/config/db');

const createTestNotification = async () => {
    try {
        await connectDB();

        console.log('Resetting all notifications to unread...');
        await Notification.updateMany({}, { isRead: false });

        console.log('Creating test notification...');
        await Notification.create({
            type: 'user_registered',
            message: 'Test Notification: User Registered (Fresh)',
            data: { userId: 'test_user_id' },
            isRead: false
        });

        console.log('Test notification created successfully.');
        console.log('All notifications marked as unread.');
        process.exit();
    } catch (error) {
        console.error('Error creating test notification:', error);
        process.exit(1);
    }
};

createTestNotification();
