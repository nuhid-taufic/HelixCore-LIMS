const mongoose = require('mongoose');

/**
 * User (Scientist/Admin) Schema
 * Defines the core authentication and authorization structure for HelixCore personnel.
 */
const userSchema = new mongoose.Schema(
    {
        scientistId: {
            type: String,
            required: [true, 'Authorized Personnel ID is mandatory.'],
            unique: true,
            trim: true,
            index: true // Optimization: Faster lookup during authentication processes
        },
        password: {
            type: String,
            required: [true, 'Security passcode is mandatory.'],
            select: false // Security: Excludes password from default query results to prevent accidental exposure
        },
        role: {
            type: String,
            enum: ['scientist', 'admin'],
            default: 'scientist',
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false // Removes the internal __v version tracking field
    }
);

/**
 * Pre-save Hook (Security Recommendation)
 * In a production environment, you should implement bcrypt password hashing here
 * before the user is saved to the database.
 */

module.exports = mongoose.model('User', userSchema);