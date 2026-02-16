const express = require('express');
const router = express.Router();
const User = require('../../models/user/User');
const Book = require('../../models/Book');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../../utils/email');
const { createNotification } = require('../../controllers/notificationController');

const MEMBERSHIP_RULES = {
    'regular': { durationDays: 7 },
    'basic': { durationDays: 7 },
    'premium': { durationDays: 15 },
    'elite': { durationDays: 30 }
}; // Check logic

// Signup Route
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Send Welcome Email
        try {
            const message = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #4F46E5;">Welcome to Bookifyyy! 🚀</h1>
                    <p>Hi ${name},</p>
                    <p>Thank you for joining Bookify. We're thrilled to have you as part of our community of book lovers.</p>
                    <p>Explore our vast collection and start your reading journey today.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Happy Reading, <br/>
                        The Bookify Team
                    </p>
                </div>
            `;
            await sendEmail({
                email: user.email,
                subject: 'Welcome to Bookifyyy - Registration Successful',
                html: message
            });
        } catch (emailError) {
            console.error('Welcome email failed:', emailError.message);
        }

        // Create Notification
        await createNotification('user_registered', `New user registered: ${user.name}`, { userId: user._id, email: user.email });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' }); // Use 404 to distinguish for frontend "try next" logic
        }

        if (user.password !== password) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Send Welcome Back Email
        try {
            const message = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #4F46E5;">Welcome Back! 👋</h1>
                    <p>Hi ${user.name},</p>
                    <p>It's great to see you again. Your library is waiting for you.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Happy Reading, <br/>
                        The Bookify Team
                    </p>
                </div>
            `;
            await sendEmail({
                email: user.email,
                subject: 'Welcome Back to Bookifyyy',
                html: message
            });
        } catch (emailError) {
            console.error('Welcome back email failed:', emailError.message);
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            membership: user.membership,
            orders: user.orders || [],
            isAdmin: false,
            token: 'dummy-user-token'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Google Login
router.post('/google', async (req, res) => {
    try {
        const { code } = req.body;
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'postmessage'
        );

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { name, email, sub: googleId } = payload;

        // Check if user exists
        let user = await User.findOne({ email });
        let isNewSignup = false;

        if (!user) {
            // Create new user
            user = new User({
                name,
                email,
                googleId
            });
            isNewSignup = true;
            await user.save();

            // Send Welcome Email (Google Signup)
            try {
                const message = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h1 style="color: #4F46E5;">Welcome to Bookify! 🚀</h1>
                        <p>Hi ${name},</p>
                        <p>Thank you for signing up with Google. Your account is now active.</p>
                        <p>Explore our vast collection and start your reading journey today.</p>
                        <p style="margin-top: 30px; font-size: 12px; color: #666;">
                            Happy Reading, <br/>
                            The Bookify Team
                        </p>
                    </div>
                `;
                await sendEmail({
                    email: user.email,
                    subject: 'Welcome to Bookify - Registration Successful',
                    html: message
                });
            } catch (emailError) {
                console.error('Google Welcome email failed:', emailError.message);
            }
        } else if (!user.googleId) {
            // Link Google ID to existing user
            user.googleId = googleId;
            await user.save();
        }

        // Send Welcome Back Email (Google Login - Existing User)
        // If user existed and we just logged them in (not new signup)
        if (user && !isNewSignup) {
            try {
                const message = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h1 style="color: #4F46E5;">Welcome Back! 👋</h1>
                        <p>Hi ${user.name},</p>
                        <p>You have successfully logged in via Google.</p>
                        <p style="margin-top: 30px; font-size: 12px; color: #666;">
                            Happy Reading, <br/>
                            The Bookify Team
                        </p>
                    </div>
                `;
                await sendEmail({
                    email: user.email,
                    subject: 'Welcome Back to Bookify',
                    html: message
                });
            } catch (emailError) {
                console.error('Google Welcome Back email failed:', emailError.message);
            }
        }

        res.json({
            message: 'Google login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                membership: user.membership,
                orders: user.orders || []
            }
        });
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
});

