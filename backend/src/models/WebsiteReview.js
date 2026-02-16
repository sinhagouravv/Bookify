const mongoose = require('mongoose');

const websiteReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        default: 'Student'
    },
    text: {
        type: String,
        required: true
    },
    ratings: {
        type: [Number],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('WebsiteReview', websiteReviewSchema);
