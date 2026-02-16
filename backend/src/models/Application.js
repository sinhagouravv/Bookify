const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['partner', 'advertise', 'publisher', 'moderator', 'developer']
    },
    formData: {
        type: Object,
        required: true
    },
    cvUrl: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Application', applicationSchema);
