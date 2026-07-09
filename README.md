# E-Commerce REST API

A production-ready, fully-featured backend API for an e-commerce platform built using Node.js, Express, and MongoDB. It follows the **Model-View-Controller (MVC)** architectural pattern and features advanced database optimizations, ratings aggregation, and secure Stripe payment processing.

---

## Features

1. **Authentication & Security**: Secure user registration and login using JWT (JSON Web Tokens) and bcrypt password hashing.
2. **Advanced Product Catalog Queries**:
   - Keyword search across product name and description (using MongoDB Text Indexes).
   - Dynamic query filters (category, brand, rating thresholds, min/max price ranges).
   - Built-in pagination and sorting (by price, rating, or newest first).
3. **Database Performance Optimizations**: 
   - Compound text indexes and single-field indexes (`category`, `price`) to guarantee millisecond-level search speeds.
4. **Ratings Aggregation**: Automated calculation of product reviews and rating averages directly inside the database using a **MongoDB Aggregation Pipeline** (`$match` -> `$unwind` -> `$group`).
5. **Secure Order & Checkout Workflow**:
   - Order creation and tracking.
   - Handshake with **Stripe** using Payment Intents to fetch client secrets securely.
   - Atomic database stock level reduction (`$inc`) during checkout to prevent **race conditions** (overselling).
   - Mock Stripe mode for testing the payment workflow without active API keys.

---

## Prerequisites

