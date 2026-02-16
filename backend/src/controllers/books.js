const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const GOOGLE_API_KEY = process.env.GOOGLE_BOOK_SECRET;

const Book = require('../models/Book');
const sendEmail = require('../utils/email');
const { createNotification } = require('./notificationController');

const MEMBERSHIP_RULES = {
    'regular': { monthlyLimit: 5, durationDays: 7 }, // Default fallback
    'basic': { monthlyLimit: 10, durationDays: 7 },
    'premium': { monthlyLimit: 20, durationDays: 15 },
    'elite': { monthlyLimit: 30, durationDays: 30 }
};

// Removed localBooks and fallbackBooks as we are moving to MongoDB

const fallbackBooks = [
    {
        googleId: "fb1", title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Classic",
        description: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
        fullDescription: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
        quantity: 10, available: 5, image: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg"
    },
    {
        googleId: "fb4", title: "Pride and Prejudice", author: "Jane Austen", category: "Romance",
        description: "Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.",
        fullDescription: "Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language.",
        quantity: 8, available: 4, image: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"
    },
    {
        googleId: "fb5", title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy",
        description: "A timeless classic of all-age fantasy... This edition has been completely reset and contains the original maps and illustrations.",
        fullDescription: "A timeless classic of all-age fantasy... This edition has been completely reset and contains the original maps and illustrations.",
        quantity: 15, available: 7, image: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg"
    },
    {
        googleId: "fb7", title: "The Da Vinci Code", author: "Dan Brown", category: "Thriller",
        description: "While in Paris, Harvard symbologist Robert Langdon is awakened by a phone call in the dead of the night.",
        fullDescription: "While in Paris, Harvard symbologist Robert Langdon is awakened by a phone call in the dead of the night.",
        quantity: 10, available: 6, image: "https://covers.openlibrary.org/b/isbn/9780307474278-L.jpg"
    },
    {
        googleId: "fb8", title: "Sapiens", author: "Yuval Noah Harari", category: "History",
        description: "From a renowned historian comes a groundbreaking narrative of humanity’s creation and evolution.",
        fullDescription: "From a renowned historian comes a groundbreaking narrative of humanity’s creation and evolution.",
        quantity: 20, available: 15, image: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg"
    },
    {
        googleId: "fb19", title: "Steve Jobs", author: "Walter Isaacson", category: "Biography",
        description: "Based on more than forty interviews with Jobs conducted over two years... Walter Isaacson has written a riveting story.",
        fullDescription: "Based on more than forty interviews with Jobs conducted over two years... Walter Isaacson has written a riveting story.",
        quantity: 10, available: 2, image: "https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg"
    },
    {
        googleId: "fb10", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Psychology",
        description: "The major New York Times bestseller that has changed the way we think.",
        fullDescription: "The major New York Times bestseller that has changed the way we think.",
        quantity: 10, available: 3, image: "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg"
    },
    {
        googleId: "fb12", title: "Dune", author: "Frank Herbert", category: "Science Fiction",
        description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange.",
        fullDescription: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange.",
        quantity: 18, available: 12, image: "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg"
    },
    {
        googleId: "fb13", title: "Atomic Habits", author: "James Clear", category: "Self-Help",
        description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
        fullDescription: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
        quantity: 30, available: 25, image: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg"
    },
    {
        googleId: "fb15", title: "Clean Code", author: "Robert C. Martin", category: "Programming",
        description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
        fullDescription: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
        quantity: 20, available: 15, image: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg"
    }
];

