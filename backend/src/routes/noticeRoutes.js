const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
    getNotices,
    getNoticeById,
    createNotice,
    updateNotice,
    deleteNotice,
} = require('../controllers/noticeController');

const router = express.Router();

// Enforce authentication across all notice endpoints
router.use(authenticateToken);

/**
 * Route: GET /
 * Purpose: List notices with role-based visibility and scope filtering
 */
router.get('/', getNotices);

/**
 * Route: POST /
 * Purpose: Create a new notice (PRINCIPAL role only)
 */
router.post('/', createNotice);

/**
 * Route: GET /:id
 * Purpose: Fetch single notice by ID with role check and author draft protection
 */
router.get('/:id', getNoticeById);

/**
 * Route: PUT /:id
 * Purpose: Edit existing notice (author only)
 */
router.put('/:id', updateNotice);

/**
 * Route: DELETE /:id
 * Purpose: Delete notice (author only)
 */
router.delete('/:id', deleteNotice);

module.exports = router;
