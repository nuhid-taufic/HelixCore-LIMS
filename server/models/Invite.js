const mongoose = require('mongoose');

/**
 * Invite Schema
 * Manages single-use cryptographic tokens for secure personnel registration.
 */
const inviteSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: [true, 'Security token is mandatory for invitation validation.'],
            unique: true,
            index: true // Database optimization: Ensures faster read operations during token validation
        },
        isUsed: {
            type: Boolean,
            default: false
        },
        usedBy: {
            type: String, // Stores the Scientist ID (e.g., SC-002) once the token is consumed
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false // Removes the default '__v' field for cleaner database documents
    }
);

// Note: If you ever need to reference the actual Scientist object instead of just the ID string, 
// you can change 'usedBy' type to mongoose.Schema.Types.ObjectId and add ref: 'Scientist'.

module.exports = mongoose.model('Invite', inviteSchema);