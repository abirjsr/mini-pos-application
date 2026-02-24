// import express from "express";
// import { createServer as createViteServer } from "vite";
// import pg from "pg";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";

// dotenv.config();

// const { Pool } = pg;
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// async function startServer() {
//   const app = express();
//   const PORT = 3000;

//   // Database setup (PostgreSQL)
//   const databaseUrl = process.env.DATABASE_URL;
//   if (!databaseUrl) {
//     console.error("CRITICAL: DATABASE_URL is not defined in environment variables.");
//   }

//   const pool = new Pool({
//     connectionString: databaseUrl,
//     ssl: databaseUrl?.includes("supabase") ? { rejectUnauthorized: false } : false
//   });

//   // Initialize table
//   try {
//     if (databaseUrl) {
//       await pool.query(`
//         CREATE TABLE IF NOT EXISTS products (
//           id TEXT PRIMARY KEY,
//           name TEXT NOT NULL,
//           category TEXT NOT NULL,
//           price DOUBLE PRECISION NOT NULL,
//           quantity INTEGER NOT NULL,
//           expiry_date TEXT,
//           discount DOUBLE PRECISION DEFAULT 0,
//           available BOOLEAN DEFAULT TRUE
//         )
//       `);
//       console.log("Database initialized successfully");
//     }
//   } catch (err) {
//     console.error("Database initialization error:", err);
//   }

//   app.use(express.json());

//   // Helper to calculate discounted price and availability
//   const processProduct = (p: any) => {
//     // Map database snake_case to frontend camelCase if necessary
//     const product = {
//       ...p,
//       expiryDate: p.expiry_date // Map expiry_date to expiryDate
//     };
    
//     const discountedPrice = product.price * (1 - product.discount / 100);
//     const now = new Date();
//     const expiry = product.expiryDate ? new Date(product.expiryDate) : null;
//     const available = expiry ? expiry > now : true;
    
//     return {
//       ...product,
//       available: !!available,
//       discountedPrice: parseFloat(discountedPrice.toFixed(2))
//     };
//   };

//   // API Routes
//   app.get("/api/products", async (req, res) => {
//     if (!process.env.DATABASE_URL) {
//       return res.status(500).json({ error: "DATABASE_URL is not configured" });
//     }
//     try {
//       const result = await pool.query("SELECT * FROM products");
//       res.json(result.rows.map(processProduct));
//     } catch (err: any) {
//       console.error("Error fetching products:", err);
//       res.status(500).json({ error: err.message });
//     }
//   });

//   app.post("/api/products", async (req, res) => {
//     const { id, name, category, price, quantity, expiryDate, discount } = req.body;
//     try {
//       await pool.query(
//         "INSERT INTO products (id, name, category, price, quantity, expiry_date, discount) VALUES ($1, $2, $3, $4, $5, $6, $7)",
//         [id, name, category, price, quantity, expiryDate || null, discount || 0]
//       );
//       res.status(201).json({ success: true });
//     } catch (e: any) {
//       res.status(400).json({ error: e.message });
//     }
//   });

//   app.post("/api/products/bulk", async (req, res) => {
//     const products = req.body;
//     if (!Array.isArray(products)) {
//       return res.status(400).json({ error: "Input must be a JSON array" });
//     }
    
//     const client = await pool.connect();
//     try {
//       await client.query("BEGIN");
//       for (const item of products) {
//         await client.query(
//           "INSERT INTO products (id, name, category, price, quantity, expiry_date, discount) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price, quantity = EXCLUDED.quantity, expiry_date = EXCLUDED.expiry_date, discount = EXCLUDED.discount",
//           [item.id, item.name, item.category, item.price, item.quantity, item.expiryDate || null, item.discount || 0]
//         );
//       }
//       await client.query("COMMIT");
//       res.json({ success: true, count: products.length });
//     } catch (e: any) {
//       await client.query("ROLLBACK");
//       console.error("Bulk import error:", e);
//       res.status(400).json({ error: e.message });
//     } finally {
//       client.release();
//     }
//   });

//   app.put("/api/products/:id", async (req, res) => {
//     const { id } = req.params;
//     const { name, category, price, quantity, expiryDate, discount } = req.body;
//     try {
//       await pool.query(
//         "UPDATE products SET name = $1, category = $2, price = $3, quantity = $4, expiry_date = $5, discount = $6 WHERE id = $7",
//         [name, category, price, quantity, expiryDate || null, discount || 0, id]
//       );
//       res.json({ success: true });
//     } catch (e: any) {
//       res.status(400).json({ error: e.message });
//     }
//   });

//   app.delete("/api/products/:id", async (req, res) => {
//     const { id } = req.params;
//     try {
//       await pool.query("DELETE FROM products WHERE id = $1", [id]);
//       res.json({ success: true });
//     } catch (err: any) {
//       res.status(500).json({ error: err.message });
//     }
//   });

