const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Virus = require('../models/Virus');

// ==========================================
// 1. PATHOGEN / VIRUS ROUTES
// ==========================================

/**
 * @route   GET /api/dna/viruses
 * @desc    Fetch all available viruses from the databank
 */
router.get('/viruses', async (req, res) => {
    try {
        res.json(await Virus.find());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/dna/viruses
 * @desc    Add a new virus pattern to the databank
 */
router.post('/viruses', async (req, res) => {
    try {
        const { name, pattern, severity } = req.body;
        const newVirus = new Virus({
            name,
            pattern: pattern.toUpperCase(),
            severity
        });
        await newVirus.save();
        res.status(201).json({ msg: "Virus pattern successfully registered.", virus: newVirus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. SYSTEM LOGS & QUERY ROUTES
// ==========================================

/**
 * @route   GET /api/dna/recent-history
 * @desc    Fetch individual latest scans for the terminal activity log.
 */
router.get('/recent-history', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ updatedAt: -1 }).limit(20);
        let allScans = [];
        patients.forEach(p => {
            if (p.testHistory) {
                p.testHistory.forEach(test => {
                    allScans.push({
                        patientId: p.patientId,
                        name: p.name,
                        phone: p.phone,
                        testDate: test.testDate,
                        status: test.resultStatus
                    });
                });
            }
        });
        allScans.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
        res.json(allScans.slice(0, 10));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   GET /api/dna/patient/:searchKey
 * @desc    Smart search with relational population for relatives and viruses.
 */
router.get('/patient/:searchKey', async (req, res) => {
    try {
        const key = req.params.searchKey.trim();
        const patients = await Patient.find({
            $or: [
                { patientId: { $regex: key, $options: 'i' } },
                { phone: { $regex: key, $options: 'i' } },
                { name: { $regex: key, $options: 'i' } }
            ]
        })
            .populate('testHistory.virusTested')
            .populate('relativesFound.matchedPatientId');

        if (!patients || patients.length === 0) {
            return res.status(404).json({ msg: "No diagnostic records found." });
        }
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. ANALYTICAL EXECUTION ROUTES
// ==========================================

/**
 * @route   POST /api/dna/analyze
 * @desc    Execute single-subject DNA scan and relational matching.
 */
router.post('/analyze', async (req, res) => {
    try {
        const { name, phone, dnaSequence, scientistObjectId, operatorName } = req.body;
        let patient = await Patient.findOne({ phone });

        if (patient) {
            patient.name = name;
            patient.dnaSequence = dnaSequence;
        } else {
            const currentPatientId = 'P-' + Math.floor(100000 + Math.random() * 900000);
            patient = new Patient({ patientId: currentPatientId, name, phone, dnaSequence });
        }

        const allViruses = await Virus.find();
        const detectedViruses = allViruses.filter(v => dnaSequence.includes(v.pattern));

        const allPatients = await Patient.find({ phone: { $ne: phone } });
        const relativesFound = allPatients.map(other => {
            let matches = 0;
            const minLen = Math.min(dnaSequence.length, other.dnaSequence.length);
            for (let i = 0; i < minLen; i++) if (dnaSequence[i] === other.dnaSequence[i]) matches++;
            const percent = (matches / Math.max(dnaSequence.length, other.dnaSequence.length)) * 100;

            if (percent >= 50) {
                return {
                    relationType: percent >= 90 ? 'Identical/Self' : 'Parent/Child',
                    matchedPatientId: other._id,
                    uiPatientId: other.patientId,
                    uiPatientName: other.name,
                    matchPercentage: percent.toFixed(2)
                };
            }
            return null;
        }).filter(r => r !== null);

        patient.relativesFound = relativesFound;
        const status = detectedViruses.length > 0 ? "Danger" : "Safe";

        patient.testHistory.push({
            virusTested: detectedViruses.length > 0 ? detectedViruses[0]._id : null,
            resultStatus: status,
            testedBy: scientistObjectId,
            operatorName: operatorName || 'HQ Admin'
        });

        await patient.save();
        res.json({ isInfected: detectedViruses.length > 0, detectedViruses, patient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /api/dna/analyze-bulk
 * @desc    Batch process Excel data with defensive header parsing.
 */
router.post('/analyze-bulk', async (req, res) => {
    try {
        const { patientsData, scientistObjectId, operatorName } = req.body;
        const allViruses = await Virus.find();
        const results = [];

        for (const row of patientsData) {
            const name = row.name || row.Name || row.NAME;
            const phone = row.phone || row.Phone || row.PHONE;
            const dna = row.dnaSequence || row.dna || row.DNA;

            if (!name || !dna) continue;

            let patient = await Patient.findOne({ phone: phone?.toString() });
            if (!patient) {
                patient = new Patient({
                    patientId: 'P-' + Math.floor(100000 + Math.random() * 900000),
                    name, phone: phone || 'N/A', dnaSequence: dna.toUpperCase()
                });
            }

            const detected = allViruses.filter(v => dna.toUpperCase().includes(v.pattern));
            patient.testHistory.push({
                virusTested: detected.length > 0 ? detected[0]._id : null,
                resultStatus: detected.length > 0 ? "Danger" : "Safe",
                testedBy: scientistObjectId,
                operatorName: operatorName || 'Batch Protocol'
            });

            await patient.save();
            results.push({ patientId: patient.patientId, name, isInfected: detected.length > 0 });
        }
        res.json({ msg: `Processed ${results.length} records successfully.`, results });
    } catch (err) {
        res.status(500).json({ error: "Batch validation failed. Verify DNA integrity." });
    }
});

module.exports = router;