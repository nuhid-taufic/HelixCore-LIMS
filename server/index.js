require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- Route Definitions ---
const authRoutes = require('./routes/auth');
const dnaRoutes = require('./routes/dna');

const app = express();

// --- Middleware Configuration ---
app.use(express.json());
app.use(cors());

// --- Global Route Mounting ---
app.use('/api/auth', authRoutes);
app.use('/api/dna', dnaRoutes);

/**
 * Database Infrastructure Layer
 * Establishes connection with MongoDB and handles lifecycle events.
 */
const initializeDatabase = async () => {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
        console.error("Critical Failure: MONGO_URI is missing from environment variables.");
        process.exit(1); // Terminates the process if the database URI is unavailable
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Infrastructure Status: HelixCore Databank Connected Successfully.");
    } catch (error) {
        console.error("Infrastructure Failure: Database Connection Error:", error.message);
        // Implement retry logic or alert system here if necessary
    }
};

// Initialize the database connection
initializeDatabase();

/**
 * Server Lifecycle Management
 * Binds the application to the designated network port.
 */
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`System Status: HelixCore Server operational on port ${PORT}`);
});

// Handling unhandled promise rejections (Optional but Recommended)
process.on('unhandledRejection', (err) => {
    console.error(`System Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});