const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const attendanceRoutes = require('./routes/attendance');
const expenseRoutes = require('./routes/expense');
const creditRoutes = require('./routes/credit');
const reconciliationRoutes = require('./routes/reconciliation');

dotenv.config();

connectDB();

const app = express();

app.use(cors(
    {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

//Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tanks', require('./routes/tanks'));
app.use('/api/pumps', require('./routes/pump'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/inventory-sales', require('./routes/inventorySales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/suppliers', require('./routes/supplier'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/attendance', attendanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/reconciliation', reconciliationRoutes);

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.json({ message: 'Petrol Pump Management API', version: '1.0.0' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});