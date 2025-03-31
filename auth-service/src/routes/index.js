const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// Example route for login
router.post('/login', authController.login);

// Example route for registration
router.post('/register', authController.register);

// Add the /me route
router.get("/me", authController.getCurrentUser);

// Route for verifying OTP
router.post('/verify-otp', authController.verifyOTP);

// Route for resending OTP
router.post('/resend-otp', authController.resendOTP);

router.get('/users/:id', authController.getUserById);

// Route for resetting password
router.post('/reset-password', authController.resetPassword);


// Route for refreshing token
router.post('/refresh-token', authController.refreshToken);

// Route for logout
router.post('/logout', authController.logout);

router.get("/users", authController.getUsersByRoleAndTenant);

// Route for forgot password
router.post('/forgot-password', authController.forgotPassword);


// Add the route for creating roles
router.post('/roles', authController.createRole);
router.get('/roles', authController.getAllRoles);
// Route for deleting account
router.post('/delete-account', authController.deleteAccount);

module.exports = router;