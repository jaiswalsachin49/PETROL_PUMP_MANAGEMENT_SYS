const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
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

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.json({ message: 'Petrol Pump Management API',version: '1.0.0' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});