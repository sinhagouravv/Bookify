const express = require('express');
const router = express.Router();
const { getAllReviews, deleteReview } = require('../controllers/reviews');

router.get('/', getAllReviews);
router.delete('/:id', deleteReview);

module.exports = router;
