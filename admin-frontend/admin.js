let allOrders = [];
let searchTimeout; 
const { jsPDF } = window.jspdf;
let isMessageShown = false;
let hideMessageTimeout; 

async function fetchOrders() {
    try {
        const response = await fetch('http://localhost:5000/api/orders'); 
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        allOrders = data; // Store fetched data in allOrders array
        console.log(data);  
        filterOrders(); // Call filterOrders to render the fetched data
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchOrders(); // Ensure this is called when the DOM is fully loaded
});


// Filter orders based on status and search query
function filterOrders() {
    const filterValue = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    let filteredOrders = filterValue === 'all' ? allOrders : allOrders.filter(order => order.status === filterValue);

    if (searchQuery) {
        filteredOrders = filteredOrders.filter(order =>
            order.name.toLowerCase().includes(searchQuery) ||
            order.email.toLowerCase().includes(searchQuery) ||
            order.phone.includes(searchQuery)
        );
    }

    console.log('Filtered Orders:', filteredOrders); // Log filtered orders
    renderOrders(filteredOrders); 
}



// Function to render orders
function renderOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    tableBody.innerHTML = ''; // Clear the table

    // If no orders match the criteria, show the "Try different keywords" message
    if (orders.length === 0) {
        if (!isMessageShown) {
            // Only show the message if it's not already shown
            if (!noResultsMessage) {
                const messageElement = document.createElement('tr');
                messageElement.id = 'noResultsMessage';
                messageElement.innerHTML = `<td colspan="9" style="text-align: center; color: #f44336; font-weight: bold;">Try different keywords</td>`;
                tableBody.appendChild(messageElement);
            }
            isMessageShown = true; // Set the flag to true when message is shown

            if (hideMessageTimeout) {
                clearTimeout(hideMessageTimeout); 
            }
            hideMessageTimeout = setTimeout(() => {
                hideMessage();
            }, 3000); // Wait 3 seconds before hiding
        }
    } else {
        // Remove "Try different keywords" message if orders exist
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
        isMessageShown = false; // Reset the flag when there are results
    }

    // Render orders
    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${order.name}</td>
            <td>${order.email}</td>
            <td class="phone">${order.phone}</td>
            <td class="date">${new Date(order.arrivalTime).toLocaleString()}</td>
            <td class="items">${renderItems(order.items)}</td>
            <td>₹${order.totalPrice.toFixed(2)}</td>
            <td class="date">${new Date(order.createdAt).toLocaleString()}</td>
            <td id="action-${order._id}">
                <div class="button-container">
                    ${renderActionButtons(order)}
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
fetchOrders();
// Function to render items
function renderItems(items) {
    return items.map(item => `${item.name} (x${item.quantity})`).join(', ');
}

// Function to render action buttons
function renderActionButtons(order) {
    if (order.status === 'pending') {
        return ` 
            <button class="button served" onclick="updateOrderStatus('${order._id}', 'served')">Order Served</button>
            <button class="button canceled" onclick="updateOrderStatus('${order._id}', 'canceled')">Order Canceled</button>
        `;
    } else {
        return ` 
            ${order.status === 'served' ? 'Order Served' : 'Order Canceled'}
            <button class="button reset" onclick="resetOrderStatus('${order._id}')">Undo</button>
        `;
    }
}

// Function to update the status of an order
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
            throw new Error('Failed to update order status');
        }

        const result = await response.json();
        const updatedOrder = result.order;  // Access the 'order' object from the response

        // Check if the updatedOrder has the necessary properties
        if (!updatedOrder || !updatedOrder._id) {
            console.error('Updated order does not have an _id:', updatedOrder);
            alert('Error: Order update failed.');
            return;
        }

        // Find the order row element
        const orderRow = document.getElementById(`action-${updatedOrder._id}`);
        if (orderRow) {
            // Update the action buttons for this row
            orderRow.innerHTML = renderActionButtons(updatedOrder); // Re-render buttons
        } else {
            console.error(`Order row with ID 'action-${updatedOrder._id}' not found`);
                fetchOrders(); // Refresh the entire table if the row was not found
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        // Show the alert only if there's an error
        alert(error.message); 
    }
}


// Function to reset the status of an order (Undo action)
async function resetOrderStatus(orderId) {
    try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'pending' }),
        });

        if (!response.ok) {
            throw new Error('Failed to reset order status');
        }

        const result = await response.json();
        const updatedOrder = result.order;  // Access the 'order' object from the response

        // Check if the updatedOrder has the necessary properties
        if (!updatedOrder || !updatedOrder._id) {
            console.error('Updated order does not have an _id:', updatedOrder);
            alert('Error: Order update failed.');
            return;
        }

        // Find the order row element
        const orderRow = document.getElementById(`action-${updatedOrder._id}`);
        if (orderRow) {
            // Update the action buttons for this row
            orderRow.innerHTML = renderActionButtons(updatedOrder); // Re-render buttons
        } else {
            console.error(`Order row with ID 'action-${updatedOrder._id}' not found`);
            // Optionally, you could refresh the table or find the order row by another method
            fetchOrders(); // Refresh the entire table if the row was not found
        }
    } catch (error) {
        console.error('Error resetting order status:', error);
        // Show the alert only if there's an error
        alert(error.message); 
    }
}
// Function to check if the order was created today
function isOrderToday(order) {
    const today = new Date();
    const orderDate = new Date(order.createdAt);
    return today.toDateString() === orderDate.toDateString();
}


