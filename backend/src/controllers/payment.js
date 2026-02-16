const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createNotification } = require('./notificationController');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const User = require('../models/user/User');

const MEMBERSHIP_RULES = {
    'regular': { monthlyLimit: 5, durationDays: 7 }, // Default fallback
    'basic': { monthlyLimit: 10, durationDays: 7 },
    'premium': { monthlyLimit: 20, durationDays: 15 },
    'elite': { monthlyLimit: 30, durationDays: 30 }
};

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', userId, items } = req.body;

        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        // --- Monthly Limit Check ---
        if (userId && items) {
            const user = await User.findById(userId);
            if (user) {
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

                const requestedQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const totalRequired = activeBookCount + requestedQuantity;

                if (totalRequired > rules.monthlyLimit) {
                    // Find recommended plan
                    let recommendedPlan = null;
                    const plans = [
                        { name: 'Basic', limit: 10 },
                        { name: 'Premium', limit: 20 },
                        { name: 'Elite', limit: 30 }
                    ];

                    for (const plan of plans) {
                        if (plan.limit >= totalRequired) {
                            recommendedPlan = plan.name;
                            break;
                        }
                    }

                    let message;
                    if (recommendedPlan) {
                        message = `Limit exceeded. You are currently holding ${activeBookCount} books and trying to issue ${requestedQuantity}. Total ${totalRequired} exceeds your ${membershipType} plan limit of ${rules.monthlyLimit}. Please return some books or upgrade to ${recommendedPlan}.`;
                    } else {
                        message = `Limit exceeded. You are currently holding ${activeBookCount} books and trying to issue ${requestedQuantity}. Total ${totalRequired} exceeds the maximum limit (30). Please return some books.`;
                    }

                    return res.status(400).json({ message });
                }
            }
        }
        // ---------------------------

        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            res.json({
                message: 'Payment verified successfully',
                success: true,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            });
        } else {
            res.status(400).json({
                message: 'Invalid signature',
                success: false
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getRazorpayKey = (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
};

// Upgrade Membership
exports.upgradeMembership = async (req, res) => {
    try {
        const { userId, plan, paymentId, orderId } = req.body;

        // Basic validation
        if (!userId || !plan) {
            return res.status(400).json({ message: 'User ID and Plan are required' });
        }

        const User = require('../models/user/User');
        const sendEmail = require('../utils/email');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update membership
        user.membership = plan.toLowerCase(); // 'premium', 'elite'

        // Optionally track this transaction in user orders or a separate transactions array
        // For now, we'll just update the membership and maybe push a mock order or transaction log if needed
        // pushing to orders as a record
        const orderDate = new Date();
        const price = plan === 'Basic' ? 9 : (plan === 'Premium' ? 19 : 29);

        user.orders.push({
            date: orderDate,
            items: [{ title: `${plan} Membership`, quantity: 1, id: 'membership', price: price }],
            total: price,
            subtotal: price,
            gst: 0,
            platformFee: 0,
            membershipDiscount: 0,
            couponDiscount: 0,
            paymentId,
            orderId,
            type: 'subscription'
        });

        user.markModified('orders');
        await user.save();

        // Send Email
        try {
            const message = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h1 style="color: #4F46E5;">Welcome to Bookify ${plan}! 🌟</h1>
                    <p>Hi ${user.name},</p>
                    <p>Congratulations! You have successfully upgraded to the <strong>${plan}</strong> plan.</p>
                    <p>Enjoy exclusive benefits and unlimited reading.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Happy Reading, <br/>
                        The Bookify Team
                    </p>
                </div>
            `;
            await sendEmail({
                email: user.email,
                subject: `Welcome to Bookify ${plan}`,
                html: message
            });
        } catch (emailError) {
            console.error('Subscription email failed:', emailError.message);
        }

        // Create Notification
        await createNotification(
            'membership_upgraded',
            `User ${user.name} upgraded to ${plan} plan`,
            { userId: user._id, plan, amount: price, paymentId }
        );

        res.json({
            success: true,
            message: `Upgraded to ${plan} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                membership: user.membership,
                orders: user.orders
            }
        });

    } catch (error) {
        console.error('Error upgrading membership:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
