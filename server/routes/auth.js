const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Models Integration
const User = require('../models/User');
const Invite = require('../models/Invite');
const Patient = require('../models/Patient');
const Virus = require('../models/Virus');

/**
 * @route   POST /api/auth/register
 * @desc    Onboard new scientists using a single-use invite token
 * @access  Public (Requires valid token)
 */
router.post('/register', async (req, res) => {
    try {
        const { scientistId, password, token } = req.body;

        // 1. Token Validation & Integrity Check
        const invite = await Invite.findOne({ token, isUsed: false });
        if (!invite) {
            return res.status(403).json({
                success: false,
                message: "Security Protocol: Invalid or consumed invite token."
            });
        }

        // 2. Identity Collision Check
        const identityConflict = await User.findOne({ scientistId });
        if (identityConflict) {
            return res.status(409).json({
                success: false,
                message: "Registration Failure: Scientist ID already registered in databank."
            });
        }

        // 3. Persistent Storage of New Personnel
        const personnel = new User({ scientistId, password });
        await personnel.save();

        // 4. Token Invalidation (The Burn Protocol)
        invite.isUsed = true;
        invite.usedBy = scientistId;
        await invite.save();

        return res.status(201).json({
            success: true,
            message: "Clearance Granted: Personnel successfully onboarded."
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate personnel and generate session tokens
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { scientistId, password } = req.body;

        // --- Administrative Access (Emergency/Root Override) ---
        if (scientistId === 'ADMIN-ALPHA' && password === 'matrix2026') {
            const token = jwt.sign(
                { id: 'ROOT_ADMIN', role: 'admin' },
                process.env.JWT_SECRET || 'secure_fallback_key',
                { expiresIn: '24h' }
            );
            return res.status(200).json({
                token,
                role: 'admin',
                message: "Root Access Initialized: Welcome, Administrator."
            });
        }

        // --- Standard Personnel Authentication ---
        // Explicitly selecting password as it is marked 'select: false' in the Schema
        const user = await User.findOne({ scientistId }).select('+password');

        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Authentication Failed: Invalid credentials."
            });
        }

        const token = jwt.sign(
            { id: user._id, role: 'scientist' },
            process.env.JWT_SECRET || 'secure_fallback_key',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            token,
            role: 'scientist',
            message: "Session Initialized: Lab access authorized."
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// ADMINISTRATIVE CONTROL MODULES
// ==========================================

/**
 * Power 1: Cryptographic Token Generation
 */
router.post('/admin/generate-invite', async (req, res) => {
    try {
        const secureToken = crypto.randomBytes(16).toString('hex');
        const inviteEntry = new Invite({ token: secureToken });
        await inviteEntry.save();

        return res.status(200).json({
            success: true,
            token: secureToken,
            inviteLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/register/${secureToken}`
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Power 2: System-Wide Analytics
 */
router.get('/admin/stats', async (req, res) => {
    try {
        const [patients, pathogens, scientists, invites] = await Promise.all([
            Patient.countDocuments(),
            Virus.countDocuments(),
            User.countDocuments(),
            Invite.countDocuments({ isUsed: false })
        ]);

        return res.status(200).json({
            totalPatients: patients,
            totalViruses: pathogens,
            totalScientists: scientists,
            unusedInvites: invites
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Power 3: Personnel Management
 */
router.get('/admin/scientists', async (req, res) => {
    try {
        const personnelList = await User.find().sort({ createdAt: -1 });
        return res.status(200).json(personnelList);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/admin/scientists/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Clearance Revoked: Personnel removed from active directory."
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Power 4: System Audit Infrastructure
 */
router.get('/admin/audit-logs', async (req, res) => {
    try {
        const chronologicalLogs = await Patient.find()
            .select('patientId name phone updatedAt testHistory')
            .populate('testHistory.virusTested', 'name severity')
            .populate('testHistory.testedBy', 'scientistId')
            .sort({ updatedAt: -1 })
            .limit(50); // Increased limit for broader audit coverage

        return res.status(200).json(chronologicalLogs);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Power 5: Full Databank Access
 */
router.get('/admin/all-patients', async (req, res) => {
    try {
        const patientDatabank = await Patient.find()
            .populate('testHistory.virusTested')
            .sort({ createdAt: -1 });
        return res.status(200).json(patientDatabank);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;