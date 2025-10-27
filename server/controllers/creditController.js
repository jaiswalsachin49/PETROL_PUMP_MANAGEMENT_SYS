const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Transaction = require('../models/Transaction');

// @desc Get all customers with credit  
// @route GET /api/credit/customers
// @access Private
const getCreditCustomers = async (req, res) => {
    try {
        const { saleType } = req.query;

        let query = { isActive: true };

        if (saleType) {
            query.saleType = saleType;
        } else {
            query.saleType = { $in: ['credit', 'fleet'] };
        }

        const customers = await Customer.find(query);
        const customersWithUtilization = customers.map(customer => ({
            ...customer.toObject(),
            creditUtilization: ((customer.outstandingBalance / customer.creditLimit) * 100).toFixed(2),
            availableCredit: customer.creditLimit - customer.outstandingBalance
        }));

        res.json({
            success: true,
            count: customers.length,
            data: customersWithUtilization
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get overdue customers
// @route GET /api/credit/overdue
// @access Private
const getOverdueCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({
            isActive: true,
            saleType: { $in: ['credit', 'fleet'] },
            outstandingBalance: { $gt: 0 }
        });

        const overdueCustomers = [];

        for (const customer of customers) {
            const lastPayment = await Transaction.findOne({
                customerId: customer._id,
                type: 'payment_received'
            }).sort({ date: -1 });

            const lastSale = await Sale.findOne({
                customerId: customer._id,
                saleType: { $in: ['credit', 'fleet'] }
            }).sort({ date: -1 });

            if (lastSale) {
                const saleDate = new Date(lastSale.date);
                const today = new Date();
                const daysSinceLastSale = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));

                const paymentTermDays = parseInt(customer.paymentTerms.match(/\d+/)?.[0] || 30);

                const daysOverdue = daysSinceLastSale - paymentTermDays;

                if (daysOverdue > 0) {
                    overdueCustomers.push({
                        ...customer.toObject(),
                        lastSaleDate: lastSale.date,
                        lastPaymentDate: lastPayment ? lastPayment.date : null,
                        daysSinceLastSale,
                        daysOverdue,
                        paymentTermDays,
                        overdueAmount: customer.outstandingBalance,
                        creditUtilization: ((customer.outstandingBalance / customer.creditLimit) * 100).toFixed(2)
                    });
                }
            }
        }

        overdueCustomers.sort((a, b) => b.daysOverdue - a.daysOverdue);

        const totalOverdueAmount = overdueCustomers.reduce((sum, cust) => sum + cust.outstandingBalance, 0);

        res.json({
            success: true,
            count: overdueCustomers.length,
            totalOverdueAmount,
            data: overdueCustomers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get customer statement
// @route GET /api/credit/statement/:customerId
// @access Private
const getCustomerStatement = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { startDate, endDate } = req.query;

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        let query = {
            customerId: customerId,
            $or: [
                { saleType: { $in: ['credit', 'fleet'] } },
                { type: 'payment_received' }
            ]
        };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const sales = await Sale.find({
            customerId: customerId,
            saleType: { $in: ['credit', 'fleet'] },
            ...(startDate && endDate && {
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            })
        }).sort({ date: 1 });

        const payments = await Transaction.find({
            customerId: customerId,
            type: 'payment_received',
            ...(startDate && endDate && {
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            })
        }).sort({ date: 1 });

        const transactions = [];
        let runningBalance = 0;

        sales.forEach(sale => {
            runningBalance += sale.totalAmount;
            transactions.push({
                date: sale.date,
                type: 'Sale',
                referenceId: sale.saleId,
                debit: sale.totalAmount,
                credit: 0,
                balance: runningBalance,
                description: `Fuel sale - ${sale.quantity}L ${sale.fuelType}`
            });
        });

        payments.forEach(payment => {
            runningBalance -= payment.amount;
            transactions.push({
                date: payment.date,
                type: 'Payment',
                referenceId: payment.transactionId,
                debit: 0,
                credit: payment.amount,
                balance: runningBalance,
                description: payment.description,
                paymentMethod: payment.paymentMethod
            });
        });

        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalDebits = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalCredits = payments.reduce((sum, payment) => sum + payment.amount, 0);

        res.json({
            success: true,
            data: {
                customer: {
                    customerId: customer.customerId,
                    name: customer.name,
                    companyName: customer.companyName,
                    creditLimit: customer.creditLimit,
                    outstandingBalance: customer.outstandingBalance,
                    paymentTerms: customer.paymentTerms
                },
                statement: {
                    startDate: startDate || transactions[0]?.date,
                    endDate: endDate || transactions[transactions.length - 1]?.date,
                    totalDebits,
                    totalCredits,
                    netBalance: totalDebits - totalCredits,
                    transactions
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get aging report
// @route GET /api/credit/aging
// @access Private
const getAgingReport = async (req, res) => {
    try {
        const customers = await Customer.find({
            isActive: true,
            saleType: { $in: ['credit', 'fleet'] },
            outstandingBalance: { $gt: 0 }
        });

        const agingData = [];
        const today = new Date();

        for (const customer of customers) {
            const sales = await Sale.find({
                customerId: customer._id,
                saleType: { $in: ['credit', 'fleet'] }
            }).sort({ date: 1 });


            const payments = await Transaction.find({
                customerId: customer._id,
                type: 'payment_received'
            });

            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);


            let current = 0;      
            let days30to60 = 0;   
            let days60to90 = 0;   
            let over90 = 0;       

            sales.forEach(sale => {
                const daysSinceSale = Math.floor((today - new Date(sale.date)) / (1000 * 60 * 60 * 24));

                if (daysSinceSale <= 30) {
                    current += sale.totalAmount;
                } else if (daysSinceSale <= 60) {
                    days30to60 += sale.totalAmount;
                } else if (daysSinceSale <= 90) {
                    days60to90 += sale.totalAmount;
                } else {
                    over90 += sale.totalAmount;
                }
            });

            const ratio = totalPaid / totalSales;
            current *= (1 - ratio);
            days30to60 *= (1 - ratio);
            days60to90 *= (1 - ratio);
            over90 *= (1 - ratio);

            agingData.push({
                customerId: customer.customerId,
                name: customer.name,
                companyName: customer.companyName,
                totalOutstanding: customer.outstandingBalance,
                aging: {
                    current: Math.round(current * 100) / 100,
                    days30to60: Math.round(days30to60 * 100) / 100,
                    days60to90: Math.round(days60to90 * 100) / 100,
                    over90: Math.round(over90 * 100) / 100
                },
                creditLimit: customer.creditLimit,
                creditUtilization: ((customer.outstandingBalance / customer.creditLimit) * 100).toFixed(2) + '%'
            });
        }

        const totals = {
            totalOutstanding: agingData.reduce((sum, c) => sum + c.totalOutstanding, 0),
            current: agingData.reduce((sum, c) => sum + c.aging.current, 0),
            days30to60: agingData.reduce((sum, c) => sum + c.aging.days30to60, 0),
            days60to90: agingData.reduce((sum, c) => sum + c.aging.days60to90, 0),
            over90: agingData.reduce((sum, c) => sum + c.aging.over90, 0)
        };

        res.json({
            success: true,
            data: {
                asOfDate: today,
                customers: agingData,
                totals
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Send payment reminder
// @route POST /api/credit/reminder/:customerId
// @access Private (Manager/Admin)
const sendPaymentReminder = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { reminderType, message } = req.body;

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // In a real application, you would:
        // 1. Send email using nodemailer
        // 2. Send SMS using Twilio/SNS
        // 3. Log the reminder in database

        // For now, we'll just log it
        console.log(`Payment reminder sent to ${customer.name}`);
        console.log(`Email: ${customer.email}`);
        console.log(`Type: ${reminderType}`);
        console.log(`Message: ${message}`);

        res.json({
            success: true,
            message: 'Payment reminder sent successfully',
            data: {
                customer: customer.name,
                email: customer.email,
                outstandingBalance: customer.outstandingBalance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getCreditCustomers,
    getOverdueCustomers,
    getCustomerStatement,
    getAgingReport,
    sendPaymentReminder
};