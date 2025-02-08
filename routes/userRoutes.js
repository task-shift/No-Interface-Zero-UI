const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Define the route for getting user information
router.get('/user', userController.getUser);

module.exports = router;
