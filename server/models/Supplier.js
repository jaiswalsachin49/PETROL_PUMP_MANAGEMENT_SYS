const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    unique: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  companyName: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  supplierType: {
    type: String,
    enum: ['fuel', 'lubricant', 'accessories', 'general'],
    default: "fuel",
    required: true,
  },
  gstNumber: {
    type: String,
    uppercase: true,
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
  },
  paymentTerms: {
    type: String,
    default: 'immediate',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Auto-generate supplierId
supplierSchema.pre('save', async function (next) {
  if (!this.supplierId) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierId = `SUP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
supplierSchema.index({ supplierId: 1 });
supplierSchema.index({ supplierType: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