// Get Profile Route
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Recalculate booksRead from orders to ensure accuracy
        // Filter unique books that have hasStarted: true
        const readBooksSet = new Set();
        if (user.orders) {
            user.orders.forEach(order => {
                if (order.items) {
                    order.items.forEach(item => {
                        if (item.hasStarted) {
                            // Use googleId or id or title to identify unique book
                            readBooksSet.add(item.googleId || item.id || item.title);
                        }
                    });
                }
            });
        }

        const calculatedReadCount = readBooksSet.size;

        // Auto-correct if mismatch
        if (user.booksRead !== calculatedReadCount) {
            user.booksRead = calculatedReadCount;
            await user.save();
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            membership: user.membership,
            orders: user.orders || [],
            booksRead: calculatedReadCount,
            role: user.role || 'Student'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Increment Books Read Count
// Increment Books Read Count (Start Reading)
router.put('/read/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { bookId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let bookFound = false;
        let pchanged = false;

        // Iterate orders reversed (newest first) to find the book
        // using for loop to allow breaking
        if (user.orders && user.orders.length > 0) {
            for (let i = user.orders.length - 1; i >= 0; i--) {
                const order = user.orders[i];
                if (order.items && order.items.length > 0) {
                    for (let j = 0; j < order.items.length; j++) {
                        const item = order.items[j];
                        // Match by ID (GoogleId)
                        if (item.id === bookId || item.googleId === bookId) {
                            bookFound = true;
                            if (!item.hasStarted) {
                                item.hasStarted = true;
                                item.progress = 0; // Initialize progress
                                user.booksRead = (user.booksRead || 0) + 1;
                                pchanged = true;
                            } else {
                                // Increment progress by 5%
                                item.progress = Math.min((item.progress || 0) + 5, 100);
                                pchanged = true;
                            }
                            // If found, whether started or not, we break after processing the most recent one
                            break;
                        }
                    }
                }
                if (bookFound) break;
            }
        }

        if (pchanged) {
            user.markModified('orders');
            await user.save();
        }

        res.json({
            message: pchanged ? 'Reading progress updated' : 'No change',
            booksRead: user.booksRead,
            hasStarted: true,
            progress: modifiedItem ? modifiedItem.progress : 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Return Book Route
router.put('/return/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { bookId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let bookFound = false;
        let pchanged = false;
        let bookTitle = ''; // Capture title

        if (user.orders && user.orders.length > 0) {
            for (let i = user.orders.length - 1; i >= 0; i--) {
                const order = user.orders[i];
                if (order.items && order.items.length > 0) {
                    for (let j = 0; j < order.items.length; j++) {
                        const item = order.items[j];
                        // Robust ID matching
                        if (item.id === bookId || item.googleId === bookId || (item._id && item._id.toString() === bookId)) {
                            // Only return if it's NOT already returned
                            if (!item.returned) {
                                item.returned = true;
                                item.returnedDate = new Date();
                                bookFound = true;
                                bookTitle = item.title; // Capture title
                                pchanged = true;
                                break; // Stop looking once we return ONE active copy
                            }
                            // If it IS returned, just continue looking for an active one. 
                            // Don't error out yet.
                        }
                    }
                }
                if (bookFound) break;
            }
        }

        if (!bookFound) {
            return res.status(404).json({ message: 'Book not found in user orders' });
        }

        if (pchanged) {
            user.markModified('orders');
            await user.save();

            // Increase book availability
            try {
                // Try to find book by googleId or _id
                let book = await Book.findOne({ googleId: bookId });
                if (!book && bookId.match(/^[0-9a-fA-F]{24}$/)) {
                    book = await Book.findById(bookId);
                }

                if (book) {
                    book.available = (book.available || 0) + 1;
                    await book.save();
                    console.log(`Increased availability for ${book.title} to ${book.available}`);
                } else {
                    console.warn(`Book not found in inventory for return update: ${bookId}`);
                }
            } catch (stockError) {
                console.error('Failed to update book availability:', stockError);
            }
        }

        // Create Notification
        try {
            await createNotification(
                'book_returned',
                `Returned: ${bookTitle}`,
                { userId: user._id, bookId, bookTitle }
            );
        } catch (notifError) {
            console.error('Failed to create return notification:', notifError);
        }

        res.json({ message: 'Book returned successfully', returnedDate: new Date() });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Renew Book Route
router.put('/renew/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { bookId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let bookFound = false;
        let pchanged = false;
        let bookTitle = '';
        let newDueDate = null;

        // Iterate orders reversed (newest first)
        if (user.orders && user.orders.length > 0) {
            for (let i = user.orders.length - 1; i >= 0; i--) {
                const order = user.orders[i];
                if (order.items && order.items.length > 0) {
                    for (let j = 0; j < order.items.length; j++) {
                        const item = order.items[j];
                        // Match by ID
                        if ((item.id === bookId || item.googleId === bookId || (item._id && item._id.toString() === bookId)) && !item.returned) {
                            bookFound = true;
                            bookTitle = item.title;

                            // Validation: Minimum 5 Days Possession
                            const orderDate = new Date(order.date);
                            const now = new Date();
                            const possessionDays = (now - orderDate) / (1000 * 60 * 60 * 24);

                            if (possessionDays < 5) {
                                return res.status(400).json({
                                    message: `You must keep the book for at least 5 days before renewing. Currently held for ${possessionDays.toFixed(1)} days.`
                                });
                            }

                            // Calculate Extension
                            const membership = user.membership || 'regular';
                            const durationDays = MEMBERSHIP_RULES[membership]?.durationDays || 7;

                            // Determine ref date (overdue ? now : currentDueDate)
                            // If legacy item has no dueDate, calculate default
                            let currentDueDate = item.dueDate ? new Date(item.dueDate) : new Date(orderDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

                            if (currentDueDate < now) {
                                currentDueDate = now;
                            }

                            newDueDate = new Date(currentDueDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
                            item.dueDate = newDueDate;
                            pchanged = true;
                            break;
                        }
                    }
                }
                if (bookFound) break;
            }
        }

        if (!bookFound) return res.status(404).json({ message: 'Active book not found in orders' });

        if (pchanged) {
            user.markModified('orders');
            await user.save();

            try {
                await createNotification(
                    'book_renewed',
                    `Renewed: ${bookTitle}`,
                    { userId: user._id, bookId, bookTitle, newDueDate }
                );
            } catch (e) {
                console.error('Notification failed', e);
            }
        }

        res.json({ message: 'Book renewed successfully', dueDate: newDueDate });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const message = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h1 style="color: #4F46E5;">Password Reset Request 🔒</h1>
                <p>Hi ${user.name},</p>
                <p>You requested a password reset. Here is your OTP code:</p>
                <h2 style="background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 8px; color: #4F46E5;">${otp}</h2>
                <p>This code expires in 10 minutes.</p>
                <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Bookify Password Reset OTP',
            html: message
        });

        res.json({ message: 'OTP sent to email' });

    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });

    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.password = newPassword; // Saving plain text as per existing pattern
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });

    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
