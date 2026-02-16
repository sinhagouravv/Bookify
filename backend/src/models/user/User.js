const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: false
    },
    membership: {
        type: String,
        enum: ['regular', 'basic', 'premium', 'elite'],
        default: 'regular'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    orders: {
        type: Array,
        default: []
    },
    booksRead: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        default: 'Student'
    },
    resetPasswordOtp: String,
    resetPasswordOtpExpire: Date
});

module.exports = mongoose.model('User', userSchema);
