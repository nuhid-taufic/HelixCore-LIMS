const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Virus = require('../models/Virus');

// ==========================================
// BIO-INFORMATICS ALGORITHM: Needleman-Wunsch
// ==========================================
/**
 * Executes Global Sequence Alignment for DNA matching
 * @param {string} seq1 - Nucleotide Sequence 1
 * @param {string} seq2 - Nucleotide Sequence 2
 * @returns {number} Match Percentage
 */
const calculateGeneticMatch = (seq1, seq2) => {
    const matchReward = 1;
    const mismatchPenalty = -1;
    const gapPenalty = -1;

    const n = seq1.length;
    const m = seq2.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

    for (let i = 0; i <= n; i++) dp[i][0] = i * gapPenalty;
    for (let j = 0; j <= m; j++) dp[0][j] = j * gapPenalty;

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const match = dp[i - 1][j - 1] + (seq1[i - 1] === seq2[j - 1] ? matchReward : mismatchPenalty);
            const deleteSeq = dp[i - 1][j] + gapPenalty;
            const insertSeq = dp[i][j - 1] + gapPenalty;
            dp[i][j] = Math.max(match, deleteSeq, insertSeq);
        }
    }

    const score = dp[n][m];
    const maxPossibleScore = Math.max(n, m) * matchReward;
    const matchPercentage = Math.max(0, (score / maxPossibleScore) * 100);

    return matchPercentage;
};

// ==========================================
// 1. PATHOGEN / VIRUS ROUTES
// ==========================================
router.get('/viruses', async (req, res) => {
    try { res.json(await Virus.find()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/viruses', async (req, res) => {
    try {
        const { name, pattern, severity } = req.body;
        // Validate Pathogen pattern to be strictly ATCG
        if (!/^[ATCG]+$/i.test(pattern)) {
            return res.status(400).json({ error: "Invalid Pathogen Sequence. Use ATCG only." });
        }
        const newVirus = new Virus({ name, pattern: pattern.toUpperCase(), severity });
        await newVirus.save();
        res.status(201).json({ msg: "Virus pattern registered.", virus: newVirus });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [NEW] Delete Virus (Admin Power)
router.delete('/viruses/:id', async (req, res) => {
    try {
        await Virus.findByIdAndDelete(req.params.id);
        res.json({ msg: "Pathogen successfully eradicated from databank." });
    } catch (err) { res.status(500).json({ error: "Failed to delete pathogen." }); }
});

// ==========================================
// 2. SYSTEM LOGS & QUERY ROUTES
// ==========================================
router.get('/recent-history', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ updatedAt: -1 }).limit(20);
        let allScans = [];
        patients.forEach(p => {
            if (p.testHistory) {
                p.testHistory.forEach(test => {
                    allScans.push({
                        patientId: p.patientId, name: p.name, phone: p.phone,
                        testDate: test.testDate, status: test.resultStatus
                    });
                });
            }
        });
        allScans.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
        res.json(allScans.slice(0, 10));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/patient/:searchKey', async (req, res) => {
    try {
        const key = req.params.searchKey.trim();
        const patients = await Patient.find({
            $or: [
                { patientId: { $regex: key, $options: 'i' } },
                { phone: { $regex: key, $options: 'i' } },
                { name: { $regex: key, $options: 'i' } }
            ]
        }).populate('testHistory.virusTested').populate('relativesFound.matchedPatientId');

        if (!patients || patients.length === 0) return res.status(404).json({ msg: "No records found." });
        res.json(patients);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [NEW] Delete Patient Record (Admin Power)
router.delete('/patient/:id', async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        res.json({ msg: "Genomic record expunged successfully." });
    } catch (err) { res.status(500).json({ error: "Failed to delete record." }); }
});

// ==========================================
// 3. ANALYTICAL EXECUTION ROUTES (With NW Algorithm)
// ==========================================
router.post('/analyze', async (req, res) => {
    try {
        const { name, phone, dnaSequence, scientistObjectId, operatorName } = req.body;

        if (!/^[ATCG]+$/i.test(dnaSequence)) {
            return res.status(400).json({ error: "Invalid Sequence. Only A,T,C,G permitted." });
        }

        let patient = await Patient.findOne({ phone });
        if (patient) {
            patient.name = name; patient.dnaSequence = dnaSequence.toUpperCase();
        } else {
            patient = new Patient({ patientId: 'P-' + Math.floor(100000 + Math.random() * 900000), name, phone, dnaSequence: dnaSequence.toUpperCase() });
        }

        const allViruses = await Virus.find();
        const detectedViruses = allViruses.filter(v => dnaSequence.toUpperCase().includes(v.pattern));

        const allPatients = await Patient.find({ phone: { $ne: phone } });
        const relativesFound = [];

        // Executing Needleman-Wunsch Alignment for Relatives
        for (const other of allPatients) {
            const percent = calculateGeneticMatch(dnaSequence.toUpperCase(), other.dnaSequence);
            if (percent >= 50) {
                relativesFound.push({
                    relationType: percent >= 90 ? 'Identical/Self' : 'Parent/Child/Sibling',
                    matchedPatientId: other._id,
                    uiPatientId: other.patientId,
                    uiPatientName: other.name,
                    matchPercentage: percent.toFixed(2)
                });
            }
        }

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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/analyze-bulk', async (req, res) => {
    try {
        const { patientsData, scientistObjectId, operatorName } = req.body;
        const allViruses = await Virus.find();
        const results = [];

        for (const row of patientsData) {
            const name = row.name || row.Name || row.NAME;
            const phone = row.phone || row.Phone || row.PHONE;
            const dna = row.dnaSequence || row.dna || row.DNA;

            if (!name || !dna || !/^[ATCG]+$/i.test(dna)) continue; // Skips invalid DNA rows

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
        res.json({ msg: `Processed ${results.length} valid records successfully.`, results });
    } catch (err) { res.status(500).json({ error: "Batch validation failed. Verify DNA integrity." }); }
});

module.exports = router;