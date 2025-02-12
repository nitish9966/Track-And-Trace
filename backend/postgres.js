const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 5000;

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "2003",
    database: "TrackAndTrace"
});

client.connect();

// ------------------------------
// Database helper functions
// ------------------------------

async function createAccount(username, password, role) {
    try {
        await client.query('INSERT INTO auth (username, password, role) VALUES ($1, $2, $3)', [username, password, role]);
        console.log('Account created successfully');
    } catch (error) {
        console.error("Error creating account:", error.message);
    }
}

async function changePassword(username, password) {
    try {
        await client.query('UPDATE auth SET password = $1 WHERE username = $2', [password, username]);
        console.log('Password updated successfully');
    } catch (error) {
        console.error("Error updating password:", error.message);
    }
}

async function createProfile(username, name, description, website, location, image, role) {
    try {
        await client.query(
            'INSERT INTO profile (username, name, description, website, location, image, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [username, name, description, website, location, image, role]
        );
        console.log('Profile created successfully');
    } catch (error) {
        console.error("Error creating profile:", error.message);
    }
}

async function addProduct(serialNumber, name, brand) {
    try {
        await client.query('INSERT INTO product ("serialNumber", name, brand) VALUES ($1, $2, $3)', [serialNumber, name, brand]);
        console.log('Product added successfully');
    } catch (error) {
        console.error("Error adding product:", error.message);
    }
}

// ------------------------------
// Multer configurations for file uploads
// ------------------------------

const storageProduct = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads/product'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const storageProfile = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads/profile'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// ------------------------------
// API Routes
// ------------------------------

// Auth Routes
app.get('/authAll', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM auth');
        res.send(data.rows);
    } catch (error) {
        console.error("Error fetching auth data:", error.message);
        res.status(500).send("Server error");
    }
});

app.post('/auth/:username/:password', async (req, res) => {
    try {
        const { username, password } = req.params;
        const data = await client.query('SELECT * FROM auth WHERE username = $1 AND password = $2', [username, password]);
        res.send(data.rows);
    } catch (error) {
        console.error("Error in authentication:", error.message);
        res.status(500).send("Server error");
    }
});

app.post('/addaccount', async (req, res) => {
    const { username, password, role } = req.body;
    await createAccount(username, password, role);
    res.send('Account created');
});

app.post('/changepsw', async (req, res) => {
    const { username, password } = req.body;
    await changePassword(username, password);
    res.send('Password updated');
});

// Profile Routes
app.get('/profileAll', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM profile');
        res.send(data.rows);
    } catch (error) {
        console.error("Error fetching profiles:", error.message);
        res.status(500).send("Server error");
    }
});

app.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const data = await client.query('SELECT * FROM profile WHERE username = $1', [username]);
        res.send(data.rows);
    } catch (error) {
        console.error("Error fetching profile:", error.message);
        res.status(500).send("Server error");
    }
});

app.post('/addprofile', async (req, res) => {
    const { username, name, description, website, location, image, role } = req.body;
    await createProfile(username, name, description, website, location, image, role);
    res.send('Profile created');
});

app.put('/updateprofile', async (req, res) => {
    const { username, name, description, website, location, image, role } = req.body;
    try {
        await client.query(
            'UPDATE profile SET name = $1, description = $2, website = $3, location = $4, image = $5, role = $6 WHERE username = $7',
            [name, description, website, location, image, role, username]
        );
        res.send('Profile updated');
    } catch (error) {
        console.error("Error updating profile:", error.message);
        res.status(500).send("Server error");
    }
});

app.delete('/deleteprofile/:username', async (req, res) => {
    const { username } = req.params;
    try {
        await client.query('DELETE FROM profile WHERE username = $1', [username]);
        res.send('Profile deleted');
    } catch (error) {
        console.error("Error deleting profile:", error.message);
        res.status(500).send("Server error");
    }
});

// Image Upload Routes
app.post('/upload/profile', (req, res) => {
    let upload = multer({ storage: storageProfile }).single('image');
    upload(req, res, (err) => {
        if (!req.file) return res.status(400).send('Please select an image to upload');
        if (err) return res.status(500).send(err);
        res.send('Profile image uploaded');
    });
});

