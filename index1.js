async function loadMenu() {
    try {
        // Fetch the menu data from the JSON file
        const response = await fetch('menu.json');
        const menuData = await response.json();

        // Dynamically create the menu items
        const menuGrid = document.querySelector('.menu-grid');

        menuData.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');

            menuItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p class="price">₹${item.price}</p>
                <div class="quantity">
                    <button class="quantity-btn" onclick="changeQuantity('${item.name}', -1)">-</button>
                    <input type="number" id="quantity-${item.name}"  value="1" min="1" max="20" onchange="handleQuantityChange('${item.name}')">
                    <button class="quantity-btn" onclick="changeQuantity('${item.name}', 1)">+</button>
                </div><br>
                <button class="button" onclick="addToCart('${item.name}', ${item.price}, document.getElementById('quantity-${item.name}').value)">Add to Cart</button>
            `;
            
            menuGrid.appendChild(menuItem);
        });
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadMenu);

let cart = [];
let total = 0;

function addToCart(itemName, itemPrice, itemQuantity) {
    itemQuantity = Math.max(1, Math.min(20, parseInt(itemQuantity)));

    const existingItemIndex = cart.findIndex(item => item.name === itemName);
    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += itemQuantity;
        cart[existingItemIndex].totalPrice = cart[existingItemIndex].quantity * itemPrice;
    } else {
        cart.push({
            name: itemName,
            price: itemPrice,
            quantity: itemQuantity,
            totalPrice: itemQuantity * itemPrice
        });
    }

    total += itemQuantity * itemPrice;


    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('total', total);
    displayCart();
}



function changeQuantity(itemName, change) {
    const quantityInput = document.getElementById(`quantity-${itemName}`);
    let newQuantity = parseInt(quantityInput.value) + change;

    // Ensure the quantity is within the allowed range
    if (newQuantity < 1) {
        newQuantity = 1;
    } else if (newQuantity > 20) {
        newQuantity = 20;
    }

    quantityInput.value = newQuantity;
    updateCartItem(itemName, newQuantity);
}

function updateCartItem(itemName, newQuantity) {
    const itemIndex = cart.findIndex(item => item.name === itemName);

    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        cart[itemIndex].totalPrice = newQuantity * cart[itemIndex].price;

        total = cart.reduce((sum, item) => sum + item.totalPrice, 0);  // Recalculate total

        displayCart();
    }
}

function displayCart() {
    const cartItemsElement = document.getElementById('cart-items');
    cartItemsElement.innerHTML = ''; // Clear previous items

    // Display each item in the cart
    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.name} - ₹${item.price} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`;
        
        // Create a remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('btn');
        removeButton.onclick = () => removeFromCart(index); // Set the click event to remove the item
        
        listItem.appendChild(removeButton); // Append the remove button to the list item
        cartItemsElement.appendChild(listItem);
    });

    // Update the total price display
    document.getElementById('total-price').textContent = `Total: ₹${total.toFixed(2)}`;
}

function removeFromCart(index) {
    total -= cart[index].totalPrice; // Subtract the item's total price from the total
    cart.splice(index, 1); // Remove the item from the cart

    // Update the cart display
    displayCart();
}