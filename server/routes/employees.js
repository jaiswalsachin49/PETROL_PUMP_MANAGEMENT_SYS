const express = require('express');
const {protect, authorize} = require('../middlewares/auth');
const {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} = require('../controllers/employeeController');

const router = express.Router();

router.route('/')
    .get(protect, getEmployees)
    .post(protect, authorize('admin', 'manager'), createEmployee);

router.route('/:id')
    .get(protect, getEmployee)
    .put(protect, authorize('admin', 'manager'), updateEmployee)
    .delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;