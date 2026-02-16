const Message = require('../models/Message');
const sendEmail = require('../utils/email');
const { createNotification } = require('./notificationController');

// @desc    Create a new message (Contact Form)
// @route   POST /api/messages
// @access  Public
exports.createMessage = async (req, res) => {
    try {
        const { name, email, message: messageContent } = req.body;
        // Default subject since we removed it from frontend
        const subject = req.body.subject || 'New Inquiry';

        if (!name || !email || !messageContent) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const newMessage = await Message.create({
            name,
            email,
            subject,
            message: messageContent
        });

        // Send Auto-Reply Email (Fire and Forget - Don't await)
        const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #333; line-height: 1.6; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    // <div style="background: #4F46E5; padding: 30px; text-align: center;">
                    //      <h1 style="color: white; margin: 0; font-size: 24px;">Message Received! 📬</h1>
                    // </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;">Hi ${name},</p>
                        <p style="color: #4b5563;">Thank you for contacting <strong>Bookifyyy</strong>. We have successfully received your message and our team is currently reviewing it.</p>
                        <p style="color: #4b5563;">We appreciate your patience and look forward to assisting you.</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                            Warm regards, <br/>
                            <strong style="color: #4F46E5;">Bookifyyy Support Team</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;

        sendEmail({
            email: email,
            subject: `We received your message: ${subject}`,
            html: emailHtml
        }).catch(err => console.error('Failed to send auto-reply email (background):', err));

        // Notify Admins (Fire and Forget)
        createNotification(
            'new_message',
            `New Contact Message from ${name}`,
            { messageId: newMessage._id, subject: subject }
        ).catch(err => console.error('Failed to create notification (background):', err));

        res.status(201).json({
            success: true,
            data: newMessage,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private (Admin)
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (Admin)
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await message.deleteOne();

        res.status(200).json({ success: true, data: {}, message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
