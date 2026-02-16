const express = require('express');
const router = express.Router();
const { createApplication, getApplications, updateApplicationStatus } = require('../controllers/applicationController');

const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'cv-' + Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('cv'), createApplication);
router.get('/', getApplications);
router.put('/:id/status', updateApplicationStatus);

module.exports = router;
