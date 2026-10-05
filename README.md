# Skincare POC Backend

Backend API for the Skincare POC e-commerce application.

## Features

- User registration and login
- JWT authentication
- Admin role-based access
- Product CRUD and stock management
- Order management
- Referral system
- Rewards and points
- Percentage, fixed, and Buy X Get Y coupons
- Promotion management
- Dynamic Home-page promotion selection
- MongoDB integration
- CORS and environment configuration

## Technology Stack

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT
- bcrypt
- dotenv
- CORS

## Project Structure

```text
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── .env
└── server.js
```

Main modules include Auth, Products, Orders, Referrals, Rewards, Coupons, and Promotions.

## API

Local server:

```text
http://localhost:5000
```

API base:

```text
http://localhost:5000/api
```

Main routes:

| Module | Endpoint |
|---|---|
| Auth | `/api/auth` |
| Products | `/api/products` |
| Orders | `/api/orders` |
| Referrals | `/api/referrals` |
| Rewards | `/api/rewards` |
| Coupons | `/api/coupons` |
| Promotions | `/api/promotions` |

## Environment Variables

Create `.env` in the backend root:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skincare_poc
JWT_SECRET=your_secure_jwt_secret
```

**Do not commit `.env` to GitHub.**

## Installation

```powershell
cd "C:\Skincare POC\skincare-poc\backend"
npm install
```

## Run

Make sure MongoDB is running, then:

```powershell
node server.js
```

The root endpoint is:

```text
http://localhost:5000/
```

## Authentication

Protected requests use:

```text
Authorization: Bearer <token>
```

Admin-only routes require the authenticated user to have the `admin` role.

## Products

The product module supports:

- Create, read, update, and delete
- Price management
- Stock quantity management
- Category and brand
- Skin type
- Product description and usage information

## Orders

Orders support:

- Customer and shipping information
- Product quantities
- Total amount
- Payment status
- Order status
- Stock-related processing
- Automatic eligible reward/referral processing

## Referrals and Rewards

The system supports:

- Unique referral codes
- Referred users
- Referral completion
- Referral points
- Purchase rewards
- Reward history
- Point balances

## Coupons

Supported coupon types:

```text
PERCENTAGE
FIXED
BUY_X_GET_Y
```

Coupons support:

- Minimum order amount
- Usage limits
- Start/end dates
- Active/inactive status
- Checkout validation

## Promotions

Promotions are separate from coupons.

A promotion controls the promotional advertisement shown on the Home page.

Promotion fields include:

- Title
- Subtitle
- Description
- Coupon code
- Button text
- Discount text
- Start/end dates
- Active status
- Home visibility

`isActive` and `showOnHome` are separate controls. The backend ensures that only one promotion is selected for Home display at a time.

## Development Flow

1. Start MongoDB.
2. Start the backend.
3. Start the frontend.
4. Login/register.
5. Test products and orders.
6. Test coupons and promotions from the admin dashboard.

## GitHub

Backend repository:

https://github.com/chaitanyakolhal84-dotcom/skincare-poc-backend

## Security

- Never commit `.env`.
- Use a strong JWT secret in production.
- Use a secure production MongoDB connection.
- Use HTTPS in production.

## Author

**Chaitanya Kolhal**
