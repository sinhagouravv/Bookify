import { useState, useEffect } from 'react';
import { MessageSquare, Search, Trash2, Star, BookOpen, User } from 'lucide-react';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/reviews');
            const data = await response.json();
            setReviews(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                await fetch(`http://localhost:5001/api/reviews/${id}`, { method: 'DELETE' });
                setReviews(reviews.filter(review => review._id !== id));
            } catch (error) {
                console.error('Error deleting review:', error);
            }
        }
    };

    const filteredReviews = reviews.filter(review =>
        review.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.user && review.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reviews & Ratings</h1>
                <p className="text-gray-500 mt-2 text-lg">Manage user feedback and book ratings.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search reviews by book or user..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                                <th className="px-6 py-4">Book</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4">Comment</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">Loading reviews...</td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">No reviews found.</td>
                                </tr>
                            ) : (
                                filteredReviews.map((review) => (
                                    <tr key={review._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <BookOpen size={16} />
                                                </div>
                                                <div className="font-medium text-gray-900">{review.bookTitle}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                    {review.user?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="text-sm text-gray-600">{review.user?.name || 'Unknown User'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Star className="text-amber-400 fill-amber-400" size={16} />
                                                <span className="text-sm font-medium text-gray-900">{review.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-xs truncate" title={review.comment}>
                                                {review.comment}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(review._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Review"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reviews;
