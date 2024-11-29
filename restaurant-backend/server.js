require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const mailgun = require('mailgun-js');
const Order = require('./models/Order');

// Validate MongoDB URI
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MongoDB URI is not defined in .env');
    process.exit(1);
}

const app = express();

const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
});

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: 'http://127.0.0.1:5500' })); // Adjust origin as needed

// Connect to MongoDB
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        // Fetch all orders
        const orders = await Order.find();

        // Sort orders by closest arrivalTime to the current time
        const currentTime = new Date();
        orders.sort((a, b) => {
            const timeA = Math.abs(new Date(a.arrivalTime) - currentTime);
            const timeB = Math.abs(new Date(b.arrivalTime) - currentTime);
            return timeA - timeB;
        });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({ message: 'Failed to retrieve orders', error });
    }
});

// Update order status
app.patch('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['served', 'canceled', 'pending'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: `Order updated to ${status}`, order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error });
    }
});

// Place a new order
app.post('/api/order', async (req, res) => {
    const { name, email, phone, arrivalTime, items, totalPrice } = req.body;

    // Validate order data
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Cart cannot be empty' });
    }

    const code = Math.floor(10000 + Math.random() * 90000); // Generate a 5-digit code

    try {
        // Save the order
        const order = new Order({
            name,
            email,
            phone,
            arrivalTime,
            items,
            totalPrice,
            code, // Store the confirmation code
        });
        const newOrder = await order.save();

        // Send email
        const orderDetails = items
            .map(
                (item) =>
                    `${item.name} - ₹${item.price} x ${item.quantity} = ₹${(
                        item.price * item.quantity
                    ).toFixed(2)}`
            )
            .join('\n');
            
        // Format the arrival time to show full date and time (Month Day, Year at hh:mm AM/PM)
        const formatDateTime = (date) => {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12; // Convert 24hr format to 12hr
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero for single digits

            return `${month} ${day}, ${year} at ${formattedHours}:${formattedMinutes} ${ampm}`;
        };

        // Function to format the date
        const formatDate = (date) => {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true, // Set to true for AM/PM format
            };
            return new Date(date).toLocaleString('en-US', options);
        };
        
        // Format arrivalTime for the email
        const formattedArrivalTime = formatDate(arrivalTime);
        
        // Send email to the user using Mailgun
        const emailData = {
            from: `Admin@${process.env.MAILGUN_DOMAIN}`,
            to: email,
            subject: 'Order Confirmation',
            text: `Hello ${name},\n\nThank you for your order!\n\nYour order details:\n${orderDetails}\n\nTotal: ₹${totalPrice}\nPickup Time: ${formattedArrivalTime}\n\nYour confirmation code: ${code}\n\nWe kindly request that you retain this code, as it will be necessary to verify your order at the restaurant.\n\nRegards,\nRestaurant Team`,
        };
        

        mg.messages().send(emailData, (error, body) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', body);
            }
        });

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Failed to place order', error });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
