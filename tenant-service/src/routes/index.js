const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { authMiddleware } = require('../middleware/auth');

// Super admin routes
router.post('/superadmin/tenants', authMiddleware, tenantController.createTenant);
router.post('/superadmin/tenants/:tenantId/users', authMiddleware, tenantController.createUser);
router.get('/superadmin/tenants', authMiddleware, tenantController.getAllTenants);
router.delete('/superadmin/tenants/:tenantId', authMiddleware, tenantController.deleteTenant);

// Public routes
router.get('/tenants', tenantController.getAllTenants);
router.get('/tenants/:tenantId', tenantController.getTenantById);

module.exports = router;