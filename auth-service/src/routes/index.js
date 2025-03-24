const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const tenantController = require('../controllers/tenantController'); // Import tenantController

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

// Route for resetting password
router.post('/reset-password', authController.resetPassword);


// Route for refreshing token
router.post('/refresh-token', authController.refreshToken);

// Route for logout
router.post('/logout', authController.logout);

// Route for forgot password
router.post('/forgot-password', authController.forgotPassword);

// Tenant routes
router.get('/tenants', tenantController.getAllTenants); // Fetch all tenants
router.get('/tenants/:tenantId', tenantController.getTenantById); // Fetch a tenant by ID


// Route for deleting account
router.post('/delete-account', authController.deleteAccount);

module.exports = router;