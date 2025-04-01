const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { authMiddleware } = require('../middleware/auth');

// Super admin routes
router.post('/superadmin/tenants', authMiddleware, tenantController.createTenant);
router.post('/superadmin/tenants/:tenantId/users', authMiddleware, tenantController.createUser);
router.get('/superadmin/tenants', authMiddleware, tenantController.getAllTenants);
router.delete('/superadmin/tenants/:tenantId', authMiddleware, tenantController.deleteTenant);

// Admin routes
router.post('/tenants/:tenantId/complete-profile', authMiddleware, tenantController.completeProfile);

// Public routes
router.get('/tenants', tenantController.getAllTenants);

router.get('/tenants/:tenantId/details', authMiddleware, tenantController.getTenantDetails);
// GET ROLES for a tenant


router.post('/tenants/:tenantId/departments', authMiddleware, tenantController.createDepartment);
router.post('/tenants/:tenantId/roles', authMiddleware, tenantController.createRole);

// GET USERS for a tenant by role
router.get('/tenants/:tenantId/users/role/:roleId', authMiddleware, tenantController.getUsers);


router.post('/tenants/:tenantId/users', authMiddleware, tenantController.createUser);

router.get('/tenants/:tenantId', tenantController.getTenantById);

module.exports = router;