app.post('/upload/product', (req, res) => {
    let upload = multer({ storage: storageProduct }).single('image');
    upload(req, res, (err) => {
        if (!req.file) return res.status(400).send('Please select an image to upload');
        if (err) return res.status(500).send(err);
        res.send('Product image uploaded');
    });
});

// Serve Uploaded Files
app.get('/file/profile/:fileName', (req, res) => {
    const { fileName } = req.params;
    res.sendFile(path.join(__dirname, 'public/uploads/profile', fileName));
});

app.get('/file/product/:fileName', (req, res) => {
    const { fileName } = req.params;
    res.sendFile(path.join(__dirname, 'public/uploads/product', fileName));
});

// Product Routes

// Returns all product serial numbers
// app.get('/product/serialNumber', async (req, res) => {
//     try {
//         const data = await client.query('SELECT "serialnumber" FROM product');
//         res.send(data.rows);
//     } catch (error) {
//         console.error("Error fetching serial numbers:", error.message);
//         res.status(500).send("Server error");
//     }
// });

// Add a new product
app.post('/addproduct', async (req, res) => {
    const { serialNumber, name, brand, description, image } = req.body;
    await addProduct(serialNumber, name, brand, description, image);
    res.send('Product added');
});

// ------------------------------
// NEW: Get a specific product by serial number
app.get('/product/:serialNumber', async (req, res) => {
    const { serialNumber } = req.params;
    try {
        const data = await client.query('SELECT * FROM product WHERE "serialNumber" = $1', [serialNumber]);
        if (data.rows.length === 0) {
            res.status(404).send('Product not found');
        } else {
            res.send(data.rows[0]);
        }
    } catch (error) {
        console.error("Error fetching product:", error.message);
        res.status(500).send("Server error");
    }
});

// Endpoint to add a new product history record
app.post('/addproduct_history', async (req, res) => {
    // Expected JSON payload:
    // {
    //   "serialNumber": "PRODUCT_SERIAL",
    //   "actor": "User or Manufacturer Name",
    //   "location": "Location string",
    //   "timestamp": 1660000000,  // Unix timestamp
    //   "is_sold": false
    // }
    const { serialNumber, actor, location, timestamp, is_sold } = req.body;
    
    try {
      // Insert the history record.
      // Here, we assume the "product_id" in product_history is the same as the product's serial number.
      // Adjust the query if your schema uses a different reference.
      await client.query(
        'INSERT INTO product_history (product_id, actor, location, timestamp, is_sold) VALUES ($1, $2, $3, $4, $5)',
        [serialNumber, actor, location, timestamp, is_sold]
      );
      
      res.send('Product history added successfully');
    } catch (error) {
      console.error("Error adding product history:", error.message);
      res.status(500).send("Server error");
    }
  });

  app.get('/product_history/:serialNumber', async (req, res) => {
    const { serialNumber } = req.params;
    try {
      // Query the product_history table using the product's serial number.
      // Adjust the column name if necessary.
      const data = await client.query(
        'SELECT * FROM product_history WHERE product_id = $1',
        [serialNumber]
      );
      res.send(data.rows);
    } catch (error) {
      console.error("Error fetching product history:", error.message);
      res.status(500).send("Server error");
    }
  });

  const getUsername = async () => {
    if (!auth?.user) return;
    try {
      const res = await axios.get(`http://localhost:5000/profile/${auth.user}`);
      if (res.data && res.data[0] && res.data[0].name) {
        setManuName(res.data[0].name);
      } else {
        setManuName(auth.user);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      setManuName(auth.user);
    }
  };  
  

// Delete a specific product
app.delete('/deleteproduct/:serialNumber', async (req, res) => {
    const { serialNumber } = req.params;
    try {
        await client.query('DELETE FROM product WHERE "serialNumber" = $1', [serialNumber]);
        res.send('Product deleted');
    } catch (error) {
        console.error("Error deleting product:", error.message);
        res.status(500).send("Server error");
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
