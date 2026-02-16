const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Book = require('../src/models/Book');

// Load env from backend root (scripts/ -> backend/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const resetBooks = async () => {
    await connectDB();
    try {
        await Book.deleteMany({});
        console.log('All books deleted.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetBooks();
