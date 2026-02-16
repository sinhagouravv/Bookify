const express = require('express');
const router = express.Router();
const { createMessage, getAllMessages, deleteMessage } = require('../controllers/messageController');

router.post('/', createMessage);
router.get('/', getAllMessages);
router.delete('/:id', deleteMessage);

module.exports = router;
