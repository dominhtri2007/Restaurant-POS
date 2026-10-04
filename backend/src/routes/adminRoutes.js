const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const menuController = require('../controllers/menuController');
const { requireAuth, requireAdmin, requirePermission, requireAdminAccess } = require('../middlewares/authMiddleware');

router.use(requireAuth);
router.use(requireAdminAccess);

router.get('/tables', adminController.getTables);

router.post('/tables', adminController.createTable);

router.put('/tables/:id', adminController.updateTable);

router.delete('/tables/:id', adminController.deleteTable);

router.get('/orders/pending', adminController.getPendingOrders);

router.put('/orders/:id/approve', adminController.approveOrder);

router.put('/orders/:id/reject', adminController.rejectOrder);

router.put('/tables/:id/all-served', adminController.markTableAllServed);

router.post('/tables/:id/clear', adminController.clearTable);

router.get('/tables/:id/orders', adminController.getTableOrders);

router.post('/tables/:id/items', adminController.addTableItem);

router.put('/order-items/:id', adminController.updateOrderItem);

router.delete('/order-items/:id', adminController.deleteOrderItem);

router.get('/reports/summary', requirePermission('reports'), adminController.getReportsSummary);

router.get('/tables/qrcodes', adminController.getTablesWithQR);

router.get('/categories', menuController.getCategories);
router.post('/categories', requirePermission('menu'), menuController.createCategory);
router.put('/categories/:id', requirePermission('menu'), menuController.updateCategory);
router.delete('/categories/:id', requirePermission('menu'), menuController.deleteCategory);

router.get('/products', menuController.getProducts);
router.post('/products', requirePermission('menu'), menuController.createProduct);
router.put('/products/:id', requirePermission('menu'), menuController.updateProduct);
router.delete('/products/:id', requirePermission('menu'), menuController.deleteProduct);
router.patch('/products/:id/toggle-availability', requirePermission('menu'), menuController.toggleProductAvailability);

router.get('/users', requirePermission('users'), adminController.getUsers);
router.post('/users', requirePermission('users'), adminController.createUser);
router.put('/users/:id', requirePermission('users'), adminController.updateUser);
router.delete('/users/:id', requirePermission('users'), adminController.deleteUser);

router.get('/pos/shift-status', adminController.getShiftStatus);
router.post('/pos/close-shift', requirePermission('pos'), adminController.closeShift);
router.post('/pos/open-shift', requirePermission('pos'), adminController.openShift);

module.exports = router;