// Function to show the popup with selected date or month summary
function showPopup() {
    const selectedDate = document.getElementById('datePicker').value;
    const selectedMonth = document.getElementById('monthPicker').value;

    let selectedDateText = "Today";  // Default to "Today"
    let filteredOrders;

    if (selectedDate) {
        filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toLocaleDateString() === new Date(selectedDate).toLocaleDateString();
        });
        const orderDate = new Date(selectedDate);
        selectedDateText = orderDate.toLocaleDateString();
    } else if (selectedMonth) {
        filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getFullYear() === parseInt(selectedMonth.split("-")[0]) &&
                   orderDate.getMonth() === parseInt(selectedMonth.split("-")[1]) - 1;
        });
        const monthDate = new Date(selectedMonth + "-01");
        selectedDateText = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
        filteredOrders = allOrders.filter(order => isOrderToday(order));
        const today = new Date();
        selectedDateText = today.toLocaleDateString();
    }

    document.getElementById('selectedDate').textContent = selectedDateText;
    const totalOrders = filteredOrders.length;
    const servedOrders = filteredOrders.filter(order => order.status === 'served').length;
    const canceledOrders = filteredOrders.filter(order => order.status === 'canceled').length;

    // Calculate total earnings for only served orders
    const totalEarnings = filteredOrders
        .filter(order => order.status === 'served')
        .reduce((total, order) => total + order.totalPrice, 0);
    
    // Aggregate served items
    const servedItems = filteredOrders
        .filter(order => order.status === 'served')
        .reduce((items, order) => {
            order.items.forEach(item => {
                const existingItem = items.find(i => i.name === item.name);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    items.push({ ...item });
                }
            });
            return items;
        }, []);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('servedOrders').textContent = servedOrders;
    document.getElementById('canceledOrders').textContent = canceledOrders;
    document.getElementById('totalEarnings').textContent = totalEarnings.toFixed(2);

    const servedItemsList = document.getElementById('servedItemsList');
    servedItemsList.innerHTML = '';
    servedItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} (x${item.quantity})`;
        servedItemsList.appendChild(li);
    });

    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
}


function hidePopup() {
    console.log('Hiding popup'); // Log hiding popup
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
}


function generatePDFReport() {
    const selectedDate = document.getElementById('datePicker').value;
    const selectedMonth = document.getElementById('monthPicker').value;

    let filteredOrders;

    if (selectedDate) {
        filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toLocaleDateString() === new Date(selectedDate).toLocaleDateString();
        });
    } else if (selectedMonth) {
        filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getFullYear() === parseInt(selectedMonth.split("-")[0]) &&
                   orderDate.getMonth() === parseInt(selectedMonth.split("-")[1]) - 1;
        });
    } else {
        filteredOrders = allOrders.filter(order => isOrderToday(order));
    }

    const totalOrders = filteredOrders.length;
    const servedOrders = filteredOrders.filter(order => order.status === 'served').length;
    const canceledOrders = filteredOrders.filter(order => order.status === 'canceled').length;
    const totalEarnings = filteredOrders
        .filter(order => order.status === 'served')
        .reduce((total, order) => total + order.totalPrice, 0);

    // Aggregate served items
    const servedItems = filteredOrders
        .filter(order => order.status === 'served')
        .reduce((items, order) => {
            order.items.forEach(item => {
                const existingItem = items.find(i => i.name === item.name);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    items.push({ ...item });
                }
            });
            return items;
        }, []);

    const doc = new jsPDF();
    doc.addFont('path-to-font/FreeSerif.ttf', 'FreeSerif', 'normal'); // Add path to FreeSerif font
    doc.setFont('FreeSerif');

    doc.setFontSize(18);
    doc.text('Order Summary Report', 20, 20);

    let selectedDateText;  // Initialize without a value
    if (selectedDate) {
        const orderDate = new Date(selectedDate);
        selectedDateText = orderDate.toLocaleDateString();
    } else if (selectedMonth) {
        const monthDate = new Date(selectedMonth + "-01");
        selectedDateText = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
        const today = new Date();
        selectedDateText = today.toLocaleDateString();  // Display today's date instead of "Today"
    }
    

    doc.setFontSize(14);
    doc.text(`Selected Date: ${selectedDateText}`, 20, 30);

    doc.setFontSize(12);
    doc.text(`Total Orders: ${totalOrders}`, 20, 40);
    doc.text(`Orders Served: ${servedOrders}`, 20, 50);
    doc.text(`Orders Canceled: ${canceledOrders}`, 20, 60);
    doc.text(`Total Earnings: ${totalEarnings.toFixed(2)}`, 20, 70);

    doc.text('Served Items:', 20, 80);
    let yOffset = 90;
    servedItems.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.name} (x${item.quantity})`, 20, yOffset);
        yOffset += 10;
    });

    doc.save('order_summary.pdf');
}



