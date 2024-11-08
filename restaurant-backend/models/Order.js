const mongoose = require('mongoose');

// Define the schema for an order
const OrderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    arrivalTime: { type: Date, required: true },
    items: [
        {
            name: String,
            quantity: Number,
            price: Number
        }
    ],
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model('Order', OrderSchema);
