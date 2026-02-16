const Review = require('../models/Review');
const User = require('../models/user/User');

const fallbackReviews = [
    {
        bookId: 'google_id_1',
        bookTitle: 'The Great Gatsby',
        rating: 5,
        comment: 'An absolute classic. The depiction of the jazz age is mesmerizing.',
        createdAt: new Date('2023-10-15')
    },
    {
        bookId: 'google_id_2',
        bookTitle: '1984',
        rating: 4,
        comment: 'Chilling and prophetic. A must-read for everyone.',
        createdAt: new Date('2023-11-20')
    },
    {
        bookId: 'google_id_3',
        bookTitle: 'To Kill a Mockingbird',
        rating: 5,
        comment: 'Deeply moving and impactful. Scout is an unforgettable character.',
        createdAt: new Date('2024-01-05')
    },
    {
        bookId: 'google_id_4',
        bookTitle: 'Pride and Prejudice',
        rating: 4,
        comment: 'A delightful romance with sharp social commentary.',
        createdAt: new Date('2024-02-14')
    },
    {
        bookId: 'google_id_5',
        bookTitle: 'The Catcher in the Rye',
        rating: 3,
        comment: 'Interesting perspective, but I found the protagonist a bit annoying.',
        createdAt: new Date('2024-03-10')
    }
];

exports.getAllReviews = async (req, res) => {
    try {
        let reviews = await Review.find().populate('user', 'name email').sort({ createdAt: -1 });

        if (reviews.length === 0) {
            // Seed if empty
            const users = await User.find().limit(5);
            if (users.length > 0) {
                console.log('Seeding reviews...');
                const seededReviews = fallbackReviews.map((review, index) => ({
                    ...review,
                    user: users[index % users.length]._id // Distribute among available users
                }));
                reviews = await Review.insertMany(seededReviews);
                // Re-fetch to populate
                reviews = await Review.find().populate('user', 'name email').sort({ createdAt: -1 });
            }
        }

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
