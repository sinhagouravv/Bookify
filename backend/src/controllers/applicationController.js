const User = require('../models/user/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/email');

// @desc    Submit a new application
// @route   POST /api/applications
// @access  Public
exports.createApplication = async (req, res) => {
    try {
        let { type, formData, userId } = req.body;
        console.log('Received Application Submission:', { type, userId, hasFormData: !!formData });

        // Parse formData if it's a string (which it will be from FormData submission)
        if (typeof formData === 'string') {
            try {
                formData = JSON.parse(formData);
            } catch (e) {
                console.error('Error parsing formData JSON:', e);
                return res.status(400).json({ success: false, message: 'Invalid formData format' });
            }
        }

        if (!type || !formData) {
            return res.status(400).json({ success: false, message: 'Please provide application type and data' });
        }

        const applicationData = {
            type,
            formData,
            userId: userId || null
        };

        // Handle File Upload
        if (req.file) {
            applicationData.cvUrl = req.file.path.replace(/\\/g, "/"); // normalize path
        }

        const application = await Application.create(applicationData);

        // Send Confirmation Email (Fire and Forget - Don't await)
        const email = formData.email;
        if (email) {
            const message = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Application Received</title>
                </head>
                <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <!-- Header -->
                        <div style="background-color: #111827; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">BOOKIFYYY</h1>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #111827; margin-top: 0; font-size: 22px; text-align: center;">Application Received</h2>
                            <p style="color: #4b5563; font-size: 16px;">Dear ${formData.name || 'Applicant'},</p>
                            <p style="color: #4b5563; font-size: 16px;">Thank you for your interest in joining the Bookify community! We have successfully received your application to become a <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>.</p>
                            
                            <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Application ID:</strong> ${application._id}</p>
                                <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>

                            <p style="color: #4b5563; font-size: 16px;">Our team is currently reviewing your details. You will receive another email once a decision has been made.</p>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:5173/profile?tab=notifications" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Application Status</a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} Bookifyyy. All rights reserved.</p>
                            <div style="margin-top: 10px;">
                                <a href="#" style="color: #9ca3af; text-decoration: none; font-size: 12px; margin: 0 5px;">Privacy Policy</a>
                                <span style="color: #d1d5db;">|</span>
                                <a href="#" style="color: #9ca3af; text-decoration: none; font-size: 12px; margin: 0 5px;">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            sendEmail({
                email: email,
                subject: 'We received your application! - Bookifyyy',
                html: message
            }).catch(emailError => console.error('Email sending failed (background):', emailError));
        }

        res.status(201).json({
            success: true,
            data: application,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        console.error('Create Application Error Details:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private (Admin)
exports.getApplications = async (req, res) => {
    try {
        const applications = await Application.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        console.error('Get Applications Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Admin)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        console.log('Updating Application Status:', { id: application._id, status, userId: application.userId });

        // Update User Role if Approved
        if (status === 'approved' && application.userId) {
            try {
                // Capitalize the first letter of the application type (e.g., 'moderator' -> 'Moderator')
                const newRole = application.type.charAt(0).toUpperCase() + application.type.slice(1);

                await User.findByIdAndUpdate(application.userId, { role: newRole });
                console.log(`User ${application.userId} role updated to ${newRole}`);
            } catch (roleError) {
                console.error('Error updating user role:', roleError);
            }
        }

        // Send Status Update Email
        const email = application.formData.email;
        if (email) {
            const subject = `Application ${status.charAt(0).toUpperCase() + status.slice(1)} - Bookify`;
            const color = status === 'approved' ? '#059669' : '#DC2626';
            const message = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${color};">Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                    <p>Dear ${application.formData.name || 'Applicant'},</p>
                    <p>Your application for <strong>${application.type.charAt(0).toUpperCase() + application.type.slice(1)}</strong> has been <strong>${status}</strong>.</p>
                    ${status === 'approved'
                    ? '<p>Congratulations! We are excited to have you on board. Our team will contact you shortly with further details.</p>'
                    : '<p>Thank you for your interest. Unfortunately, we cannot proceed with your application at this time.</p>'}
                    <br>
                    <p>Best Regards,</p>
                    <p>The Bookify Team</p>
                </div>
            `;
            try {
                await sendEmail({
                    email: email,
                    subject: subject,
                    html: message
                });
            } catch (emailError) {
                console.error('Status Email sending failed:', emailError);
            }
        }

        // Trigger In-App Notification (if linked to a user)
        if (application.userId) {
            console.log('Creating notification for user:', application.userId);
            try {
                await Notification.create({
                    type: 'application_status',
                    userId: application.userId,
                    message: `Your ${application.type} application has been ${status}.`,
                    data: { applicationId: application._id, status }
                });
                console.log('Notification created successfully');
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }
        } else {
            console.log('No userId found on application, skipping notification');
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
