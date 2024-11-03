// loadMenu.js

async function loadMenu() {
    try {
        // Fetch menu data from the JSON file
        const response = await fetch('menu.json');
        const menu = await response.json();

        // Get the container where menu items will be displayed
        const menuGrid = document.querySelector('.menu-grid');

        // Loop through menu items and create HTML for each item
        menu.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');

            menuItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p class="price">₹${item.price}</p>
                <button class="button" onclick="addToCart('${item.name}', ${item.price})">Add to Cart</button>
            `;

            // Append each menu item to the menu grid
            menuGrid.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// Load the menu when the page loads
document.addEventListener('DOMContentLoaded', loadMenu);
function showPop() {
    document.getElementById("overlay").style.display = "flex";
}

// Function to close the popup
function closePop() {
    document.getElementById("overlay").style.display = "none";
}
let cart = [];
let total = 0;

function addToCart(itemName, itemPrice) {
// Add the item to the cart array
cart.push({ name: itemName, price: itemPrice });
total += itemPrice; // Update the total price

// Update the cart display
displayCart();
}

function removeFromCart(index) {
total -= cart[index].price; // Subtract the item's price from the total
cart.splice(index, 1); // Remove the item from the cart

// Update the cart display
displayCart();
}

function displayCart() {
const cartItemsElement = document.getElementById('cart-items');
cartItemsElement.innerHTML = ''; // Clear previous items

// Display each item in the cart
cart.forEach((item, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${item.name} - ₹${item.price.toFixed(2)}`;
    
    // Create a remove button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('btn');
    removeButton.onclick = () => removeFromCart(index); // Set the click event to remove the item
    
    listItem.appendChild(removeButton); // Append the remove button to the list item
    listItem.classList.add('fade-in'); // Add fade-in class for animation
    cartItemsElement.appendChild(listItem);
});

// Update the total price display
document.getElementById('total-price').textContent = `Total: ₹${total.toFixed(2)}`;
}