exports.syncBooks = async () => {
    const categories = [
        'subject:fantasy', 'subject:romance', 'subject:thriller', 'subject:history', 'subject:biography',
        'subject:science fiction', 'subject:self-help', 'subject:psychology', 'subject:programming'
    ];

    console.log('Starting book synchronization...');

    try {
        const BATCH_SIZE = 3;
        const DELAY_MS = 1000; // Slower delay for sync to be safe
        let processedCount = 0;

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < categories.length; i += BATCH_SIZE) {
            const batch = categories.slice(i, i + BATCH_SIZE);
            const batchRequests = batch.map(cat =>
                axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cat)}&maxResults=10&key=${GOOGLE_API_KEY}`)
                    .catch(e => {
                        console.error(`Failed to fetch ${cat}: ${e.message}`);
                        return { data: { items: [] } };
                    })
            );

            const batchResponses = await Promise.all(batchRequests);

            for (const response of batchResponses) {
                if (response.data && response.data.items) {
                    for (const item of response.data.items) {
                        const info = item.volumeInfo;
                        const bookData = {
                            googleId: item.id,
                            title: info.title,
                            author: info.authors ? info.authors[0] : 'Unknown',
                            category: info.categories ? info.categories[0] : 'General',
                            description: info.description ? info.description.substring(0, 150) + '...' : 'No description available.',
                            fullDescription: info.description || 'No description available.',
                            image: info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail).replace('http:', 'https:').replace('&edge=curl', '') : null,
                            quantity: 10, // Default for now
                            available: Math.floor(Math.random() * 10) + 1
                        };

                        // Upsert: Update if exists, Insert if not
                        await Book.findOneAndUpdate({ googleId: item.id }, bookData, { upsert: true, new: true });
                        processedCount++;
                    }
                }
            }

            console.log(`Synced batch ${i / BATCH_SIZE + 1}/${Math.ceil(categories.length / BATCH_SIZE)}`);
            if (i + BATCH_SIZE < categories.length) {
                await delay(DELAY_MS);
            }
        }
        console.log(`Book synchronization complete. Processed ${processedCount} books.`);
    } catch (error) {
        console.error('Error during book synchronization:', error.message);
    }
};

exports.getBookCount = async (req, res) => {
    try {
        const count = await Book.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        // Build filter query
        const query = {};
        if (req.query.category) {
            query.category = { $regex: req.query.category, $options: 'i' };
        }
        if (req.query.stock === 'in_stock') {
            query.available = { $gt: 0 };
        } else if (req.query.stock === 'out_of_stock') {
            query.available = { $eq: 0 };
        }

        const totalBooks = await Book.countDocuments(query);
        let books = await Book.find(query).skip(skip).limit(limit);

        if (totalBooks === 0 && page === 1 && Object.keys(query).length === 0) {
            console.log('No books found in DB. Seeding fallback data...');
            // Seed immediately
            books = await Book.insertMany(fallbackBooks);
        }

        // Map _id or googleId to id for frontend compatibility
        const mappedBooks = books.map(book => ({
            ...book.toObject(),
            id: book.googleId // Use googleId as the stable frontend ID
        }));

        res.json({
            books: mappedBooks,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching books from DB:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getBookById = async (req, res) => {
    try {
        // Frontend sends googleId as ID
        const book = await Book.findOne({ googleId: req.params.id });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json({
            ...book.toObject(),
            id: book.googleId
        });
    } catch (error) {
        console.error('Error fetching book details:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createBook = async (req, res) => {
    // Admin manual creation
    try {
        const newBook = new Book(req.body);
        // Generate a random googleId-like string if manual? or just use a specialized ID
        newBook.googleId = 'manual_' + Date.now();
        await newBook.save();
        res.status(201).json(newBook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateBook = async (req, res) => {
    try {
        // Find the book first to check previous stock
        const book = await Book.findOne({ googleId: req.params.id });
        if (!book) return res.status(404).json({ message: 'Book not found' });

        const previousStock = book.available;

        // Update the book
        const updatedBook = await Book.findOneAndUpdate({ googleId: req.params.id }, req.body, { new: true });

        // Check if stock increased from 0 and there are people on the waitlist
        if (previousStock === 0 && updatedBook.available > 0 && updatedBook.waitlist && updatedBook.waitlist.length > 0) {
            console.log(`Stock for ${updatedBook.title} replenshed. Processing waitlist...`);

            const waitlistUsers = updatedBook.waitlist.filter(entry => !entry.notified);

            for (const entry of waitlistUsers) {
                if (entry.email) {
                    try {
                        const emailHtml = `
                            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                <h1 style="color: #4F46E5;">Good News! 📚</h1>
                                <p>The book you were waiting for is back in stock!</p>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                    <h3>${updatedBook.title}</h3>
                                    <p>by ${updatedBook.author}</p>
                                    <p style="color: green; font-weight: bold;">Now Available!</p>
                                </div>
                                <p>Hurry up and grab your copy before it runs out again.</p>
                                <a href="http://localhost:5173/catalog" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Book</a>
                            </div>
                        `;

                        await sendEmail({
                            email: entry.email,
                            subject: `Back in Stock: ${updatedBook.title}`,
                            html: emailHtml
                        });
                        console.log(`Back in stock email sent to ${entry.email}`);

                        // Mark as notified
                        entry.notified = true;
                    } catch (err) {
                        console.error(`Failed to send waitlist email to ${entry.email}:`, err.message);
                    }
                }
            }

            // Save the updated notified status
            // IMPORTANT: We need to update the database with the modified waitlist
            // updatedBook.save() might not work as expected because updatedBook is a document returned by findOneAndUpdate
            // valid if new: true returns a Mongoose document.
            await updatedBook.save();
            console.log(`Waitlist processed for ${updatedBook.title}`);
        } else {
            console.log(`No waitlist processing needed used for ${updatedBook.title}. Prev: ${previousStock}, New: ${updatedBook.available}, Waitlist: ${updatedBook.waitlist ? updatedBook.waitlist.length : 0}`);
        }

        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.subscribeToWaitlist = async (req, res) => {
    const { userId, email } = req.body;
    const { id } = req.params; // googleId

    console.log(`Subscribe to waitlist request for book ${id}, user: ${email}`);

    if (!email) {
        return res.status(400).json({ message: 'Email is required for waitlist', success: false });
    }

    try {
        const book = await Book.findOne({ googleId: id });
        if (!book) {
            console.log(`Book not found for waitlist: ${id}`);
            return res.status(404).json({ message: 'Book not found', success: false });
        }

        // Check if already subscribed
        const isSubscribed = book.waitlist.some(entry => entry.email === email && !entry.notified);
        if (isSubscribed) {
            console.log(`User ${email} already subscribed to ${book.title}`);
            return res.status(400).json({ message: 'You are already on the waitlist for this book.', success: false });
        }

        book.waitlist.push({ userId, email });
        await book.save();

        console.log(`User ${email} added to waitlist for ${book.title}`);
        res.json({ message: 'Successfully added to waitlist', success: true });
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        await Book.findOneAndDelete({ googleId: req.params.id });
        res.json({ message: 'Book deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkout = async (req, res) => {
    const { items, userId, finalAmount, paymentId, orderId } = req.body; // items: [{ id: googleId, quantity: number }]

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items in checkout', success: false });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log("Checkout request received. Items:", items.length, "UserID:", userId);

        // Check for existing active issues if userId is present
        if (userId) {
            const User = require('../models/user/User'); // Ensure User model is available
            const user = await User.findById(userId).session(session);
            if (user) {
                // 1. Membership Rules & Limits
                const membershipType = user.membership || 'regular';
                const rules = MEMBERSHIP_RULES[membershipType] || MEMBERSHIP_RULES['regular'];

                // Calculate Active Books (Currently Issued)
                let activeBookCount = 0;
                if (user.orders) {
                    activeBookCount = user.orders.reduce((total, order) => {
                        if (order.items) {
                            const orderActiveCount = order.items.reduce((sum, i) => {
                                // item.returned is undefined or false if active
                                if (!i.returned && i.id !== 'membership') {
                                    return sum + (i.quantity || 1);
                                }
                                return sum;
                            }, 0);
                            return total + orderActiveCount;
                        }
                        return total;
                    }, 0);
                }

                // Calculate requested quantity
                const requestedQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const totalRequired = activeBookCount + requestedQuantity;

                if (totalRequired > rules.monthlyLimit) {
                    throw new Error(`Limit exceeded. You are currently holding ${activeBookCount} books and trying to issue ${requestedQuantity}. Total ${totalRequired} exceeds your ${membershipType} plan limit of ${rules.monthlyLimit}.`);
                }

                // 2. Set Due Date
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + rules.durationDays);

                // Assign due date to items
                items.forEach(item => {
                    item.dueDate = dueDate;
                });

                // 3. Duplicate Check
                const activeBookIds = new Set();
                if (user.orders) {
                    user.orders.forEach(order => {
                        if (order.items) {
                            order.items.forEach(item => {
                                if (!item.returned) {
                                    const itemId = item.googleId || item.id || (item._id ? item._id.toString() : null);
                                    if (itemId) activeBookIds.add(itemId);
                                }
                            });
                        }
                    });
                }

                for (const item of items) {
                    const itemId = item.id || item.googleId;
                    if (itemId && activeBookIds.has(itemId)) {
                        throw new Error(`You have already issued this book. Please return it first.`);
                    }
                }
            }
        }

        for (const item of items) {
            // Use googleId as the stable ID
            let book = await Book.findOne({ googleId: item.id }).session(session);

            // Fallback: Try finding by _id if googleId lookup fails
            if (!book && mongoose.Types.ObjectId.isValid(item.id)) {
                console.log(`Fallback: Found book by _id: ${item.id}`);
                book = await Book.findById(item.id).session(session);
            }

            if (!book) {
                console.error(`Checkout Failed: Book not found. Item:`, item);
                throw new Error(`Book not found: ${item.title || item.id}`);
            }

            if (book.available < item.quantity) {
                console.error(`Checkout Failed: Insufficient stock for ${book.title}. Req: ${item.quantity}, Avail: ${book.available}`);
                throw new Error(`Insufficient stock for: ${book.title}. Available: ${book.available}`);
            }

            book.available -= item.quantity;
            await book.save({ session });
        }

        // Save order to User if userId is provided
        if (userId) {
            console.log("Updating user orders for:", userId);
            const User = require('../models/user/User');
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.error("Invalid User ID format:", userId);
                // Don't throw, just skip user update or handle gracefully? 
                // If we throw, transaction aborts. Let's throw to be safe for now or log warning.
            }

            const updatedUser = await User.findByIdAndUpdate(userId, {
                $push: {
                    orders: {
                        items,
                        total: finalAmount,
                        date: new Date(),
                        paymentId,
                        orderId
                    }
                }
            }, { new: true }).session(session);

            if (!updatedUser) {
                console.error("User not found for ID:", userId);
                // Decide if this should fail the transaction. Probably yes if we expect a user.
            } else {
                console.log("User orders updated successfully.");
            }
        }

        // Notification: Payment Received
        await createNotification(
            'payment_received',
            `Payment received`,
            { amount: finalAmount, orderId: orderId, paymentId: paymentId, userId: userId }
        );

        // Notification: Books Issued
        const bookTitles = items.map(i => i.title).join(', ');
        await createNotification(
            'book_issued',
            `Books issued: ${bookTitles}`,
            { items: items, userId: userId, orderId: orderId }
        );

        // Check for Stock Levels
        for (const item of items) {
            // Re-fetch book to check current stock after deduction
            const book = await Book.findOne({ googleId: item.id }).session(session);
            if (book) {
                if (book.available === 0) {
                    // Out of Stock Logic
                    await createNotification(
                        'out_of_stock',
                        `Out of Stock: ${book.title}`,
                        { bookId: book._id, googleId: book.googleId, title: book.title }
                    );

                    // Send Email to Admin
                    console.log('Checking email config for Admin Out of Stock alert...');
                    if (process.env.EMAIL_USER) {
                        console.log('EMAIL_USER is set. Attempting to send email to:', process.env.EMAIL_USER);
                        try {
                            const emailHtml = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                <style>
                                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                                    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                    .header { background: #4F46E5; color: white; padding: 24px; text-align: center; }
                                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                                    .alert-banner { background: #FEF2F2; color: #DC2626; padding: 12px; text-align: center; font-weight: 600; border-bottom: 1px solid #FEE2E2; }
                                    .content { padding: 32px; }
                                    .book-card { display: flex; gap: 40px; background: #F9FAFB; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; margin-top: 20px; }
                                    .book-image { width: 100px; height: 150px; object-fit: cover; border-radius: 4px; background: #E5E7EB; flex-shrink: 0; }
                                    .book-details { flex: 1; }
                                    .book-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px 0; }
                                    .book-meta { color: #6B7280; font-size: 14px; margin-bottom: 4px; }
                                    .stock-badge { display: inline-block; background: #DC2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-top: 8px; }
                                    .footer { text-align: center; padding: 24px; color: #6B7280; font-size: 12px; border-top: 1px solid #E5E7EB; background: #F9FAFB; }
                                    .btn { display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 24px; }
                                </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="header">
                                            <h1>Hello Admin</h1>
                                        </div>
                                        <div class="alert-banner">
                                            ⚠️ Critical Stock Alert
                                        </div>
                                        <div class="content">
                                            <p style="font-size: 16px; margin-bottom: 24px;">Hello Admin,</p>
                                            <p>This is an urgent notification that the following item has reached <strong>0 inventory</strong> and requires immediate restocking.</p>
                                            
                                            <div class="book-card">
                                                ${book.image ? `<img src="${book.image}" alt="Book Cover" class="book-image" />` : '<div class="book-image" style="display:flex;align-items:center;justify-content:center;color:#9CA3AF;">No Image</div>'}
                                                <div class="book-details">
                                                    <h3 class="book-title">${book.title}</h3>
                                                    <div class="book-meta">👤 Author: ${book.author}</div>
                                                    <div class="book-meta">🏷️ Category: ${book.category || 'General'}</div>
                                                    <div class="book-meta">🆔 ID: <span style="font-family: monospace;">${book.googleId}</span></div>
                                                    <div class="stock-badge">OUT OF STOCK</div>
                                                </div>
                                            </div>

                                            <div style="text-align: center;">
                                                <a href="http://localhost:5173/admin/books" class="btn">Manage Inventory</a>
                                            </div>
                                        </div>
                                        <div class="footer">
                                            <p>This is an automated message from your Bookifyyy System.</p>
                                            <p>&copy; ${new Date().getFullYear()} Bookifyyy. All rights reserved.</p>
                                        </div>
                                    </div>
                                </body>
                                </html>
                            `;
                            // Use explicit admin email
                            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'sinhagouravv@gmail.com';
                            console.log('Sending out of stock email to:', adminEmail);

                            await sendEmail({
                                email: adminEmail, // Admin email
                                subject: `Action Required: ${book.title} is Out of Stock`,
                                html: emailHtml
                            });
                            console.log(`Out of stock email sent successfully for ${book.title}`);
                        } catch (emailErr) {
                            console.error('Failed to send out of stock email:', emailErr.message);
                        }
                    }

                } else if (book.available <= 3) {
                    // Low Stock Logic (<= 3)
                    await createNotification(
                        'low_stock',
                        `${book.title} is going to be out of stock add more book`,
                        { bookId: book._id, googleId: book.googleId, available: book.available, bookTitle: book.title }
                    );
                }
            }
        }

        await session.commitTransaction();
        session.endSession();
        console.log("Transaction committed. Checkout success.");

        // --- Send Email Notification ---
        if (userId) {
            try {
                const User = require('../models/user/User');
                const user = await User.findById(userId);
                if (user && user.email) {
                    const message = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #4F46E5;">Order Confirmed! 📚</h1>
                            <p>Hi ${user.name},</p>
                            <p>Thank you for your purchase from Bookify. Your order has been received and your books are reserved.</p>
                            
                            <h3>Order Summary</h3>
                            <ul style="list-style: none; padding: 0;">
                                ${items.map(item => `
                                    <li style="border-bottom: 1px solid #eee; padding: 10px 0;">
                                        <strong>${item.title}</strong> x ${item.quantity}
                                    </li>
                                `).join('')}
                            </ul>
                            
                            <h2 style="margin-top: 20px;">Total Amount: ₹${finalAmount}</h2>
                            
                            <p style="margin-top: 30px; font-size: 12px; color: #666;">
                                Keep reading, <br/>
                                The Bookify Team
                            </p>
                        </div>
                    `;

                    await sendEmail({
                        email: user.email,
                        subject: 'Order Confirmation - Bookify',
                        html: message
                    });
                    console.log("Order confirmation email sent to:", user.email);
                }
            } catch (emailError) {
                console.error("Failed to send order email:", emailError.message);
                // Do not fail the request, just log the error
            }
        }

        res.json({ message: 'Checkout successful', success: true });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Checkout Transaction Aborted:", error.message);
        console.error(error.stack);
        res.status(400).json({ message: error.message, success: false });
    }
};
exports.cleanupDuplicates = async (req, res) => {
    try {
        const User = require('../models/user/User');
        const users = await User.find({});
        let cleanedCount = 0;

        for (const user of users) {
            if (!user.orders) continue;

            const seenBooks = new Set();
            let userModified = false;

            // Iterate orders in reverse to keep oldest? existing logic might be complex
            // Simpler: Build a new list of orders/items where we verify uniqueness of active items

            // Actually, we need to modify the array in place or rebuild it.
            // Since orders structure is User -> orders -> items.

            for (const order of user.orders) {
                if (order.items) {
                    const newItems = [];
                    for (const item of order.items) {
                        if (item.returned) {
                            newItems.push(item); // Keep returned books always
                        } else {
                            // Check if this book is already 'seen' as active for this user
                            const bookId = item.googleId || item.id || (item._id ? item._id.toString() : null);
                            if (bookId && seenBooks.has(bookId)) {
                                // Duplicate active issue! Remove it (don't push to newItems)
                                cleanedCount++;
                                userModified = true;
                            } else {
                                if (bookId) seenBooks.add(bookId);
                                newItems.push(item);
                            }
                        }
                    }
                    order.items = newItems;
                }
            }

            // cleanup empty orders? maybe not needed but good practice
            user.orders = user.orders.filter(order => order.items && order.items.length > 0);

            if (userModified) {
                user.markModified('orders');
                await user.save();
            }
        }

        res.json({ message: `Cleanup complete. Removed ${cleanedCount} duplicate active issues.` });
    } catch (error) {
        console.error('Cleanup Error:', error);
        res.status(500).json({ message: 'Server Error during cleanup' });
    }
};
