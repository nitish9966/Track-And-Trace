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

// ✅ Improved error handling in database functions
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

// ✅ Handle case sensitivity issue with "serialNumber"
async function addProduct(serialNumber, name, brand) {
    try {
        await client.query('INSERT INTO product ("serialNumber", name, brand) VALUES ($1, $2, $3)', [serialNumber, name, brand]);
        console.log('Product added successfully');
    } catch (error) {
        console.error("Error adding product:", error.message);
    }
}

// ✅ File upload configurations
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

// ✅ API Routes

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

// ✅ Fixed "serialNumber" column case sensitivity
app.get('/product/serialNumber', async (req, res) => {
    try {
        const data = await client.query('SELECT "serialnumber" FROM product');
        res.send(data.rows);
    } catch (error) {
        console.error("Error fetching serial numbers:", error.message);
        res.status(500).send("Server error");
    }
});

app.post('/addproduct', async (req, res) => {
    const { serialNumber, name, brand } = req.body;
    await addProduct(serialNumber, name, brand);
    res.send('Product added');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
