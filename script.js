const API_URL = "https://fakestoreapi.com/products";
let products = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("devshopCart")) || [];
let currentCategory = "all";
const productsContainer = document.getElementById("productsContainer");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("errorMessage");
const retryButton = document.getElementById("retryButton");
const searchInput = document.getElementById("searchInput");
const resultInfo = document.getElementById("resultInfo");
const emptyMessage = document.getElementById("emptyMessage");
const cartButton = document.getElementById("cartButton");
const cartPanel = document.getElementById("cartPanel");
const closeCartButton = document.getElementById("closeCartButton");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const emptyCart = document.getElementById("emptyCart");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const clearCartButton = document.getElementById("clearCartButton");
const checkoutButton = document.getElementById("checkoutButton");
const categoryButtons = document.querySelectorAll(".nav-btn");

async function fetchProducts() {
  showLoader();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Erreur HTTP : " + response.status);
    }
    products = await response.json();
    filteredProducts = [...products];
    hideLoader();
    applyFilters();

  } catch (error) {
    console.error("Erreur lors du chargement :", error);
    showError();
  }
}
function displayProducts(productsToDisplay) {
  productsContainer.innerHTML = "";

  if (productsToDisplay.length === 0) {
        emptyMessage.classList.remove("hidden");
        resultInfo.textContent = "0 produit";
        return;
    }
    emptyMessage.classList.add("hidden");
    resultInfo.textContent =
        `${productsToDisplay.length} produit${productsToDisplay.length > 1 ? "s" : ""}`;

    productsToDisplay.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

    const rating = product.rating?.rate ?? 0;
    const stars = getStars(rating);

    card.innerHTML = `
      <div class="product-image-container">
        <img
          class="product-image"
          src="${product.image}"
          alt="${escapeHTML(product.title)}"
          loading="lazy"
        >
      </div>
      <div class="product-info">
        <p class="product-category">${escapeHTML(product.category)}</p>

        <h3 class="product-title">
          ${escapeHTML(product.title)}
        </h3>

        <div class="product-rating">
          ${stars}
          <span>(${rating}/5)</span>
        </div>

        <div class="product-bottom">
          <strong class="product-price">
            ${formatPrice(product.price)}
          </strong>

          <button
            class="add-button"
            data-id="${product.id}"
          >
            Ajouter
          </button>
        </div>
      </div>
    `;

    productsContainer.appendChild(card);
  });
  const addButtons = document.querySelectorAll(".add-button");
  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.id);
      addToCart(productId);

      button.textContent = " Ajouté";
      button.classList.add("added");

      setTimeout(() => {
        button.textContent = "Ajouter";
        button.classList.remove("added");
      }, 1000);
    });
  });
}
function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  filteredProducts = products.filter((product) => {
    const categoryMatch =
      currentCategory === "all" ||
      product.category === currentCategory;

    const searchMatch =
      product.title.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    return categoryMatch && searchMatch;
  });

  displayProducts(filteredProducts);
}
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    currentCategory = button.dataset.category;

    applyFilters();
  });
});
searchInput.addEventListener("input", applyFilters);
function addToCart(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return;
  }
  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }
  saveCart();
  displayCart();
}
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);

  saveCart();
  displayCart();
}
function increaseQuantity(productId) {
  const item = cart.find((product) => product.id === productId);

  if (item) {
    item.quantity++;
  }

  saveCart();
  displayCart();
}
function decreaseQuantity(productId) {
  const item = cart.find((product) => product.id === productId);

  if (!item) {
    return;
  }

  if (item.quantity > 1) {
    item.quantity--;
  } else {
    removeFromCart(productId);
    return;
  }

  saveCart();
  displayCart();
}
function displayCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    emptyCart.classList.remove("hidden");
  } else {
    emptyCart.classList.add("hidden");

    cart.forEach((item) => {
      const cartElement = document.createElement("div");
      cartElement.className = "cart-item";

      cartElement.innerHTML = `
        <img
          src="${item.image}"
          alt="${escapeHTML(item.title)}"
        >

        <div>
          <p class="cart-item-title">
            ${escapeHTML(item.title)}
          </p>

          <p class="cart-item-price">
            ${formatPrice(item.price)}
          </p>

          <div class="quantity-controls">
            <button
              class="decrease-button"
              data-id="${item.id}"
              aria-label="Diminuer la quantité"
            >−</button>

            <span>${item.quantity}</span>

            <button
              class="increase-button"
              data-id="${item.id}"
              aria-label="Augmenter la quantité"
            >+</button>
          </div>

          <button
            class="remove-item"
            data-id="${item.id}"
          >
            Supprimer
          </button>
        </div>

        <strong>
          ${formatPrice(item.price * item.quantity)}
        </strong>
      `;

      cartItems.appendChild(cartElement);
    });

    // Événements + et -
    document.querySelectorAll(".increase-button").forEach((button) => {
      button.addEventListener("click", () => {
        increaseQuantity(Number(button.dataset.id));
      });
    });

    document.querySelectorAll(".decrease-button").forEach((button) => {
      button.addEventListener("click", () => {
        decreaseQuantity(Number(button.dataset.id));
      });
    });
    document.querySelectorAll(".remove-item").forEach((button) => {
      button.addEventListener("click", () => {
        removeFromCart(Number(button.dataset.id));
      });
    });
  }
  updateCartTotal();
  updateCartCount();
}
function calculateTotal() {
  return cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}
function getCartQuantity() {
  return cart.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

function updateCartTotal() {
  cartTotal.textContent = formatPrice(calculateTotal());
}

function updateCartCount() {
  cartCount.textContent = getCartQuantity();
}
function saveCart() {
  localStorage.setItem("devshopCart", JSON.stringify(cart));
}
function openCart() {
  cartPanel.classList.add("open");
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartPanel.classList.remove("open");
  overlay.classList.add("hidden");
  document.body.style.overflow = "";
}

cartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
  }
});
clearCartButton.addEventListener("click", () => {
  if (cart.length === 0) {
    return;
  }
  const confirmation = confirm(
    "Voulez-vous vraiment vider le panier ?"
  );

  if (confirmation) {
    cart = [];
    saveCart();
    displayCart();
  }
});
checkoutButton.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Votre panier est vide.");
    return;
  }
  const total = formatPrice(calculateTotal());
  alert(
    `Commande simulée avec succès !\n\nTotal : ${total}`
  );
  cart = [];
  saveCart();
  displayCart();
  closeCart();
});
function showLoader() {
  loader.classList.remove("hidden");
  productsContainer.classList.add("hidden");
  errorMessage.classList.add("hidden");
  emptyMessage.classList.add("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
  productsContainer.classList.remove("hidden");
}

function showError() {
  loader.classList.add("hidden");
  productsContainer.classList.add("hidden");
  emptyMessage.classList.add("hidden");
  errorMessage.classList.remove("hidden");
  resultInfo.textContent = "Erreur de chargement";
}
retryButton.addEventListener("click", fetchProducts);

function formatPrice(price) {
  const prixFCFA = price * 655.957;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF"
  }).format(prixFCFA);
}

function getStars(rating) {
  const roundedRating = Math.round(rating);
  function getStars(rating) {
    const roundedRating = Math.round(rating);

    return "*".repeat(roundedRating) +
           "+".repeat(5 - roundedRating);
}
}
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
displayCart();
fetchProducts();