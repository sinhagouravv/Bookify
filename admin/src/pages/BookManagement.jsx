import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Filter, MoreVertical, Book } from 'lucide-react';

const CATEGORIES = [
    'Science Fiction', 'Self-Help', 'Thriller', 'Biography', 'Classic',
    'Fantasy', 'History', 'Programming', 'Psychology', 'Romance',
    'Business & Economics', 'Philosophy', 'Health & Fitness', 'Travel & Adventure', 'Poetry',
    'Children’s Books', 'Mystery & Detective', 'Comics & Graphic Novels', 'Cooking & Food', 'Art & Photography'
];

const BookManagement = () => {
    const [books, setBooks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);

    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        stock: ''
    });

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        category: '',
        quantity: 1,
        available: 1
    });

    const [editingId, setEditingId] = useState(null);
    const [viewingBook, setViewingBook] = useState(null); // For "More" details

    useEffect(() => {
        fetchBooks(currentPage);
    }, [currentPage, filters]); // Re-fetch when page or filters change

    const fetchBooks = async (page) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page,
                limit: 8,
                ...(filters.category && { category: filters.category }),
                ...(filters.stock && { stock: filters.stock })
            });

            const response = await fetch(`http://localhost:5001/api/books?${queryParams}`);
            const data = await response.json();

            // Check if response is paginated (has books array) or array (legacy/error fallback)
            if (data.books) {
                setBooks(data.books);
                setTotalPages(data.totalPages);
                setTotalBooks(data.totalBooks);
                setCurrentPage(data.currentPage);
            } else if (Array.isArray(data)) {
                // Fallback if backend rollout isn't instant or dev env quirks
                setBooks(data);
                setTotalPages(1);
                setTotalBooks(data.length);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching books:', error);
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const clearFilters = () => {
        setFilters({ category: '', stock: '' });
        setCurrentPage(1);
        setShowFilter(false);
    };

    const handleEdit = (book) => {
        setFormData({
            title: book.title,
            author: book.author,
            category: book.category,
            quantity: book.quantity,
            available: book.available
        });
        setEditingId(book.id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `http://localhost:5001/api/books/${editingId}`
                : 'http://localhost:5001/api/books';

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchBooks(currentPage);
                setIsModalOpen(false);
                setFormData({ title: '', author: '', category: '', quantity: 1, available: 1 });
                setEditingId(null);
            }
        } catch (error) {
            console.error('Error saving book:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await fetch(`http://localhost:5001/api/books/${id}`, { method: 'DELETE' });
                fetchBooks(currentPage);
            } catch (error) {
                console.error('Error deleting book:', error);
            }
        }
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Books Inventory</h1>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', author: '', category: '', quantity: 1, available: 1 });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium active:scale-95"
                >
                    <Plus size={20} />
                    Add New Book
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 pt-5 pb-0 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search books by title, author, or category..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center justify-center gap-2 w-55 py-2 border rounded-lg text-sm transition-colors ${(filters.category || filters.stock)
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Filter size={18} />
                            <span>Filter</span>
                            {(filters.category || filters.stock) && (
                                <span className="ml-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
                            )}
                        </button>

                        {showFilter && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-100">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Category</label>
                                        <select
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                            value={filters.category}
                                            onChange={(e) => handleFilterChange('category', e.target.value)}
                                        >
                                            <option value="">All Categories</option>
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Stock Status</label>
                                        <select
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                            value={filters.stock}
                                            onChange={(e) => handleFilterChange('stock', e.target.value)}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="in_stock">In Stock</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100 flex justify-between">
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => setShowFilter(false)}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Book Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Stock Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-1 text-gray-400">Loading inventory...</td></tr>
                            ) : filteredBooks.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-500">No books found matching your search.</td></tr>
                            ) : (
                                filteredBooks.map((book) => (
                                    <tr key={book.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-14 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                                                    {book.image ? (
                                                        <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Book size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors max-w-[200px] truncate" title={book.title}>{book.title}</div>
                                                    <div className="text-sm text-gray-500">{book.author}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {book.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-bold ${book.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {book.available > 0 ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {book.available} of {book.quantity} available
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleEdit(book)}
                                                    className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(book.id)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setViewingBook(book)}
                                                    className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors"
                                                    title="More Details"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
                    <span>Showing {(currentPage - 1) * 8 + 1}-{Math.min(currentPage * 8, totalBooks)} of {totalBooks} results</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        {/* Simple Page Numbers */}
                        {(() => {
                            const windowSize = Math.min(5, totalPages);
                            let startPage = Math.max(1, currentPage - 2);

                            // Adjust start if window pushes past totalPages
                            if (startPage + windowSize - 1 > totalPages) {
                                startPage = Math.max(1, totalPages - windowSize + 1);
                            }

                            return Array.from({ length: windowSize }, (_, i) => {
                                const pageNum = startPage + i;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1 border rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            });
                        })()}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Book Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Book' : 'Add New Book'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Book Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. The Great Gatsby"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Author</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. F. Scott Fitzgerald"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="e.g. Fiction"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Available</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={formData.quantity}
                                                required
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                value={formData.available}
                                                onChange={(e) => setFormData({ ...formData, available: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5"
                                >
                                    {editingId ? 'Update Book' : 'Add Book'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingBook && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 pr-8">{viewingBook.title}</h2>
                            <button onClick={() => setViewingBook(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <div className="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                    {viewingBook.image ? (
                                        <img src={viewingBook.image} alt={viewingBook.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Book size={48} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Author</h3>
                                    <p className="text-gray-900 font-medium text-lg">{viewingBook.author}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                        {viewingBook.category}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {viewingBook.fullDescription || viewingBook.description || "No description available."}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex gap-4">
                                    <div className="text-center p-4 bg-gray-50 rounded-xl flex-1">
                                        <div className="text-2xl font-bold text-gray-900">{viewingBook.available}</div>
                                        <div className="text-xs text-gray-500 uppercase font-bold mt-1">Available</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-xl flex-1">
                                        <div className="text-2xl font-bold text-gray-900">{viewingBook.quantity}</div>
                                        <div className="text-xs text-gray-500 uppercase font-bold mt-1">Total Stock</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookManagement;
