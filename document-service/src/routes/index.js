const express = require('express');
const router = express.Router();
const { getDocuments } = require('../controllers/documentController');

// Define routes
router.get('/', getDocuments);

module.exports = router;