const express = require('express');
const router = express.Router();
const Admin = require('../../models/admin/Admin');

// Admin Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (admin.password !== password) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            isAdmin: true, // Always true for Admin model
            token: 'dummy-token'
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
