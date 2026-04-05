const mongoose = require('mongoose');

/**
 * Virus (Pathogen) Schema
 * Defines the structure for storing infectious nucleotide patterns and their severity classifications.
 */
const virusSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Pathogen nomenclature is required.'],
            unique: true,
            trim: true,
            index: true // Optimization: Facilitates rapid identification by name
        },
        pattern: {
            type: String,
            required: [true, 'Nucleotide sequence pattern is mandatory for DNA matching.'],
            uppercase: true,
            trim: true,
            index: true // Optimization: Crucial for high-speed sequence matching algorithms
        },
        severity: {
            type: String,
            required: [true, 'Severity classification must be defined.'],
            enum: {
                values: ['High', 'Medium', 'Low'],
                message: '{VALUE} is not a recognized severity level.'
            },
            default: 'High'
        }
    },
    {
        timestamps: true,
        versionKey: false // Removes the internal __v field for cleaner database documents
    }
);

/**
 * Model Export
 * Represents the 'Virus' collection in the HelixCore databank.
 */
module.exports = mongoose.model('Virus', virusSchema);