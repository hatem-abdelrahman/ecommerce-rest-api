# E-Commerce REST API

A standalone, production-ready backend API for an e-commerce platform built using Node.js, Express, and MongoDB. It follows the **Model-View-Controller (MVC)** architectural pattern and features advanced database optimizations, input validation, automated test suites, and secure Stripe payment processing.

---

## Features

1. **Authentication & Security**: Secure user registration and login using JWT (JSON Web Tokens) and bcrypt password hashing.
2. **Request Validation**: Schema-based request body validation using **Zod** to prevent bad or malicious data from hitting the database.
3. **Advanced Product Catalog Queries**:
   - Keyword search across product name and description (using MongoDB Text Indexes).
   - Dynamic query filters (category, brand, rating thresholds, min/max price ranges).
   - Built-in pagination and sorting (by price, rating, or newest first).
4. **Database Performance Optimizations**: 
   - Compound text indexes and single-field indexes (`category`, `price`) to guarantee millisecond-level search speeds.
5. **Ratings Aggregation**: Automated calculation of product reviews and rating averages directly inside the database using a **MongoDB Aggregation Pipeline** (`$match` -> `$unwind` -> `$group`).
6. **Secure Order & Checkout Workflow**:
   - Order creation and tracking.
   - Handshake with **Stripe** using Payment Intents to fetch client secrets securely.
   - **Delivery Guardrail**: Prevents marking an order as delivered if it has not been paid yet.
   - Atomic database stock level reduction (`$inc`) during checkout to prevent **race conditions** (overselling).
   - Mock Stripe mode for testing the payment workflow without active API keys.
7. **Automated Testing**: Integration test suite built with **Jest** and **Supertest** to verify API endpoints reliably.

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

## Testing the API (Postman Collection)

We have provided a pre-configured Postman collection to test the entire workflow with one click.

### How to use:
1. Open Postman.
2. Click **Import** (top left) and drag the file `ecommerce-api.postman_collection.json` from the root of the project into Postman.
3. You will get a collection named **E-Commerce REST API** with folders for **Users**, **Products**, and **Orders**.
4. **Automated Tokens**: Run the **Login User** or **Login Admin** request. A post-response script will automatically capture the returned JWT token and save it to a collection variable `{{token}}`. All other authenticated requests will use this token automatically!

---

## Automated Test Suites

The project uses **Jest** (test runner) and **Supertest** (HTTP assertions) to execute automated integration tests without starting the live server.

### Run Tests:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

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
| **GET** | `/api/products` | Public | Fetches products (supports query filtering, sorting, and pagination) |
| **GET** | `/api/products/:id` | Public | Fetches a single product details by ID |
| **POST** | `/api/products` | Admin | Creates a sample product template |
| **PUT** | `/api/products/:id` | Admin | Updates details of a product |
| **DELETE** | `/api/products/:id` | Admin | Removes a product from catalog |
| **POST** | `/api/products/:id/reviews` | Private | Submits a review (recalculates average ratings) |

### 3. Order Endpoints (`/api/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/orders` | Private | Creates a new order |
| **GET** | `/api/orders/myorders` | Private | Gets all orders created by the logged-in user |
| **GET** | `/api/orders/:id` | Private | Gets details of a specific order by ID |
| **POST** | `/api/orders/:id/stripe-intent` | Private | Handshakes with Stripe to get a payment Client Secret |
| **PUT** | `/api/orders/:id/pay` | Private | Marks order as paid and decreases product stock levels |
| **PUT** | `/api/orders/:id/deliver` | Admin | Marks order as delivered (Blocked if order is unpaid) |
| **GET** | `/api/orders` | Admin | Gets a list of all system orders |
