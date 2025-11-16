# ⛽ Petrol Pump Management System

A Full‑Stack MERN application for automating and managing fuel station operations — inventory, pumps, shifts, sales, reconciliation and role‑based access.

---

## Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Database Design (Core Collections)](#database-design-core-collections)
- [API & Controllers](#api--controllers)
- [Installation & Run](#installation--run)
- [Environment](#environment)
- [Deployment](#deployment)
- [Contact](#contact)
- [License](#license)

---

## Overview
A scalable MERN (MongoDB, Express, React, Node) system with real‑time dashboards, reports and RBAC (Admin, Manager, Accountant, Employee). Built for reliability, security and easy deployment.

---

## Features
- Role‑based access control (Admin / Manager / Accountant / Employee)
- Shift and sales management (cash & credit)
- Tank & pump monitoring, dip readings, nozzle control
- Inventory, purchases, suppliers, and reconciliation
- Real‑time analytics and interactive charts
- Pagination, filtering, full‑text search
- JWT authentication, HTTP‑only cookies, bcrypt password hashing
- Exportable reports and reconciliation tools

---

## Architecture & Tech Stack
- Backend: Node.js, Express.js, Mongoose
- Frontend: React, React Router, Redux Toolkit / Context API, Tailwind CSS, shadcn/ui
- Database: MongoDB Atlas
- Charts: Recharts
- Forms: React Hook Form + Yup
- Auth: JWT (HTTP‑only cookies)
- Security: bcrypt, helmet, cors, rate limiting
- Testing: Jest, React Testing Library, Cypress, Postman

Three‑tier architecture:
Frontend (React) → REST API (Express) → Database (MongoDB)

---

## Database Design (Core Collections)
- users — auth, roles
- employees — profiles, attendance
- tanks — fuel storage, dip readings
- pumps — dispensers, nozzles
- shifts — shift logs, readings
- sales — transactions (cash/credit)
- customers — account & credit data
- suppliers — vendors
- purchases — fuel/item receipts
- inventory — non‑fuel stock
- transactions — financial records

Relationships: User ↔ Employee (1:1), Tank → Pump, Shift → Sale, Customer → Sale (1:N)

---

## API & Controllers
Key controllers (examples):
- authController — login, logout, refresh, RBAC middleware
- employeeController, customerController, supplierController
- tankController, pumpController, shiftController
- saleController, purchaseController, inventoryController
- transactionController, expenseController, creditController
- reconciliationController, reportController

Standard response format:
Success:
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
Error:
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error"
}

---

## Installation & Run

Backend
1. cd backend
2. npm install
3. copy .env.example → .env and fill values
4. npm run dev

Frontend
1. cd new_client (or frontend)
2. npm install
3. npm start

Notes:
- Rebuild Tailwind after config changes: npm run build:css (or your setup)
- Seed sample data (if provided): node import-atlas-data.js

---


## Deployment
- Backend: Railway 
- Frontend: Vercel
- Database: MongoDB Atlas (backup & scaling)

---

## Contact
Sachin Jaiswal — sj586997@gmail.com

---

## License
MIT — see LICENSE file for details.
