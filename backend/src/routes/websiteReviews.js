const express = require('express');
const router = express.Router();
const WebsiteReview = require('../models/WebsiteReview');

// GET all reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await WebsiteReview.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new review
router.post('/', async (req, res) => {
    const { user, name, designation, text, ratings } = req.body;

    // Basic validation
    if (!name || !text) {
        return res.status(400).json({ message: "Name and Review Text are required." });
    }

    const review = new WebsiteReview({
        user, // Optional
        name,
        designation: designation || 'Student',
        text,
        ratings: ratings || [] // Optional initial ratings
    });

    try {
        const newReview = await review.save();
        res.status(201).json(newReview);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH to add a rating to a review (for "Rate this review" feature)
router.patch('/:id/rate', async (req, res) => {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Valid rating (1-5) is required." });
    }

    try {
        const review = await WebsiteReview.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        review.ratings.push(rating);
        const updatedReview = await review.save();
        res.json(updatedReview);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE a review
router.delete('/:id', async (req, res) => {
    try {
        const review = await WebsiteReview.findById(req.params.id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        await review.deleteOne();
        res.json({ message: "Review deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
