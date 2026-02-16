const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const morgan = require('morgan'); // Import morgan
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();
// Notification Routes moved below CORS

const PORT = process.env.PORT || 5001;

app.use(cors());
const fs = require('fs');
const path = require('path');

// Middleware
app.use(morgan('dev')); // Log requests to console
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Notification Routes
app.use('/api/notifications', require('./src/routes/notifications'));

// Routes
const bookRoutes = require('./src/routes/books');
// const planRoutes = require('./src/routes/plans');
const adminAuthRoutes = require('./src/routes/admin/auth');
const userAuthRoutes = require('./src/routes/user/auth');
const paymentRoutes = require('./src/routes/payment');

app.use('/api/books', bookRoutes);
// app.use('/api/plans', planRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', require('./src/routes/users'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/applications', require('./src/routes/applications')); // Add Application Routes
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/website-reviews', require('./src/routes/websiteReviews'));
// app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
    res.send('Library Management System API');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
