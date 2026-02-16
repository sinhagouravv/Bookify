const express = require('express');
const router = express.Router();
const bookController = require('../controllers/books');
const syncController = require('../controllers/syncController');

router.get('/sync', syncController.syncBooksDebug);
router.get('/sync-status', syncController.getSyncStatus);
router.get('/count', bookController.getBookCount);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookController.createBook);
router.post('/notify/:id', bookController.subscribeToWaitlist);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
// Cleanup Route
router.post('/cleanup-duplicates', bookController.cleanupDuplicates);

router.post('/checkout', bookController.checkout);

module.exports = router;