// Function to hide the "Try different keywords" message
function hideMessage() {
    const noResultsMessage = document.getElementById('noResultsMessage');
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
    isMessageShown = false;
}

// Add debounce to the search input
document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
        filterOrders(); 
    }, 500); // Apply the filter after a delay of 500ms
});

function exportOrdersToPDF() {
    const doc = new jsPDF();

    // Get the filtered orders (you might need to fetch the latest data)
    const orders = allOrders;

    // Log to check if the orders are loaded correctly
    console.log('All Orders:', orders);

    if (orders.length === 0) {
        alert("No orders available to export.");
        return;
    }

    // Group orders by their status (served, pending, canceled)
    const groupedOrders = groupOrdersByStatus(orders);

    // Log to check the grouped orders
    console.log('Grouped Orders by Status:', groupedOrders);

    // Set the title for the PDF
    doc.setFontSize(18);
    doc.text("Order Report", 20, 20);

    // Define the start position for the content
    let yPosition = 30;
    const lineMargin = 5;

    const pageHeight = doc.internal.pageSize.height; // Get the page height of the PDF
    const maxY = pageHeight - 30; // Keep some space at the bottom for footer

    doc.addFont('path-to-font/Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    

    // Loop through each status group (e.g., "Pending", "Served", "Canceled")
    for (let status in groupedOrders) {
        const statusOrders = groupedOrders[status];

        // Log to check the orders for each status
        console.log(`Orders in ${status} group:`, statusOrders);

        // Add the status title (e.g., "Pending Orders")
        if (yPosition > maxY) {
            doc.addPage(); // Add a new page
            yPosition = 20; // Reset Y position for the new page
        }

        doc.setFontSize(14);
        doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)} Orders`, 20, yPosition);
        yPosition += lineMargin + 10; // Add space between status and order list

        // Group orders by date
        const groupedByDate = groupOrdersByDate(statusOrders);

        // Log to check the orders grouped by date
        console.log(`Grouped by Date for ${status}:`, groupedByDate);

        for (let date in groupedByDate) {
            const dateOrders = groupedByDate[date];

            console.log(`Orders on ${date}:`, dateOrders);

            if (yPosition > maxY) {
                doc.addPage(); // Add a new page
                yPosition = 20; // Reset Y position for the new page
            }

            // Add the date header
            doc.setFontSize(12);
            doc.text(`Date: ${date}`, 20, yPosition);
            yPosition += lineMargin + 5; // Add space after date

            // Loop through each order and display it as a simple list
            dateOrders.forEach((order, index) => {
                // Check if the content exceeds the page height before adding order details
                if (yPosition > maxY) {
                    doc.addPage(); // Add a new page
                    yPosition = 20; // Reset Y position for the new page
                }

                doc.setFontSize(10);
                doc.text(`Order #${index + 1}`, 20, yPosition);
                doc.text(`Name: ${order.name}`, 20, yPosition + 6);
                doc.text(`Email: ${order.email}`, 20, yPosition + 12);
                doc.text(`Phone: ${order.phone}`, 20, yPosition + 18);
                doc.text(`Total Price: ${order.totalPrice.toFixed(2)}`, 20, yPosition + 24); // Rupee symbol here
                doc.text(`Arrival Time: ${new Date(order.arrivalTime).toLocaleString()}`, 20, yPosition + 30);
                
                yPosition += 40; // Space after each order
                doc.text("--------------------------------------------------------", 20, yPosition); // Divider
                yPosition += 5; // Space after the divider
            });

            yPosition += 10; // Space between date groups
        }
    }

    // Save the PDF
    doc.save("orders_report.pdf");
}

// Function to group orders by status
function groupOrdersByStatus(orders) {
    return orders.reduce((grouped, order) => {
        if (!grouped[order.status]) {
            grouped[order.status] = [];
        }
        grouped[order.status].push(order);
        return grouped;
    }, {});
}

// Function to group orders by date
function groupOrdersByDate(orders) {
    return orders.reduce((grouped, order) => {
        const date = new Date(order.createdAt).toLocaleDateString(); // Format the date
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(order);
        return grouped;
    }, {});
}



// Periodically refresh data
setInterval(() => {
    fetchOrders();
}, 3000); // Refresh data every 3 seconds


// Initial fetch
fetchOrders();