Before running the application, make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB Community Server](https://www.mongodb.com/try/download/community)

---

## Getting Started

### 1. Start the MongoDB Service (Windows)

If you encounter the error `connect ECONNREFUSED 127.0.0.1:27017`, it means the MongoDB service is not running. 

To start it:
1. Open **Command Prompt** or **PowerShell** as **Administrator**.
2. Run the following command:
   ```cmd
   net start MongoDB
   ```

*(Alternatively, open the Windows Services app (`services.msc`), find `MongoDB Server`, right-click it, and select **Start**.)*

### 2. Setup the Project

1. Install backend dependencies:
   ```bash
   npm install
   ```
2. Create and configure your `.env` file in the root of the backend folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/mern-ecommerce
   JWT_SECRET=your_super_secret_jwt_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```
3. **Seed the database** with sample users and products:
   ```bash
   npm run data:import
   ```
   *(Default Admin User created: `admin@example.com` / Password: `123456`)*
   *(Default Customer User created: `john@example.com` / Password: `123456`)*

### 3. Run the Server

Start the API in development mode:
```bash
npm run dev
```
The server will start running at `http://localhost:5000`.

---

## API Endpoints Reference

All requests to private endpoints require sending a JWT token in the request headers:  
`Authorization: Bearer <your_token>`

### 1. User Endpoints (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/users/login` | Public | Authenticates user & returns JWT token |
| **POST** | `/api/users` | Public | Registers a new user |
| **GET** | `/api/users/profile` | Private | Gets the logged-in user's profile |
| **PUT** | `/api/users/profile` | Private | Updates the logged-in user's profile |
| **GET** | `/api/users` | Admin | Gets a list of all users |

### 2. Product Endpoints (`/api/products`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/products` | Public | Fetches products (supports query parameters below) |
| **GET** | `/api/products/:id` | Public | Fetches a single product details by ID |
| **POST** | `/api/products` | Admin | Creates a sample product template |
| **PUT** | `/api/products/:id` | Admin | Updates details of a product |
| **DELETE** | `/api/products/:id` | Admin | Removes a product from catalog |
| **POST** | `/api/products/:id/reviews` | Private | Submits a review (triggers Aggregation Pipeline) |

#### Product Query Parameters (for `GET /api/products`):
* `keyword`: Search name or description.
* `category`: Filter by exact category.
* `brand`: Filter by exact brand.
* `rating`: Minimum rating threshold (e.g. `4` for 4 stars and above).
* `minPrice` / `maxPrice`: Price range boundaries.
* `sortBy`: `priceAsc`, `priceDesc`, `rating`, `newest`.
* `pageNumber`: Target page (Default: `1`).
* `limit`: Page items limit (Default: `8`).

### 3. Order Endpoints (`/api/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/orders` | Private | Creates a new order |
| **GET** | `/api/orders/myorders` | Private | Gets all orders created by the logged-in user |
| **GET** | `/api/orders/:id` | Private | Gets details of a specific order by ID |
| **POST** | `/api/orders/:id/stripe-intent` | Private | Handshakes with Stripe to get a payment Client Secret |
| **PUT** | `/api/orders/:id/pay` | Private | Marks order as paid and decreases product stock levels |
| **PUT** | `/api/orders/:id/deliver` | Admin | Marks order status as delivered |
| **GET** | `/api/orders` | Admin | Gets a list of all system orders |

---

## Detailed Step-by-Step Payment Testing (Postman Guide)

Follow these steps in Postman to test the full purchase, Stripe handshake, and stock deduction flow.

### Step 1: Login to get your JWT Token
To access private endpoints, you must obtain a security token.

1. Create a new request in Postman:
   * **Method**: `POST`
   * **URL**: `http://localhost:5000/api/users/login`
   * **Body (raw JSON)**:
     ```json
     {
       "email": "john@example.com",
       "password": "123456"
     }
     ```
2. Click **Send**.
3. Copy the value of the `"token"` field from the response JSON.

---

### Step 2: Create a New Order
We will place an order for a product. First, make sure you have a valid product ID by doing a `GET` request to `http://localhost:5000/api/products`.

1. Create a new request in Postman:
   * **Method**: `POST`
   * **URL**: `http://localhost:5000/api/orders`
2. Go to the **Headers** tab:
   * Add `Authorization` -> `Bearer <paste_your_copied_token_here>`
3. Go to the **Body** tab (raw JSON):
   ```json
   {
     "orderItems": [
       {
         "name": "Sample Product",
         "qty": 1,
         "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
         "price": 100,
         "product": "65e89b21f3c8a00287a9bc12" 
       }
     ],
     "shippingAddress": {
       "address": "123 Main Street",
       "city": "New York",
       "postalCode": "10001",
       "country": "USA"
     },
     "paymentMethod": "Stripe",
     "itemsPrice": 100,
     "taxPrice": 15,
     "shippingPrice": 10,
     "totalPrice": 125
   }
   ```
   *(Ensure the `product` ID string matches a 24-character ID from your database).*
4. Click **Send**.
5. Copy the returned order `"_id"` (e.g., `65e8a1bc4028bc1e4d3a229a`) from the response.

---

### Step 3: Request the Stripe Client Secret
This step initiates the payment record on Stripe's servers.

1. Create a new request in Postman:
   * **Method**: `POST`
   * **URL**: `http://localhost:5000/api/orders/<order_id>/stripe-intent`
     *(Replace `<order_id>` with the ID you copied in Step 2).*
2. Go to the **Headers** tab:
   * Add `Authorization` -> `Bearer <your_token>`
3. Click **Send**.
4. **Expected Response**:
   ```json
   {
     "clientSecret": "pi_3Tr25dPZ71hY5iHM2zU29pcu_secret_AlvV5uEkIhLYTZHVldgCWL10V",
     "isMock": false
   }
   ```

---

### Step 4: Simulate Successful Payment & Stock Deduction
Once Stripe confirms the payment, the application must mark the order as paid and atomically decrement product inventory to prevent overselling.

1. Create a new request in Postman:
   * **Method**: `PUT`
   * **URL**: `http://localhost:5000/api/orders/<order_id>/pay`
2. Go to the **Headers** tab:
   * Add `Authorization` -> `Bearer <your_token>`
3. Go to the **Body** tab (raw JSON):
   ```json
   {
     "id": "pi_3Tr25dPZ71hY5iHM2zU29pcu",
     "status": "succeeded",
     "update_time": "2026-07-09T12:00:00Z",
     "email_address": "john@example.com"
   }
   ```
   *(For testing, you can use the prefix of the clientSecret from Step 3 as the `"id"` value).*
4. Click **Send**.
5. **Validation Check**:
   * The order object returned will have `isPaid: true` and `paidAt` set.
   * Query the product in your database (`GET /api/products/<product_id>`). You will see its `countInStock` has decreased by the quantity ordered (`1`).
