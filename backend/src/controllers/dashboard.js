const Book = require('../models/Book');
const User = require('../models/user/User');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Total Books & Users
        const totalBooks = await Book.countDocuments();
        const totalUsers = await User.countDocuments();

        // 2. Aggregate Orders Data (Revenue, Books Issued, Monthly Trends) & Calculate Trends
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const twoWeeksAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);

        // Helper to get counts for ranges
        const getCountInRange = async (Model, start, end) => {
            return await Model.countDocuments({
                createdAt: { $gte: start, $lt: end }
            });
        };

        const booksThisWeek = await getCountInRange(Book, oneWeekAgo, now);
        const booksLastWeek = await getCountInRange(Book, twoWeeksAgo, oneWeekAgo);
        const booksTrend = booksLastWeek === 0 ? 100 : Math.round(((booksThisWeek - booksLastWeek) / booksLastWeek) * 100);

        const usersThisWeek = await getCountInRange(User, oneWeekAgo, now);
        const usersLastWeek = await getCountInRange(User, twoWeeksAgo, oneWeekAgo);
        const usersTrend = usersLastWeek === 0 ? 100 : Math.round(((usersThisWeek - usersLastWeek) / usersLastWeek) * 100);

        // Order Stats Aggregation
        const orderStats = await User.aggregate([
            { $unwind: "$orders" },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$orders.total" },
                    totalBooksIssued: {
                        $sum: {
                            $reduce: {
                                input: "$orders.items",
                                initialValue: 0,
                                in: { $add: ["$$value", "$$this.quantity"] }
                            }
                        }
                    },
                    // Calculate revenue and issued stats for this week and last week
                    revenueThisWeek: {
                        $sum: {
                            $cond: [
                                { $gte: ["$orders.date", oneWeekAgo] },
                                "$orders.total",
                                0
                            ]
                        }
                    },
                    revenueLastWeek: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gte: ["$orders.date", twoWeeksAgo] }, { $lt: ["$orders.date", oneWeekAgo] }] },
                                "$orders.total",
                                0
                            ]
                        }
                    },
                    issuedThisWeek: {
                        $sum: {
                            $cond: [
                                { $gte: ["$orders.date", oneWeekAgo] },
                                {
                                    $reduce: {
                                        input: "$orders.items",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.quantity"] }
                                    }
                                },
                                0
                            ]
                        }
                    },
                    issuedLastWeek: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gte: ["$orders.date", twoWeeksAgo] }, { $lt: ["$orders.date", oneWeekAgo] }] },
                                {
                                    $reduce: {
                                        input: "$orders.items",
                                        initialValue: 0,
                                        in: { $add: ["$$value", "$$this.quantity"] }
                                    }
                                },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const revenue = orderStats[0]?.totalRevenue || 0;
        const booksIssued = orderStats[0]?.totalBooksIssued || 0;

        const revenueThisWeek = orderStats[0]?.revenueThisWeek || 0;
        const revenueLastWeek = orderStats[0]?.revenueLastWeek || 0;
        const revenueTrend = revenueLastWeek === 0 ? 100 : Math.round(((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100);

        const issuedThisWeek = orderStats[0]?.issuedThisWeek || 0;
        const issuedLastWeek = orderStats[0]?.issuedLastWeek || 0;
        const issuedTrend = issuedLastWeek === 0 ? 100 : Math.round(((issuedThisWeek - issuedLastWeek) / issuedLastWeek) * 100);

        // 3. Monthly Trends (Last 12 Months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1); // Start of the month

        const monthlyTrends = await User.aggregate([
            { $unwind: "$orders" },
            {
                $match: {
                    "orders.date": { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$orders.date" },
                        year: { $year: "$orders.date" }
                    },
                    count: { $sum: 1 } // Number of orders per month (or books issued if preferred)
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Weekly Trends (Last 7 Weeks)
        const sevenWeeksAgo = new Date();
        sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49); // 7 weeks ago
        sevenWeeksAgo.setHours(0, 0, 0, 0);

        const weeklyTrends = await User.aggregate([
            { $unwind: "$orders" },
            {
                $match: {
                    "orders.date": { $gte: sevenWeeksAgo }
                }
            },
            {
                $group: {
                    _id: {
                        week: { $isoWeek: "$orders.date" },
                        year: { $year: "$orders.date" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } }
        ]);

        const weeks = [];
        const currentData = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(currentData);
            d.setDate(d.getDate() - (i * 7));

            // Get week number and year
            const tempDate = new Date(d.valueOf());
            tempDate.setHours(0, 0, 0, 0);
            tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
            const weekNum = Math.floor((tempDate.getTime() - new Date(tempDate.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
            const yearNum = tempDate.getFullYear();

            const stat = weeklyTrends.find(w => w._id.week === weekNum && w._id.year === yearNum);
            weeks.push({
                name: `${d.toLocaleString('default', { month: 'short' })} W${Math.ceil(d.getDate() / 7)}`,
                value: stat ? stat.count : 0
            });
        }

        // Format trends for frontend (array of values)
        // Ensure all 12 months are represented even if 0
        const months = [];
        const currentDateForMonths = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(currentDateForMonths.getFullYear(), currentDateForMonths.getMonth() - i, 1);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const monthNum = d.getMonth() + 1;
            const yearNum = d.getFullYear();

            const stat = monthlyTrends.find(m => m._id.month === monthNum && m._id.year === yearNum);
            months.push({
                name: monthName,
                value: stat ? stat.count : 0
            });
        }

        // 4. Recent Activity
        const recentActivity = await User.aggregate([
            { $unwind: "$orders" },
            { $sort: { "orders.date": -1 } },
            { $limit: 5 },
            {
                $project: {
                    userName: "$name",
                    userEmail: "$email",
                    orderId: "$orders.orderId",
                    amount: "$orders.total",
                    date: "$orders.date",
                    items: "$orders.items"
                }
            }
        ]);

        res.json({
            totalBooks,
            totalUsers,
            booksIssued,
            revenue,
            monthlyTrends: months,
            weeklyTrends: weeks,
            recentActivity,
            trends: {
                books: booksTrend,
                users: usersTrend,
                issued: issuedTrend,
                revenue: revenueTrend
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
