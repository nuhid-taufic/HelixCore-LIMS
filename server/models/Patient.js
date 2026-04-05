const mongoose = require('mongoose');

/**
 * @module PatientSchema
 * @description Represents a subject's genomic profile and diagnostic history.
 */
const patientSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            required: [true, 'Subject ID is mandatory.'],
            unique: true,
            index: true
        },
        name: {
            type: String,
            required: [true, 'Subject name is required.'],
            trim: true,
            index: true
        },
        phone: {
            type: String,
            required: [true, 'Contact number is required.'],
            index: true
        },
        dnaSequence: {
            type: String,
            required: [true, 'DNA sequence is required.'],
            uppercase: true,
            trim: true
        },
        relativesFound: [
            {
                relationType: {
                    type: String,
                    enum: ['Parent/Child', 'Identical/Self', 'Sibling', 'Relative', 'Unknown']
                },
                matchedPatientId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Patient'
                },
                uiPatientId: { type: String },
                uiPatientName: { type: String },
                matchPercentage: { type: Number }
            }
        ],
        testHistory: [
            {
                virusTested: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Virus'
                },
                resultStatus: {
                    type: String,
                    enum: ['Safe', 'Danger', 'Inconclusive'],
                    default: 'Safe'
                },
                testedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                operatorName: {
                    type: String,
                    default: 'System Core' // Prevents validation errors on legacy records
                },
                testDate: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model('Patient', patientSchema);