const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // To use environment variables

const app = express();
app.use(express.static("public"));


const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://shayara-gold.onrender.com' : 'http://localhost:5173',  // Allow localhost for dev and your deployed URL for production
    methods: 'GET,POST',  // Allow specific HTTP methods
    allowedHeaders: 'Content-Type',  // Allow specific headers
};

app.use(cors(corsOptions));  // Apply the CORS options

const PORT = process.env.PORT || 4001; // Use environment port for Render

// MongoDB connection details using environment variables
const homeUri = process.env.HOME_MONGO_URI;
const usersUri = process.env.USERS_MONGO_URI;

let homeDb, bestSellingItems, editorials;
let usersDb, usersDesignData;

// Initialize MongoDB for both databases
async function initializeDatabases() {
    try {
        // Connect to Home Page DB
        if (!homeUri) throw new Error("HOME_MONGO_URI is not set in environment variables");
        const homeClient = await MongoClient.connect(homeUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to Home Page MongoDB");
        homeDb = homeClient.db("home_page");
        bestSellingItems = homeDb.collection("best_selling_items");
        editorials = homeDb.collection("editorials");

        // Connect to Users Collection DB
        if (!usersUri) throw new Error("USERS_MONGO_URI is not set in environment variables");
        const usersClient = await MongoClient.connect(usersUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to Users Collection MongoDB");
        usersDb = usersClient.db("users_collection");
        usersDesignData = usersDb.collection("users_design_data");

        // Start server after DB connections
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Terminate the app if DB connection fails
    }
}

initializeDatabases();

// Middleware
app.use(express.json());

// Home Page Routes
app.get('/best_selling_items', async (req, res) => {
    try {
        const items = await bestSellingItems.find().toArray();
        res.status(200).json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).send("Error fetching items: " + err.message);
    }
});

app.get('/editorials', async (req, res) => {
    try {
        const editorialData = await editorials.find().toArray();
        res.status(200).json(editorialData);
    } catch (err) {
        console.error("Error fetching editorials:", err);
        res.status(500).send("Error fetching editorials: " + err.message);
    }
});

// Users Collection Routes
app.get('/users_design_data', async (req, res) => {
    try {
        const users = await usersDesignData.find().toArray();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).send("Error fetching users: " + err.message);
    }
});

// POST: Add new user design data
app.post('/users_design_data', async (req, res) => {
    console.log("POST request received on /users_design_data");
    try {
        const newUserData = req.body; // Data sent in the body of the POST request
        console.log("Received Data:", newUserData);

        // Insert the new user data into the users_design_data collection
        const result = await usersDesignData.insertOne(newUserData);
        res.status(201).json({ message: "User data added successfully", data: result });
    } catch (err) {
        console.error("Error adding user data:", err);
        res.status(500).send("Error adding user data: " + err.message);
    }
});
