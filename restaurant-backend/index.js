const dotenv = require('dotenv'); // Load dotenv to access environment variables
dotenv.config(); // Load variables from the .env file

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Order = require('./models/Order');

// Ensure that the MONGO_URI is correctly loaded
if (!process.env.MONGO_URI) {
    console.error('MongoDB URI is not defined in .env');
    process.exit(1); // Stop the server if the URI is not found
}

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB Atlas using the URI stored in environment variables
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Failed to connect to MongoDB:", err));

// Define a POST route to handle order submissions
app.post('/api/order', async (req, res) => {
    const { name, email, arrivalTime, items, totalPrice } = req.body;

    const order = new Order({
        name,
        email,
        arrivalTime,
        items,
        totalPrice
    });

    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: 'Failed to place order', error });
    }
});
// Route to fetch all orders for admin view
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find(); // Fetch all orders from the database
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve orders', error });
    }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const path = require('path');

// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});
