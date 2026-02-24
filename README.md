# my pos - Inventory Management System

A modern Product Inventory Management (PIM) system featuring real-time tracking, expiring product alerts, and detailed category reports.

## Features

- **Real-time Dashboard**: Overview of total products, availability, expiring items, and total inventory value.
- **Inventory Catalog**: Comprehensive list of all products with search and filtering capabilities.
- **Product Management**: Add, edit, and delete products with ease.
- **Bulk Import**: Quickly populate your inventory using JSON data.
- **Expiring Alerts**: Dedicated view for products expiring within the next 7 days.
- **Visual Reports**: Category-wise distribution of inventory value.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Motion, Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: Supabase (PostgreSQL).

## Setup Instructions

### Prerequisites

- Node.js installed.
- A Supabase project with a PostgreSQL database.

### Environment Variables

Create a `.env` file in the root directory and add your Supabase connection string:

```env
DATABASE_URL="your_supabase_postgresql_connection_string"
```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Bulk Import Guide

To import multiple products at once:

1. Navigate to the **Bulk Import** tab in the sidebar.
2. Paste your product data in JSON array format into the text area.
3. Click **Execute Bulk Import**.

### Example JSON Format

```json
[
    {
        "id": "P002",
        "name": "Banana",
        "category": "Fruits",
        "price": 50.0,
        "quantity": 100,
        "expiryDate": "2026-02-25",
        "discount": 5.0
    },
    {
        "id": "P003",
        "name": "Milk",
        "category": "Dairy",
        "price": 80.0,
        "quantity": 30,
        "expiryDate": "2026-02-24",
        "discount": 0.0
    },
    {
        "id": "P004",
        "name": "Cheese",
        "category": "Dairy",
        "price": 250.0,
        "quantity": 20,
        "expiryDate": "2026-04-10",
        "discount": 15.0
    },
    {
        "id": "P005",
        "name": "Shampoo",
        "category": "Personal Care",
        "price": 300.0,
        "quantity": 60,
        "expiryDate": null,
        "discount": 20.0
    },
    {
        "id": "P006",
        "name": "Rice",
        "category": "Grains",
        "price": 120.0,
        "quantity": 200,
        "expiryDate": "2027-01-01",
        "discount": 0.0
    }
]
```

## Database Schema

The application automatically initializes the following table in your PostgreSQL database:

```sql
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    quantity INTEGER NOT NULL,
    expiry_date TEXT,
    discount DOUBLE PRECISION DEFAULT 0,
    available BOOLEAN DEFAULT TRUE
);
```
