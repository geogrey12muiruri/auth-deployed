const express = require('express');
const { authenticateToken, restrictTo } = require('../middleware/auth');
const { getUsers, createUser, updateUser, addFeedback } = require('../controllers/userController');

const router = express.Router();

router.get('/', authenticateToken, getUsers);
router.post('/', authenticateToken, restrictTo('ADMIN', 'MANAGEMENT_REP'), createUser);
router.put('/:id', authenticateToken, restrictTo('ADMIN', 'MANAGEMENT_REP'), updateUser);
router.post('/feedback', authenticateToken, addFeedback);

module.exports = router;