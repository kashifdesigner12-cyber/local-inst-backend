const express = require('express');
const router = express.Router();

const {
  sendAbsentTest
} = require('../controllers/whatsappController');

router.post('/test-absent', sendAbsentTest);

module.exports = router;