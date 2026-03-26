## Project Overview

Military Asset Management System is a full-stack web application designed to manage and track military assets across multiple operational bases.

The system helps logistics officers and commanders monitor asset availability, record procurement, manage inter-base transfers, and track assignments or expenditures.

It provides role-based access control to ensure users can only perform operations permitted for their role and assigned base.
## Features
User authentication using JWT
Role-based access control (Admin, Base Commander, Logistics Officer)
Asset inventory management per base
Record asset purchases and automatic balance updates
Transfer assets between bases with stock validation
Assign assets to personnel or mark them as expended
Return workflow for non-expended assignments
Dashboard with aggregated statistics and filters
Transaction audit tracking
## Tech Stack
# Frontend
React.js
Axios
Recharts
# Backend
Node.js
Express.js
# Database
MongoDB with Mongoose
# Authentication & Security
JSON Web Token (JWT)
bcrypt password hashing
## System Architecture

The application follows a three-tier architecture:
React frontend for user interface
Express REST API for business logic
MongoDB for data persistence
All communication happens through secure JSON-based API requests.
## Project Structure
military-asset-management/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── seed.js
│   ├── index.js
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── utils/
│
└── README.md
## Setup Instructions
Prerequisites
Node.js (v18 or higher)
MongoDB (Local or Atlas)
Git
## Clone Repository
git clone <repository-url>
cd military-asset-management
Backend Setup
cd backend
npm install

## Create .env file:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/military_assets
JWT_SECRET=your_secret_key

## Project is Deployed
Frontend Live URL:
Backend Live URL:https://military-asset-management-t0rb.onrender.com

Run seed script:

npm run seed

Start server:

npm run dev
Frontend Setup

Open new terminal:

cd frontend
npm install
npm start

Application runs at:

http://localhost:3000
🔐 User Roles
Admin
Full access to all bases and users
Can manage assets and transactions
Base Commander
Can create assignments and expenditures for own base
Can mark assignments as returned
Logistics Officer
Can record purchases
Can initiate transfers from own base
## Core Modules
Asset Management

Tracks opening balance and current balance of assets per base.

Purchase Module

Adds new asset stock and updates balance automatically.

Transfer Module

Moves assets between bases with validation checks.

Assignment Module

Handles asset issuance and expenditure tracking.

Dashboard

Displays summarized statistics and transaction history.

## Seeded Login Credentials
Username	Password	Role
admin	admin123	Admin
commander_alpha	pass123	Base Commander
logistics_alpha	pass123	Logistics Officer
## Limitations
No real-time notifications
No file upload support
No multi-level approval workflow
Pagination not implemented
## Future Enhancements
Low stock alerts
Report export (PDF/CSV)
Two-factor authentication
Real-time updates using WebSockets
Role-based approval workflow