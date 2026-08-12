# Military Asset Management System

A full-stack web application for managing military assets, equipment inventory, purchases, transfers, assignments, and expenditures across different bases.

The application provides a centralized dashboard for tracking asset quantities and stock movements while using role-based authentication and secure API access.

---

## 🚀 Live Application

### Frontend
https://military-asset-management-client.onrender.com

### Backend API
https://military-asset-management-api-l7s1.onrender.com

### Backend Health Check
https://military-asset-management-api-l7s1.onrender.com/api/health

### GitHub Repository
https://github.com/PN200203/military_assest_management

---

## 📌 Project Overview

The Military Asset Management System helps administrators manage and monitor military equipment and asset movements.

The system tracks:

- Equipment types
- Asset inventory
- Purchases
- Transfers between bases
- Asset assignments
- Expenditures
- Opening balance
- Closing balance
- Current asset quantities
- Stock movement

The application includes an authenticated admin dashboard where users can securely access different modules based on their permissions.

---

## ✨ Features

### 🔐 Authentication

- Admin login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Token-based authorization
- Secure logout
- Authentication persistence using browser storage

### 📊 Dashboard

The dashboard provides an overview of asset stock and movement.

It displays:

- Opening Balance
- Purchases
- Transfer In
- Transfer Out
- Assigned Assets
- Expended Assets
- Closing Balance
- Current Assets

The dashboard also provides a stock movement summary.

Example:

```text
Opening
   +
Purchases
   +
Transfer In
   -
Transfer Out
   -
Assigned
   -
Expended
   =
Closing Balance
