const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    author: { type: String, default: 'Unknown' },
    category: { type: String, default: 'General' },
    description: { type: String },
    fullDescription: { type: String },
    quantity: { type: Number, default: 10 },
    available: { type: Number, default: 5 },
    image: { type: String },
    waitlist: [{
        userId: { type: String },
        email: { type: String },
        notified: { type: Boolean, default: false },
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