//   app.get("/api/products/expiring", async (req, res) => {
//     try {
//       const result = await pool.query("SELECT * FROM products WHERE expiry_date IS NOT NULL");
//       const now = new Date();
//       const sevenDaysLater = new Date();
//       sevenDaysLater.setDate(now.getDate() + 7);
      
//       const expiring = result.rows
//         .map(processProduct)
//         .filter(p => {
//           const expiry = new Date(p.expiryDate);
//           return expiry >= now && expiry <= sevenDaysLater;
//         });
//       res.json(expiring);
//     } catch (err: any) {
//       res.status(500).json({ error: err.message });
//     }
//   });

//   app.get("/api/products/report/value", async (req, res) => {
//     try {
//       const result = await pool.query("SELECT * FROM products");
//       const report: Record<string, number> = {};
//       result.rows.forEach(p => {
//         const processed = processProduct(p);
//         const value = processed.discountedPrice * p.quantity;
//         report[p.category] = (report[p.category] || 0) + value;
//       });
//       res.json(report);
//     } catch (err: any) {
//       res.status(500).json({ error: err.message });
//     }
//   });

//   app.get("/api/products/report/category/:category", async (req, res) => {
//     const { category } = req.params;
//     try {
//       const result = await pool.query("SELECT * FROM products WHERE category = $1", [category]);
//       res.json(result.rows.map(processProduct));
//     } catch (err: any) {
//       res.status(500).json({ error: err.message });
//     }
//   });


//   // Vite middleware for development
//   if (process.env.NODE_ENV !== "production") {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: "spa",
//     });
//     app.use(vite.middlewares);
//   } else {
//     app.use(express.static(path.join(__dirname, "dist")));
//     app.get("*", (req, res) => {
//       res.sendFile(path.join(__dirname, "dist", "index.html"));
//     });
//   }

//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }

// startServer();
import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Database setup (PostgreSQL) - Hardcoded as requested
  const databaseUrl = "postgresql://postgres.gswzbwcpfdeykcmbnjvd:0WJvjpBS6NyzKVfp@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  // Initialize table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        quantity INTEGER NOT NULL,
        expiry_date TEXT,
        discount DOUBLE PRECISION DEFAULT 0,
        available BOOLEAN DEFAULT TRUE
      )
    `);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }

  app.use(express.json());

  // Helper to calculate discounted price and availability
  const processProduct = (p: any) => {
    // Map database snake_case to frontend camelCase
    const product = {
      ...p,
      expiryDate: p.expiry_date
    };
    
    const discountedPrice = product.price * (1 - product.discount / 100);
    const now = new Date();
    const expiry = product.expiryDate ? new Date(product.expiryDate) : null;
    const available = expiry ? expiry > now : true;
    
    return {
      ...product,
      available: !!available,
      discountedPrice: parseFloat(discountedPrice.toFixed(2))
    };
  };

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM products");
      res.json(result.rows.map(processProduct));
    } catch (err: any) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    const { id, name, category, price, quantity, expiryDate, discount } = req.body;
    try {
      await pool.query(
        "INSERT INTO products (id, name, category, price, quantity, expiry_date, discount) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, name, category, price, quantity, expiryDate || null, discount || 0]
      );
      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/products/bulk", async (req, res) => {
    const products = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Input must be a JSON array" });
    }
    
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of products) {
        await client.query(
          "INSERT INTO products (id, name, category, price, quantity, expiry_date, discount) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price, quantity = EXCLUDED.quantity, expiry_date = EXCLUDED.expiry_date, discount = EXCLUDED.discount",
          [item.id, item.name, item.category, item.price, item.quantity, item.expiryDate || null, item.discount || 0]
        );
      }
      await client.query("COMMIT");
      res.json({ success: true, count: products.length });
    } catch (e: any) {
      await client.query("ROLLBACK");
      console.error("Bulk import error:", e);
      res.status(400).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { name, category, price, quantity, expiryDate, discount } = req.body;
    try {
      await pool.query(
        "UPDATE products SET name = $1, category = $2, price = $3, quantity = $4, expiry_date = $5, discount = $6 WHERE id = $7",
        [name, category, price, quantity, expiryDate || null, discount || 0, id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM products WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/products/expiring", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM products WHERE expiry_date IS NOT NULL");
      const now = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(now.getDate() + 7);
      
      const expiring = result.rows
        .map(processProduct)
        .filter(p => {
          const expiry = new Date(p.expiryDate);
          return expiry >= now && expiry <= sevenDaysLater;
        });
      res.json(expiring);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/products/report/value", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM products");
      const report: Record<string, number> = {};
      result.rows.forEach(p => {
        const processed = processProduct(p);
        const value = processed.discountedPrice * p.quantity;
        report[p.category] = (report[p.category] || 0) + value;
      });
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/products/report/category/:category", async (req, res) => {
    const { category } = req.params;
    try {
      const result = await pool.query("SELECT * FROM products WHERE category = $1", [category]);
      res.json(result.rows.map(processProduct));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();