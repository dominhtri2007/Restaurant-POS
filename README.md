# 🍽️ Restaurant POS & QR-Code Table Ordering System

> A modern, lightning-fast, real-time restaurant POS & digital dining system with QR code table ordering, instant live-sync kitchen notifications, cashier shift management, and automated sales analytics.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-43853d)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-0288d1)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-20232a)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-MySQL_8.0+-00618a)](https://www.mysql.com/)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-000000)](https://socket.io/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952b3)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-f5a623)](LICENSE)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Monorepo Architecture](#-monorepo-architecture)
- [Key Features](#-key-features)
  - [📱 Customer Dine-in Ordering (Frontend)](#-customer-dine-in-ordering-frontend)
  - [🖥️ Point of Sale & Management (Admin Frontend)](#️-point-of-sale--management-admin-frontend)
  - [⚡ Real-time Bi-directional Communication](#-real-time-bi-directional-communication)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Installation](#-step-by-step-installation)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Database Initialization](#2-database-initialization)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Environment Variables Setup](#4-environment-variables-setup)
- [Running the System](#-running-the-system)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Default Login Accounts](#-default-login-accounts)
- [API & Real-time Specification](#-api--real-time-specification)
  - [REST API Endpoints](#rest-api-endpoints)
  - [Socket.IO Events](#socketio-events)
- [Security Implementation](#-security-implementation)
- [Project Scripts Reference](#-project-scripts-reference)
- [License](#-license)

---

## 🌟 Overview

**Restaurant POS & QR Ordering System** is a unified monorepo solution engineered for modern F&B businesses. It bridges the gap between customer self-service ordering and back-of-house operations:

- **Customers** scan dynamic QR codes positioned at tables (`/?table=:id`) using any smartphone browser, browse interactive digital menus, customize orders with special notes, and submit tickets directly to the kitchen and cashier without downloading an app.
- **Cashiers & Managers** track dine-in occupancy across an interactive visual table map, acknowledge and update orders in real-time, oversee cash and bank transfer balances during active shifts, and export consolidated performance metrics.

---

## 🏛️ Monorepo Architecture

The repository is structured into distinct, decoupled packages managed from a single workspace root:

```text
restaurant-pos/
├── backend/                  # Core REST API, WebSockets & MySQL Persistence
│   ├── src/
│   │   ├── config/           # Database connection pooling (mysql2/promise)
│   │   ├── controllers/      # Business logic handlers (orders, menu, users, shifts)
│   │   ├── middlewares/      # JWT auth guard, rate limiters, error handling
│   │   ├── routes/           # Express router endpoints
│   │   ├── utils/            # Bcrypt hashing, token helpers, sanitizers
│   │   └── server.js         # HTTP server & Socket.IO initialization
│   ├── .env.example          # Environment sample for backend
│   └── package.json
│
├── frontend/                 # Customer Dine-in Web Application
│   ├── public/               # HTML template, webmanifest, static assets
│   ├── src/
│   │   ├── components/       # BestSeller carousel, cart bar, modals, category tabs
│   │   ├── services/         # Axios API client & Socket.IO event listeners
│   │   ├── App.jsx           # Routing & table query resolution
│   │   └── index.js
│   ├── .env.example          # Environment sample for customer app
│   └── package.json
│
├── admin-frontend/           # Management, POS, Cashier & Analytics Portal
│   ├── public/               # AdminLTE assets & dashboard root HTML
│   ├── src/
│   │   ├── components/       # Table map, menu CRUD, user management, shift modals
│   │   ├── context/          # Global notification & audio feedback context
│   │   ├── services/         # Secure Axios instance & Admin WebSocket subscriber
│   │   ├── utils/            # Excel report generator (XLSX)
│   │   ├── App.jsx           # Role-based route guard
│   │   └── index.js
│   ├── .env.example          # Environment sample for admin portal
│   └── package.json
│
├── scripts/                  # Cross-platform lifecycle automations
│   ├── envHelper.js          # Synchronizes port definitions and hosts
│   ├── start-prod.js         # Production cluster launcher
│   └── stop-services.js      # Graceful shutdown process terminator
│
├── dev.bat                   # 1-Click development launcher for Windows
├── run.bat                   # 1-Click production service runner
├── stop.bat                  # 1-Click process killer for Windows
├── schema.sql                # Clean SQL schema definition & sample fixtures
├── LICENSE                   # Open-source MIT License
└── README.md                 # Project documentation
```

---

## 🚀 Key Features

### 📱 Customer Dine-in Ordering (Frontend)
- **Zero-Friction Access:** No registration or app download needed; opens instantly when scanning table QR codes.
- **Smart Category Navigation:** Sticky category tabs with automatic active section detection on scroll.
- **Featured & Bestsellers:** Visual carousel showcasing high-margin and popular dishes.
- **Customizable Cart:** Adjust item quantities, append special cooking instructions, and calculate totals instantly.
- **Live Ticket Tracker:** Real-time visual progress indicator (Pending -> Confirmed -> Completed -> Paid).

### 🖥️ Point of Sale & Management (Admin Frontend)
- **Visual Table Map:** Real-time color-coded statuses (Available, Occupied, Cleaning Required).
- **Table QR Code Generation:** Instant preview and one-click export/printing of table-specific QR codes.
- **Menu Management:** Create, edit, and organize categories and food items; instant toggle for out-of-stock items.
- **Order Queue & Settlement:** Receive instant sound cues upon order placement; update statuses and process cash or bank payments.
- **Shift & Drawer Management:** Open and close cashier shifts with starting float, track cash drops, and reconcile discrepancies.
- **Reporting & Excel Export:** Visualize revenue metrics, sales breakdowns, and export operational reports to `.xlsx`.
- **RBAC (Role-Based Access Control):** Granular permissions for Admin, Cashier, and Staff accounts.
- **Broadcaster (Marquee Banner):** Broadcast announcement messages to customer devices in real-time.

### ⚡ Real-time Bi-directional Communication
- Powered by **Socket.IO** with failover WebSocket transports.
- Synchronous table state updates across both customer and administrative sessions.
- Instant audible bell notifications on the admin panel when a customer submits a new order.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Runtime** | Node.js (v18+) & Express.js |
| **Database** | MySQL 8.0+ / MariaDB (Connection pooling with `mysql2/promise`) |
| **Realtime Engine** | Socket.IO |
| **Authentication** | JSON Web Tokens (JWT) & Bcrypt password encryption |
| **Frontend Framework** | React 18 (SPA with Hooks & Context API) |
| **UI Framework** | Bootstrap 5, Bootstrap Icons, AdminLTE components |
| **Data Visualization** | Chart.js |
| **Export Utilities** | SheetJS (XLSX) |
| **Automation** | Node scripts, Concurrently, Serve |

---

## 📋 Prerequisites

Before setting up the project, ensure your workstation has:
1. **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
2. **NPM**: v9.0.0 or higher (packaged with Node.js)
3. **MySQL Server**: v8.0+ ([Download MySQL](https://dev.mysql.com/downloads/installer/)) or active XAMPP/WampServer instance.
4. **Git**: Installed and configured ([Download Git](https://git-scm.com/))

---

## 🛠️ Step-by-Step Installation

### 1. Clone Repository
```bash
git clone https://github.com/dominhtri2007/Restaurant-POS.git
cd Restaurant-POS
```

### 2. Database Initialization
1. Ensure your MySQL service is running.
2. Create an empty database:
   ```sql
   CREATE DATABASE nhahang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the schema and seed data from `schema.sql`:
   ```bash
   mysql -u root -p nhahang < schema.sql
   ```
   *(Alternatively, copy and run the SQL contents of `schema.sql` inside phpMyAdmin or DBeaver).*

### 3. Install Dependencies
Run the unified installer script from the root directory:
```bash
npm run install:all
```
This automatically installs dependencies across root, `backend`, `frontend`, and `admin-frontend`.

### 4. Environment Variables Setup
Initialize environment files by copying samples:

```bash
# Root environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env

# Customer Frontend environment
cp frontend/.env.example frontend/.env

# Admin Frontend environment
cp admin-frontend/.env.example admin-frontend/.env
```

Ensure your `backend/.env` reflects your database credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nhahang
JWT_SECRET=super_secret_jwt_key_restaurant_2026
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

---

## 🏃 Running the System

### Development Mode
Runs all 3 micro-services concurrently with hot-reload enabled:

```bash
# On Windows (Shortcut):
Double click dev.bat

# Or via Command Line:
npm run dev
```

Service URLs:
- **Customer Dine-in App:** `http://localhost:3000` (Visit `http://localhost:3000/?table=1` to simulate a table scan)
- **Admin Dashboard:** `http://localhost:3001`
- **Backend API & WebSockets:** `http://localhost:5000`

### Production Mode
Optimizes and compiles static assets, then starts the production server:

```bash
# On Windows (Shortcut):
Double click run.bat

# Or via Command Line:
npm run build
npm run start:prod
```

To stop all running services:
```bash
# On Windows (Shortcut):
Double click stop.bat

# Or via Command Line:
npm run stop
```

---

## 🔑 Default Login Accounts

The database comes pre-seeded with sample user accounts (passwords hashed using Bcrypt):

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | Administrator | Full access to POS, Menu, Reports, Users, and Settings |
| **`staff`** | `123456` | Cashier / Staff | POS operations, table view, and order processing |

---

## 📡 API & Real-time Specification

### REST API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate staff/admin & issue JWT | No |
| `GET` | `/api/auth/me` | Retrieve profile of the authenticated user | Yes |

#### Customer APIs (`/api/customer`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customer/categories` | Fetch active menu categories | No |
| `GET` | `/api/customer/products` | Fetch available food & beverage items | No |
| `POST` | `/api/customer/orders` | Place a new dine-in order for a table | No |
| `GET` | `/api/customer/orders/:id` | Check live status of an order ticket | No |
| `GET` | `/api/customer/announcement` | Fetch active broadcast marquee message | No |

#### Admin & POS APIs (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/tables` | Fetch all tables and active session states | Yes |
| `POST` | `/api/admin/tables` | Create a new dining table | Yes (Admin) |
| `PUT` | `/api/admin/tables/:id` | Update table metadata / status | Yes |
| `GET` | `/api/admin/orders` | Retrieve order queue with item details | Yes |
| `PUT` | `/api/admin/orders/:id/status`| Update order fulfillment status | Yes |
| `POST` | `/api/admin/orders/:id/pay` | Settle payment and close order | Yes |
| `GET` | `/api/admin/reports/daily` | Get aggregate revenue and sales metrics | Yes |
| `GET` | `/api/admin/shifts/current` | Check active cashier shift details | Yes |
| `POST` | `/api/admin/shifts/open` | Open a new register shift | Yes |
| `POST` | `/api/admin/shifts/close` | Reconcile and close the current shift | Yes |

### Socket.IO Events

| Event Channel | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `new_order` | Client -> Server | Order payload & table ID | Dispatched when customer submits cart |
| `order_created` | Server -> Admin | Order details & table number | Triggers sound alert and updates order grid |
| `order_status_updated` | Server -> Client | Order ID, new status | Updates customer live progress bar |
| `table_status_changed` | Server -> Both | Table ID, occupancy state | Refreshes visual table cards |
| `announcement_updated` | Server -> Frontend | Marquee content string | Immediately updates customer ticker |

---

## 🛡️ Security Implementation

- **Bcrypt Hashing:** Passwords are never stored in plaintext (salted and hashed with 10 rounds).
- **JWT Authorization:** HTTP endpoints for administration are protected by stateless Bearer tokens with strict expiry.
- **CORS Allowlist:** Cross-Origin Resource Sharing is locked to authorized frontend and admin origins.
- **Parameterized Queries:** All SQL executions leverage prepared statements via `mysql2/promise` to mitigate SQL injection vulnerabilities.
- **Rate Limiting:** API brute-force protection integrated via in-memory sliding window rate limiters.

---

## 📜 Project Scripts Reference

| Command | Action |
| :--- | :--- |
| `npm run install:all` | Installs dependencies for root and all 3 packages |
| `npm run dev` | Runs backend, customer app, and admin app concurrently |
| `npm run build` | Compiles optimized production builds of both frontends |
| `npm run start:prod` | Runs production servers with background process tracking |
| `npm run stop` | Terminate all active Node processes running the project |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

Developed & Maintained with ❤️ by **Đỗ Minh Trí** ([@dominhtri2007](https://github.com/dominhtri2007)).
