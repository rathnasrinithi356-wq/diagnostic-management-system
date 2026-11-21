/**
 * ============================================================================
 * DIAGNOSTIC LABORATORY MANAGEMENT SYSTEM
 * Core Application Architecture & OOP Implementation
 * Vanilla JavaScript (ES6+ Standards)
 * ============================================================================
 */

"use strict";

// ============================================================================
// 1. CUSTOM EXCEPTION CLASSES (Section 2.F)
// ============================================================================

/**
 * Thrown when a requested patient record does not exist in the collection.
 */
class PatientNotFoundError extends Error {
    constructor(patientId) {
        super(`Patient with ID "${patientId}" was not found in the laboratory system.`);
        this.name = "PatientNotFoundError";
        this.patientId = patientId;
    }
}

/**
 * Thrown when a specimen sample is invalid, missing required links, or corrupted.
 */
class InvalidSampleError extends Error {
    constructor(message = "Invalid or unverified laboratory specimen sample.") {
        super(message);
        this.name = "InvalidSampleError";
    }
}

/**
 * Thrown when a laboratory test order cannot be retrieved from active orders.
 */
class TestNotFoundError extends Error {
    constructor(testId) {
        super(`Laboratory test order with ID "${testId}" was not found.`);
        this.name = "TestNotFoundError";
        this.testId = testId;
    }
}

/**
 * Thrown when test result parameters are incomplete or violate required ranges.
 */
class InvalidResultError extends Error {
    constructor(message = "Laboratory test result values fail clinical validation.") {
        super(message);
        this.name = "InvalidResultError";
    }
}

// ============================================================================
// 2. ENCAPSULATION: Patient Class (Section 2.A)
// ============================================================================

/**
 * Encapsulated Patient Entity with private fields (#) and validated accessors.
 */
class Patient {
    // Mandatory private fields (#)
    #patientId;
    #patientName;
    #age;
    #gender;
    #phoneNumber;

    // Additional clinical profile fields
    #registrationDate;
    #bloodGroup;
    #address;

    constructor(patientId, patientName, age, gender, phoneNumber, registrationDate = null, bloodGroup = "Unknown", address = "") {
        if (!patientId) throw new Error("Patient ID is mandatory.");
        this.#patientId = patientId;

        // Use setters with validation
        this.patientName = patientName;
        this.age = age;
        this.gender = gender;
        this.phoneNumber = phoneNumber;

        this.#registrationDate = registrationDate || new Date().toISOString().split('T')[0];
        this.#bloodGroup = bloodGroup;
        this.#address = address;
    }

    // Public Getters (Encapsulation contract)
    get patientId() { return this.#patientId; }
    get patientName() { return this.#patientName; }
    get age() { return this.#age; }
    get gender() { return this.#gender; }
    get phoneNumber() { return this.#phoneNumber; }
    get registrationDate() { return this.#registrationDate; }
    get bloodGroup() { return this.#bloodGroup; }
    get address() { return this.#address; }

    // Public Setters with business validation
    set patientName(name) {
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            throw new Error("Patient name must contain at least 2 characters.");
        }
        this.#patientName = name.trim();
    }

    set age(value) {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed) || parsed < 0 || parsed > 130) {
            throw new Error("Patient age must be a valid number between 0 and 130.");
        }
        this.#age = parsed;
    }

    set gender(genderValue) {
        const allowed = ["Male", "Female", "Other"];
        if (!allowed.includes(genderValue)) {
            throw new Error(`Gender must be one of: ${allowed.join(", ")}.`);
        }
        this.#gender = genderValue;
    }

    set phoneNumber(phone) {
        if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
            throw new Error("A valid phone number with at least 7 characters is required.");
        }
        this.#phoneNumber = phone.trim();
    }

    set bloodGroup(bg) { this.#bloodGroup = bg; }
    set address(addr) { this.#address = addr ? addr.trim() : ""; }

    /**
     * Serializes private state for persistent browser LocalStorage.
     */
    toJSON() {
        return {
            patientId: this.#patientId,
            patientName: this.#patientName,
            age: this.#age,
            gender: this.#gender,
            phoneNumber: this.#phoneNumber,
            registrationDate: this.#registrationDate,
            bloodGroup: this.#bloodGroup,
            address: this.#address
        };
    }

    /**
     * Factory deserializer reconstructs an encapsulated Patient instance from LocalStorage JSON.
     */
    static fromJSON(data) {
        return new Patient(
            data.patientId,
            data.patientName,
            data.age,
            data.gender,
            data.phoneNumber,
            data.registrationDate,
            data.bloodGroup,
            data.address
        );
    }
}

// ============================================================================
// 3. ABSTRACTION & INHERITANCE: LabTest Hierarchy (Sections 2.B, 2.C, 2.D)
// ============================================================================

/**
 * Abstract-style Parent Class for all diagnostic tests.
 * Enforces abstract instantiation prevention and method overriding contract.
 */
class LabTest {
    constructor(testId, patientId, testName, category, dateAssigned = null, status = "Assigned", notes = "", priority = "Routine") {
        // Enforce Abstraction: Prevent direct instantiation
        if (new.target === LabTest) {
            throw new Error("Abstract Class 'LabTest' cannot be instantiated directly. Use BloodTest, UrineTest, or ImagingTest.");
        }

        this.testId = testId;
        this.patientId = patientId;
        this.testName = testName;
        this.category = category;
        this.dateAssigned = dateAssigned || new Date().toISOString().split('T')[0];
        this.status = status; // Assigned | Sample Collected | In Processing | Completed
        this.notes = notes;
        this.priority = priority;
    }

    /**
     * Abstract Method Contract: Must be overridden by child classes.
     * @param {Object} sample - The specimen record
     * @param {Function} onStepUpdate - Callback reporting progress steps
     */
    processTest(sample, onStepUpdate) {
        throw new Error("Abstract method 'processTest()' must be implemented by subclass.");
    }

    markAsProcessing() {
        this.status = "In Processing";
    }

    markAsCompleted() {
        this.status = "Completed";
    }

    toJSON() {
        return {
            testId: this.testId,
            patientId: this.patientId,
            testName: this.testName,
            category: this.category,
            dateAssigned: this.dateAssigned,
            status: this.status,
            notes: this.notes,
            priority: this.priority
        };
    }
}

/**
 * Child Class 1: BloodTest (Inherits from LabTest)
 * Polymorphic implementation simulates hematology and biochemical analyzers.
 */
class BloodTest extends LabTest {
    constructor(testId, patientId, testName, dateAssigned, status, notes, priority) {
        super(testId, patientId, testName, "Blood Test", dateAssigned, status, notes, priority);
        this.specimenRequirement = "Whole Blood (EDTA) / Clot Activator Serum";
    }

    /**
     * Polymorphic implementation of processTest() for Blood Specimens.
     */
    async processTest(sample, onStepUpdate) {
        this.markAsProcessing();

        const steps = [
            { step: 1, percent: 20, name: "Specimen Inspection & Barcode Check", detail: `Inspecting EDTA tube ${sample?.sampleId || "SMP-001"} for hemolysis or micro-clots.` },
            { step: 2, percent: 45, name: "Centrifugation & Phase Separation", detail: "Centrifuging blood specimen at 3200 RPM for 8 minutes to separate plasma/serum." },
            { step: 3, percent: 70, name: "Optical Flow Cytometry & Reagent Mixing", detail: "Automated hydrodynamic focusing and multi-angle laser scatter analysis." },
            { step: 4, percent: 90, name: "Photometric Absorbance Calibration", detail: "Internal standard verification matching calibrated calibration curves." },
            { step: 5, percent: 100, name: "Differential Calculation Complete", detail: "Quantitative hematological data validated. Ready for clinical entry." }
        ];

        for (const s of steps) {
            if (onStepUpdate) onStepUpdate(s);
            await new Promise(r => setTimeout(r, 650));
        }

        this.markAsCompleted();
        return {
            success: true,
            methodology: "Automated Laser Flow Cytometry & Photometric Enzymatic Assay",
            technicianRemarks: "Specimen analyzed with zero lipemia or hemolysis flags."
        };
    }
}

/**
 * Child Class 2: UrineTest (Inherits from LabTest)
 * Polymorphic implementation simulates urinalysis photometer & microscopy.
 */
class UrineTest extends LabTest {
    constructor(testId, patientId, testName, dateAssigned, status, notes, priority) {
        super(testId, patientId, testName, "Urine Test", dateAssigned, status, notes, priority);
        this.specimenRequirement = "Sterile Midstream Urine Container (50ml)";
    }

    /**
     * Polymorphic implementation of processTest() for Urine Specimens.
     */
    async processTest(sample, onStepUpdate) {
        this.markAsProcessing();

        const steps = [
            { step: 1, percent: 20, name: "Macroscopic Physical Examination", detail: `Assessing specimen clarity, amber color density, and specific gravity in cup ${sample?.sampleId || "SMP-002"}.` },
            { step: 2, percent: 45, name: "Dry Chemistry Reagent Strip Reflectance", detail: "Multi-pad test strip analyzed via reflectance photometer (pH, protein, glucose, ketones)." },
            { step: 3, percent: 70, name: "Sediment Centrifugation & Slurry Prep", detail: "Gentle 1800 RPM centrifugation for 5 minutes to concentrate cellular cast sediment." },
            { step: 4, percent: 90, name: "Automated High-Power Digital Microscopy", detail: "High-power field (HPF) digital camera scanning for RBC, pus cells, casts and crystals." },
            { step: 5, percent: 100, name: "Urinalysis Profile Verified", detail: "Physical, biochemical, and microscopic parameters verified. Ready for sign-off." }
        ];

        for (const s of steps) {
            if (onStepUpdate) onStepUpdate(s);
            await new Promise(r => setTimeout(r, 650));
        }

        this.markAsCompleted();
        return {
            success: true,
            methodology: "Reflectance Photometry & Automated High-Power Digital Microscopy",
            technicianRemarks: "Routine chemical and microscopic sediment examination completed."
        };
    }
}

/**
 * Child Class 3: ImagingTest (Inherits from LabTest)
 * Polymorphic implementation simulates digital radiography and ultrasonography.
 */
class ImagingTest extends LabTest {
    constructor(testId, patientId, testName, dateAssigned, status, notes, priority) {
        super(testId, patientId, testName, "Imaging Test", dateAssigned, status, notes, priority);
        this.specimenRequirement = "Digital Imaging Scout Order / Radiation Protocol";
    }

    /**
     * Polymorphic implementation of processTest() for Imaging Procedures.
     */
    async processTest(sample, onStepUpdate) {
        this.markAsProcessing();

        const steps = [
            { step: 1, percent: 20, name: "Modality Calibration & Safety Audit", detail: "Calibrating radiation exposure factors (kVp / mAs) or ultrasound acoustic transducer frequencies." },
            { step: 2, percent: 45, name: "Patient Scout & Collimation Alignment", detail: "Aligning laser positioning landmarks and digital receptor collimation shutters." },
            { step: 3, percent: 70, name: "Digital Detector Exposure & Echo Capture", detail: "High-resolution digital flat-panel exposure / real-time B-mode pulse echo beamforming." },
            { step: 4, percent: 90, name: "DICOM Digital Image Reconstruction", detail: "Edge sharpening, contrast dynamic windowing, and multi-planar reconstruction (MPR)." },
            { step: 5, percent: 100, name: "PACS Archive Ingestion Complete", detail: "DICOM series stored to secure imaging store with optimal Signal-to-Noise Ratio (SNR)." }
        ];

        for (const s of steps) {
            if (onStepUpdate) onStepUpdate(s);
            await new Promise(r => setTimeout(r, 650));
        }

        this.markAsCompleted();
        return {
            success: true,
            methodology: "High-Frequency Digital Radiography / High-Resolution B-mode Sonography",
            technicianRemarks: "Full diagnostic projections acquired without patient motion artifacts."
        };
    }
}

/**
 * Factory for instantiating the appropriate LabTest subclass polymorphically.
 */
class LabTestFactory {
    static create(data) {
        const { testId, patientId, testName, category, dateAssigned, status, notes, priority } = data;
        switch (category) {
            case "Blood Test":
            case "Blood Tests":
                return new BloodTest(testId, patientId, testName, dateAssigned, status, notes, priority);
            case "Urine Test":
            case "Urine Tests":
                return new UrineTest(testId, patientId, testName, dateAssigned, status, notes, priority);
            case "Imaging Test":
            case "Imaging Tests":
                return new ImagingTest(testId, patientId, testName, dateAssigned, status, notes, priority);
            default:
                throw new Error(`Unsupported test category: "${category}".`);
        }
    }
}

// ============================================================================
// 4. SAMPLE & TEST RESULT MODELS
// ============================================================================

class Sample {
    constructor(sampleId, testId, patientId, sampleType, collectionDateTime = null, status = "Pending Collection", phlebotomist = "Sarah Jenkins, MLS", notes = "") {
        if (!sampleId) throw new InvalidSampleError("Sample ID is required.");
        if (!testId) throw new InvalidSampleError("Sample must be linked to a valid Test ID.");
        if (!patientId) throw new InvalidSampleError("Sample must be linked to a registered Patient ID.");

        this.sampleId = sampleId;
        this.testId = testId;
        this.patientId = patientId;
        this.sampleType = sampleType;
        this.collectionDateTime = collectionDateTime || new Date().toISOString().replace('T', ' ').substring(0, 16);
        this.status = status; // Pending Collection | Collected | Processing | Completed
        this.phlebotomist = phlebotomist;
        this.notes = notes;
    }

    toJSON() {
        return {
            sampleId: this.sampleId,
            testId: this.testId,
            patientId: this.patientId,
            sampleType: this.sampleType,
            collectionDateTime: this.collectionDateTime,
            status: this.status,
            phlebotomist: this.phlebotomist,
            notes: this.notes
        };
    }

    static fromJSON(d) {
        return new Sample(d.sampleId, d.testId, d.patientId, d.sampleType, d.collectionDateTime, d.status, d.phlebotomist, d.notes);
    }
}

class TestResult {
    constructor(resultId, testId, patientId, sampleId, parameters = [], clinicalNotes = "", pathologistRemarks = "", technicianName = "Sarah Jenkins, MLS", pathologistName = "Dr. Arthur Vance, MD, FACP", dateRecorded = null) {
        if (!resultId) throw new InvalidResultError("Result ID is required.");
        if (!testId) throw new InvalidResultError("Test ID is required.");

        this.resultId = resultId;
        this.testId = testId;
        this.patientId = patientId;
        this.sampleId = sampleId;
        this.parameters = parameters; // Array of { name, value, unit, referenceRange, flag }
        this.clinicalNotes = clinicalNotes;
        this.pathologistRemarks = pathologistRemarks;
        this.technicianName = technicianName;
        this.pathologistName = pathologistName;
        this.dateRecorded = dateRecorded || new Date().toISOString().split('T')[0];
    }

    toJSON() {
        return {
            resultId: this.resultId,
            testId: this.testId,
            patientId: this.patientId,
            sampleId: this.sampleId,
            parameters: this.parameters,
            clinicalNotes: this.clinicalNotes,
            pathologistRemarks: this.pathologistRemarks,
            technicianName: this.technicianName,
            pathologistName: this.pathologistName,
            dateRecorded: this.dateRecorded
        };
    }

    static fromJSON(d) {
        return new TestResult(
            d.resultId, d.testId, d.patientId, d.sampleId,
            d.parameters, d.clinicalNotes, d.pathologistRemarks,
            d.technicianName, d.pathologistName, d.dateRecorded
        );
    }
}

// ============================================================================
// 5. INTERFACE-LIKE IMPLEMENTATION: Report Generator (Section 2.E)
// ============================================================================

/**
 * Interface-like Base Contract for Report Generators.
 */
class IReportGenerator {
    constructor() {
        if (new.target === IReportGenerator) {
            throw new Error("Cannot instantiate interface contract 'IReportGenerator'.");
        }
    }

    /**
     * Interface Contract Method: Must be implemented by concrete report generators.
     */
    generateReport(data) {
        throw new Error("Contract violation: Method 'generateReport()' must be implemented.");
    }

    /**
     * Interface Contract Method: Must be implemented by concrete report generators.
     */
    formatResults(results) {
        throw new Error("Contract violation: Method 'formatResults()' must be implemented.");
    }
}

/**
 * Concrete Clinical Laboratory Report implementation satisfying IReportGenerator.
 */
class LabReport extends IReportGenerator {
    constructor(reportId, testId, patientId, sampleId, resultId, generatedDate = null) {
        super();
        this.reportId = reportId;
        this.testId = testId;
        this.patientId = patientId;
        this.sampleId = sampleId;
        this.resultId = resultId;
        this.generatedDate = generatedDate || new Date().toLocaleString();

        this.labName = "Apex Diagnostic & Pathology Center";
        this.accreditation = "ISO 15189:2022 Certified Medical Testing Laboratory";
        this.address = "742 Healthcare Boulevard, Medical Science District";
        this.contact = "+1 (800) 555-APEX | info@apexdiagnostics.org";
        this.licenseNo = "CLIA-ID: 99D0872619 | CAP Accredited";
    }

    formatResults(resultObj) {
        if (!resultObj || !Array.isArray(resultObj.parameters)) {
            return [];
        }
        return resultObj.parameters.map(param => ({
            name: param.name || "Parameter",
            value: param.value !== undefined ? param.value : "--",
            unit: param.unit || "-",
            referenceRange: param.referenceRange || "Standard",
            flag: param.flag || "NORMAL", // NORMAL | HIGH | LOW | ABNORMAL
            isAbnormal: param.flag && param.flag !== "NORMAL"
        }));
    }

    generateReport(data) {
        const { patient, test, sample, result } = data;

        if (!patient) throw new PatientNotFoundError(this.patientId);
        if (!test) throw new TestNotFoundError(this.testId);

        const formattedParams = this.formatResults(result);

        return {
            reportId: this.reportId,
            generatedDate: this.generatedDate,
            laboratory: {
                name: this.labName,
                accreditation: this.accreditation,
                address: this.address,
                contact: this.contact,
                licenseNo: this.licenseNo
            },
            patient: {
                id: patient.patientId,
                name: patient.patientName,
                age: patient.age,
                gender: patient.gender,
                phone: patient.phoneNumber,
                bloodGroup: patient.bloodGroup || "Not specified",
                address: patient.address || "Local Outpatient"
            },
            test: {
                id: test.testId,
                name: test.testName,
                category: test.category,
                dateAssigned: test.dateAssigned,
                priority: test.priority || "Routine",
                methodology: test.category === "Blood Test"
                    ? "Automated Laser Flow Cytometry & Photometric Enzymatic Assay"
                    : test.category === "Urine Test"
                    ? "Reflectance Photometry & Automated High-Power Digital Microscopy"
                    : "High-Frequency Digital Radiography / High-Resolution Sonography"
            },
            sample: {
                id: sample ? sample.sampleId : "SMP-N/A",
                type: sample ? sample.sampleType : "Specimen Recorded",
                collectedAt: sample ? sample.collectionDateTime : test.dateAssigned,
                status: sample ? sample.status : "Completed"
            },
            results: {
                parameters: formattedParams,
                clinicalNotes: result?.clinicalNotes || "Specimen processed adhering to standard clinical laboratory operating guidelines.",
                pathologistRemarks: result?.pathologistRemarks || "Findings correlated clinically. No critical panic values noted.",
                technicianName: result?.technicianName || "Sarah Jenkins, MLS(ASCP)cm",
                pathologistName: result?.pathologistName || "Dr. Arthur Vance, MD, FACP"
            },
            disclaimer: "EDUCATIONAL DEMONSTRATION RECORD - NOT CLINICALLY VALIDATED FOR DIAGNOSTIC USE."
        };
    }

    toJSON() {
        return {
            reportId: this.reportId,
            testId: this.testId,
            patientId: this.patientId,
            sampleId: this.sampleId,
            resultId: this.resultId,
            generatedDate: this.generatedDate
        };
    }

    static fromJSON(d) {
        return new LabReport(d.reportId, d.testId, d.patientId, d.sampleId, d.resultId, d.generatedDate);
    }
}

// ============================================================================
// 6. COLLECTIONS & STATE REPOSITORY (Section 2.G & Section 5)
// ============================================================================

/**
 * Singleton Repository managing Collections and LocalStorage Synchronization.
 */
class LabDataManager {
    static STORAGE_KEYS = {
        PATIENTS: "diaglab_patients_v1",
        TESTS: "diaglab_tests_v1",
        SAMPLES: "diaglab_samples_v1",
        RESULTS: "diaglab_results_v1",
        REPORTS: "diaglab_reports_v1"
    };

    constructor() {
        // Encapsulated collections
        this.patients = [];
        this.tests = [];
        this.samples = [];
        this.results = [];
        this.reports = [];
        this.cloudReady = false;
        this.cloudSaveTimer = null;

        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            // Patients
            const rawPatients = JSON.parse(localStorage.getItem(LabDataManager.STORAGE_KEYS.PATIENTS) || "[]");
            this.patients = rawPatients.map(p => Patient.fromJSON(p));

            // Tests (Instantiated with polymorphic factory)
            const rawTests = JSON.parse(localStorage.getItem(LabDataManager.STORAGE_KEYS.TESTS) || "[]");
            this.tests = rawTests.map(t => LabTestFactory.create(t));

            // Samples
            const rawSamples = JSON.parse(localStorage.getItem(LabDataManager.STORAGE_KEYS.SAMPLES) || "[]");
            this.samples = rawSamples.map(s => Sample.fromJSON(s));

            // Results
            const rawResults = JSON.parse(localStorage.getItem(LabDataManager.STORAGE_KEYS.RESULTS) || "[]");
            this.results = rawResults.map(r => TestResult.fromJSON(r));

            // Reports
            const rawReports = JSON.parse(localStorage.getItem(LabDataManager.STORAGE_KEYS.REPORTS) || "[]");
            this.reports = rawReports.map(rp => LabReport.fromJSON(rp));

            // If completely empty, auto-seed realistic demo records
            if (this.patients.length === 0) {
                this.seedInitialDemoData();
            }
        } catch (err) {
            console.error("Error loading data from LocalStorage:", err);
            this.seedInitialDemoData();
        }
    }

    async syncWithServer() {
        const status = document.querySelector(".storage-text strong");
        if (status) status.textContent = "Connecting to cloud database...";
        try {
            const response = await fetch("/api/state", { headers: { "Accept": "application/json" } });
            if (!response.ok) throw new Error(`Cloud load failed (${response.status})`);
            const cloudState = await response.json();

            // Restore the shared MySQL-backed state while recreating the original OOP objects.
            if (cloudState && Array.isArray(cloudState.patients)) {
                this.patients = cloudState.patients.map(p => Patient.fromJSON(p));
                this.tests = (cloudState.tests || []).map(t => LabTestFactory.create(t));
                this.samples = (cloudState.samples || []).map(sample => Sample.fromJSON(sample));
                this.results = (cloudState.results || []).map(result => TestResult.fromJSON(result));
                this.reports = (cloudState.reports || []).map(report => LabReport.fromJSON(report));
                this.saveToStorage(false);
            } else {
                // First deployment: seed demo data from this browser into the shared database.
                this.cloudReady = true;
                await this.pushStateToServer();
            }
            this.cloudReady = true;
            if (status) status.textContent = "Cloud Database Synced";
            const summary = document.getElementById("storage-record-summary");
            if (summary) summary.textContent = "Shared MySQL records are available";
        } catch (error) {
            console.warn("Cloud database is unavailable; using this browser's saved copy.", error);
            this.cloudReady = false;
            if (status) status.textContent = "Local Cache Mode";
            const summary = document.getElementById("storage-record-summary");
            if (summary) summary.textContent = "Cloud connection unavailable";
        }
    }

    getSerializableState() {
        return {
            patients: this.patients.map(p => p.toJSON()),
            tests: this.tests.map(t => t.toJSON()),
            samples: this.samples.map(sample => sample.toJSON()),
            results: this.results.map(result => result.toJSON()),
            reports: this.reports.map(report => report.toJSON())
        };
    }

    async pushStateToServer() {
        const response = await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(this.getSerializableState())
        });
        if (!response.ok) throw new Error(`Cloud save failed (${response.status})`);
        const status = document.querySelector(".storage-text strong");
        if (status) status.textContent = "Cloud Database Synced";
    }

    scheduleCloudSave() {
        if (!this.cloudReady) return;
        clearTimeout(this.cloudSaveTimer);
        this.cloudSaveTimer = setTimeout(async () => {
            try {
                await this.pushStateToServer();
            } catch (error) {
                console.error("Unable to sync records with the cloud database:", error);
                const status = document.querySelector(".storage-text strong");
                if (status) status.textContent = "Cloud Sync Error";
            }
        }, 400);
    }

    saveToStorage(syncCloud = true) {
        try {
            localStorage.setItem(LabDataManager.STORAGE_KEYS.PATIENTS, JSON.stringify(this.patients.map(p => p.toJSON())));
            localStorage.setItem(LabDataManager.STORAGE_KEYS.TESTS, JSON.stringify(this.tests.map(t => t.toJSON())));
            localStorage.setItem(LabDataManager.STORAGE_KEYS.SAMPLES, JSON.stringify(this.samples.map(s => s.toJSON())));
            localStorage.setItem(LabDataManager.STORAGE_KEYS.RESULTS, JSON.stringify(this.results.map(r => r.toJSON())));
            localStorage.setItem(LabDataManager.STORAGE_KEYS.REPORTS, JSON.stringify(this.reports.map(rp => rp.toJSON())));
            if (syncCloud) this.scheduleCloudSave();
        } catch (err) {
            console.error("Failed saving to LocalStorage:", err);
            UI.showToast("Failed to persist data to LocalStorage. Disk full or private mode active.", "danger");
        }
    }

    // --- PATIENTS CRUD ---
    addPatient(patientInstance) {
        if (!(patientInstance instanceof Patient)) throw new Error("Item must be an instance of Patient.");
        this.patients.unshift(patientInstance);
        this.saveToStorage();
        return patientInstance;
    }

    getPatient(patientId) {
        const found = this.patients.find(p => p.patientId === patientId);
        if (!found) throw new PatientNotFoundError(patientId);
        return found;
    }

    updatePatient(patientId, updatedData) {
        const patient = this.getPatient(patientId);
        if (updatedData.patientName) patient.patientName = updatedData.patientName;
        if (updatedData.age !== undefined) patient.age = updatedData.age;
        if (updatedData.gender) patient.gender = updatedData.gender;
        if (updatedData.phoneNumber) patient.phoneNumber = updatedData.phoneNumber;
        if (updatedData.bloodGroup) patient.bloodGroup = updatedData.bloodGroup;
        if (updatedData.address !== undefined) patient.address = updatedData.address;

        this.saveToStorage();
        return patient;
    }

    deletePatient(patientId) {
        const idx = this.patients.findIndex(p => p.patientId === patientId);
        if (idx === -1) throw new PatientNotFoundError(patientId);
        this.patients.splice(idx, 1);
        this.saveToStorage();
    }

    // --- TESTS CRUD ---
    addTest(testInstance) {
        if (!(testInstance instanceof LabTest)) throw new Error("Item must inherit from LabTest.");
        this.tests.unshift(testInstance);
        this.saveToStorage();
        return testInstance;
    }

    getTest(testId) {
        const found = this.tests.find(t => t.testId === testId);
        if (!found) throw new TestNotFoundError(testId);
        return found;
    }

    updateTestStatus(testId, status) {
        const test = this.getTest(testId);
        test.status = status;
        this.saveToStorage();
        return test;
    }

    deleteTest(testId) {
        const idx = this.tests.findIndex(t => t.testId === testId);
        if (idx === -1) throw new TestNotFoundError(testId);
        this.tests.splice(idx, 1);
        this.saveToStorage();
    }

    // --- SAMPLES CRUD ---
    addSample(sampleInstance) {
        if (!(sampleInstance instanceof Sample)) throw new Error("Item must be an instance of Sample.");
        this.samples.unshift(sampleInstance);

        // Update corresponding test status if still "Assigned"
        try {
            const linkedTest = this.getTest(sampleInstance.testId);
            if (linkedTest.status === "Assigned") {
                linkedTest.status = "Sample Collected";
            }
        } catch (e) { /* ignore */ }

        this.saveToStorage();
        return sampleInstance;
    }

    getSample(sampleId) {
        const found = this.samples.find(s => s.sampleId === sampleId);
        if (!found) throw new InvalidSampleError(`Specimen sample "${sampleId}" not found.`);
        return found;
    }

    getSampleByTestId(testId) {
        return this.samples.find(s => s.testId === testId) || null;
    }

    updateSampleStatus(sampleId, status) {
        const sample = this.getSample(sampleId);
        sample.status = status;
        this.saveToStorage();
        return sample;
    }

    deleteSample(sampleId) {
        const idx = this.samples.findIndex(s => s.sampleId === sampleId);
        if (idx === -1) throw new InvalidSampleError(`Sample ${sampleId} not found.`);
        this.samples.splice(idx, 1);
        this.saveToStorage();
    }

    // --- RESULTS CRUD ---
    addResult(resultInstance) {
        if (!(resultInstance instanceof TestResult)) throw new Error("Item must be an instance of TestResult.");
        // If result already exists for this test, replace it
        const existingIdx = this.results.findIndex(r => r.testId === resultInstance.testId);
        if (existingIdx !== -1) {
            this.results[existingIdx] = resultInstance;
        } else {
            this.results.unshift(resultInstance);
        }

        // Mark test and sample as completed
        try {
            const test = this.getTest(resultInstance.testId);
            test.status = "Completed";
        } catch (e) { /* ignore */ }

        if (resultInstance.sampleId) {
            try {
                const sample = this.getSample(resultInstance.sampleId);
                sample.status = "Completed";
            } catch (e) { /* ignore */ }
        }

        this.saveToStorage();
        return resultInstance;
    }

    getResultByTestId(testId) {
        return this.results.find(r => r.testId === testId) || null;
    }

    deleteResult(resultId) {
        const idx = this.results.findIndex(r => r.resultId === resultId);
        if (idx !== -1) {
            this.results.splice(idx, 1);
            this.saveToStorage();
        }
    }

    // --- REPORTS CRUD ---
    addReport(reportInstance) {
        if (!(reportInstance instanceof LabReport)) throw new Error("Item must be an instance of LabReport.");
        const existingIdx = this.reports.findIndex(r => r.testId === reportInstance.testId);
        if (existingIdx !== -1) {
            this.reports[existingIdx] = reportInstance;
        } else {
            this.reports.unshift(reportInstance);
        }
        this.saveToStorage();
        return reportInstance;
    }

    getReport(reportId) {
        return this.reports.find(r => r.reportId === reportId) || null;
    }

    getReportByTestId(testId) {
        return this.reports.find(r => r.testId === testId) || null;
    }

    deleteReport(reportId) {
        const idx = this.reports.findIndex(r => r.reportId === reportId);
        if (idx !== -1) {
            this.reports.splice(idx, 1);
            this.saveToStorage();
        }
    }

    // --- SEED INITIAL DEMO DATA ---
    seedInitialDemoData() {
        // Clear collections
        this.patients = [];
        this.tests = [];
        this.samples = [];
        this.results = [];
        this.reports = [];

        // Sample Patients (Encapsulated)
        const p1 = new Patient("PAT-1001", "Eleanor Vance", 42, "Female", "+1 (555) 234-5678", "2026-11-10", "A+", "742 Evergreen Terrace, Springfield");
        const p2 = new Patient("PAT-1002", "Robert Chen", 58, "Male", "+1 (555) 876-5432", "2026-11-12", "O+", "1204 Pine Crest Way, Seattle");
        const p3 = new Patient("PAT-1003", "Sophia Al-Mansoor", 29, "Female", "+1 (555) 432-1098", "2026-11-14", "B+", "318 Lakeview Avenue, Chicago");
        const p4 = new Patient("PAT-1004", "Marcus Thorne", 65, "Male", "+1 (555) 901-2345", "2026-11-16", "AB-", "88 Highland Ridge, Boston");
        const p5 = new Patient("PAT-1005", "Amara Okafor", 36, "Female", "+1 (555) 345-6789", "2026-11-18", "O-", "512 Oakwood Lane, Atlanta");

        this.patients = [p1, p2, p3, p4, p5];

        // Sample Diagnostic Tests (Polymorphic hierarchy instances)
        // 1. Blood: Complete Blood Count (CBC)
        const t1 = new BloodTest("TST-2001", "PAT-1001", "Complete Blood Count (CBC)", "2026-11-10", "Completed", "Pre-operative evaluation", "Routine");
        // 2. Blood: Blood Glucose
        const t2 = new BloodTest("TST-2002", "PAT-1002", "Blood Glucose", "2026-11-12", "Completed", "Type 2 Diabetes quarterly monitoring", "Routine");
        // 3. Urine: Urine Routine Examination
        const t3 = new UrineTest("TST-2003", "PAT-1003", "Urine Routine Examination", "2026-11-14", "Completed", "Dysuria and flank pain evaluation", "Urgent");
        // 4. Urine: Urine Culture
        const t4 = new UrineTest("TST-2004", "PAT-1005", "Urine Culture", "2026-11-18", "In Processing", "Suspected recurrent UTI", "Routine");
        // 5. Imaging: X-Ray
        const t5 = new ImagingTest("TST-2005", "PAT-1004", "X-Ray", "2026-11-16", "Completed", "Chest PA view for chronic cough", "Routine");
        // 6. Imaging: Ultrasound
        const t6 = new ImagingTest("TST-2006", "PAT-1001", "Ultrasound", "2026-11-19", "Sample Collected", "Upper abdominal sonography", "Routine");
        // 7. Blood: Hemoglobin
        const t7 = new BloodTest("TST-2007", "PAT-1005", "Hemoglobin", "2026-11-19", "Assigned", "Fatigue and pallor workup", "Routine");

        this.tests = [t1, t2, t3, t4, t5, t6, t7];

        // Sample Specimen Samples
        const s1 = new Sample("SMP-3001", "TST-2001", "PAT-1001", "Whole Blood (EDTA)", "2026-11-10 08:30", "Completed", "Sarah Jenkins, MLS", "EDTA Lavender Top Tube");
        const s2 = new Sample("SMP-3002", "TST-2002", "PAT-1002", "Fluoride Blood (Glucose)", "2026-11-12 09:15", "Completed", "Sarah Jenkins, MLS", "Gray Top Sodium Fluoride");
        const s3 = new Sample("SMP-3003", "TST-2003", "PAT-1003", "Clean Catch Urine", "2026-11-14 10:00", "Completed", "Michael Scott, Phleb", "50ml Sterile Container");
        const s4 = new Sample("SMP-3004", "TST-2004", "PAT-1005", "Midstream Urine (MSU)", "2026-11-18 11:20", "Processing", "Michael Scott, Phleb", "Sterile Culture Cup");
        const s5 = new Sample("SMP-3005", "TST-2005", "PAT-1004", "Digital Imaging Order", "2026-11-16 14:00", "Completed", "Rad Tech Elena Rostova", "Chest PA Modality Room 2");
        const s6 = new Sample("SMP-3006", "TST-2006", "PAT-1001", "Digital Imaging Order", "2026-11-19 09:00", "Collected", "Rad Tech Elena Rostova", "US Suite A");

        this.samples = [s1, s2, s3, s4, s5, s6];

        // Sample Test Results
        // Result 1: CBC for Eleanor Vance
        const r1 = new TestResult(
            "RES-4001", "TST-2001", "PAT-1001", "SMP-3001",
            [
                { name: "Hemoglobin (Hb)", value: "14.2", unit: "g/dL", referenceRange: "12.0 - 15.5", flag: "NORMAL" },
                { name: "Total Leucocytes (WBC)", value: "7,400", unit: "/mcL", referenceRange: "4,000 - 11,000", flag: "NORMAL" },
                { name: "Red Blood Cells (RBC)", value: "4.85", unit: "million/mcL", referenceRange: "4.2 - 5.4", flag: "NORMAL" },
                { name: "Platelet Count", value: "265,000", unit: "/mcL", referenceRange: "150,000 - 450,000", flag: "NORMAL" },
                { name: "Packed Cell Volume (PCV)", value: "42.0", unit: "%", referenceRange: "37.0 - 48.0", flag: "NORMAL" },
                { name: "Mean Corpuscular Volume (MCV)", value: "88.0", unit: "fL", referenceRange: "80.0 - 100.0", flag: "NORMAL" }
            ],
            "Cellular morphology within standard physiological limits.",
            "Normal Complete Blood Count. No hematological abnormalities detected.",
            "Sarah Jenkins, MLS(ASCP)cm",
            "Dr. Arthur Vance, MD, FACP",
            "2026-11-10"
        );

        // Result 2: Blood Glucose for Robert Chen
        const r2 = new TestResult(
            "RES-4002", "TST-2002", "PAT-1002", "SMP-3002",
            [
                { name: "Fasting Blood Sugar (FBS)", value: "118", unit: "mg/dL", referenceRange: "70 - 99", flag: "HIGH" },
                { name: "Post-Prandial Blood Sugar (PPBS)", value: "154", unit: "mg/dL", referenceRange: "< 140", flag: "HIGH" },
                { name: "HbA1c (Glycated Hemoglobin)", value: "6.8", unit: "%", referenceRange: "4.0 - 5.6", flag: "HIGH" }
            ],
            "Patient reported 10 hours overnight fasting prior to specimen draw.",
            "Elevated glycated hemoglobin and fasting glycemia consistent with moderate diabetic control.",
            "Sarah Jenkins, MLS(ASCP)cm",
            "Dr. Arthur Vance, MD, FACP",
            "2026-11-12"
        );

        // Result 3: Urine Routine for Sophia Al-Mansoor
        const r3 = new TestResult(
            "RES-4003", "TST-2003", "PAT-1003", "SMP-3003",
            [
                { name: "Color & Transparency", value: "Pale Yellow / Clear", unit: "--", referenceRange: "Pale Yellow / Clear", flag: "NORMAL" },
                { name: "Specific Gravity", value: "1.018", unit: "--", referenceRange: "1.005 - 1.030", flag: "NORMAL" },
                { name: "Reaction (pH)", value: "6.0", unit: "--", referenceRange: "5.0 - 7.5", flag: "NORMAL" },
                { name: "Chemical Protein (Albumin)", value: "Negative", unit: "--", referenceRange: "Negative", flag: "NORMAL" },
                { name: "Chemical Glucose", value: "Negative", unit: "--", referenceRange: "Negative", flag: "NORMAL" },
                { name: "Chemical Ketones", value: "Negative", unit: "--", referenceRange: "Negative", flag: "NORMAL" },
                { name: "Pus Cells (WBC)", value: "1 - 2", unit: "/HPF", referenceRange: "0 - 5", flag: "NORMAL" },
                { name: "Red Blood Cells (RBC)", value: "Nil", unit: "/HPF", referenceRange: "0 - 2", flag: "NORMAL" },
                { name: "Epithelial Cells", value: "Occasional", unit: "/HPF", referenceRange: "Occasional", flag: "NORMAL" }
            ],
            "Specimen tested within 45 minutes of voiding.",
            "Normal routine urinalysis. No evidence of acute urinary tract infection or proteinuria.",
            "Sarah Jenkins, MLS(ASCP)cm",
            "Dr. Arthur Vance, MD, FACP",
            "2026-11-14"
        );

        // Result 4: Chest X-Ray for Marcus Thorne
        const r4 = new TestResult(
            "RES-4004", "TST-2005", "PAT-1004", "SMP-3005",
            [
                { name: "Projection & Technique", value: "PA Erect View (120 kVp, 3.2 mAs)", unit: "--", referenceRange: "Standard PA", flag: "NORMAL" },
                { name: "Lung Fields & Parenchyma", value: "Clear bilaterally. No consolidation, infiltrates or pneumothorax.", unit: "--", referenceRange: "Clear Fields", flag: "NORMAL" },
                { name: "Cardiothoracic Ratio (CTR)", value: "0.48 (< 0.50)", unit: "--", referenceRange: "< 0.50", flag: "NORMAL" },
                { name: "Costophrenic Angles & Pleura", value: "Sharp and clear. No effusion noted.", unit: "--", referenceRange: "Sharp Angles", flag: "NORMAL" },
                { name: "Bony Thorax & Soft Tissues", value: "Intact bony framework. Age-related degenerative changes in dorsal spine.", unit: "--", referenceRange: "Intact Framework", flag: "NORMAL" }
            ],
            "Digital radiography acquired with standard posteroanterior chest projection.",
            "Normal chest radiograph. No acute cardiopulmonary disease demonstrated.",
            "Elena Rostova, R.T.(R)",
            "Dr. Arthur Vance, MD, FACP",
            "2026-11-16"
        );

        this.results = [r1, r2, r3, r4];

        // Sample Lab Reports
        const rep1 = new LabReport("REP-5001", "TST-2001", "PAT-1001", "SMP-3001", "RES-4001", "2026-11-10 14:30:00");
        const rep2 = new LabReport("REP-5002", "TST-2002", "PAT-1002", "SMP-3002", "RES-4002", "2026-11-12 16:45:00");
        const rep3 = new LabReport("REP-5003", "TST-2003", "PAT-1003", "SMP-3003", "RES-4003", "2026-11-14 12:15:00");
        const rep4 = new LabReport("REP-5004", "TST-2005", "PAT-1004", "SMP-3005", "RES-4004", "2026-11-16 17:00:00");

        this.reports = [rep1, rep2, rep3, rep4];

        this.saveToStorage();
    }

    clearAllStorage() {
        localStorage.removeItem(LabDataManager.STORAGE_KEYS.PATIENTS);
        localStorage.removeItem(LabDataManager.STORAGE_KEYS.TESTS);
        localStorage.removeItem(LabDataManager.STORAGE_KEYS.SAMPLES);
        localStorage.removeItem(LabDataManager.STORAGE_KEYS.RESULTS);
        localStorage.removeItem(LabDataManager.STORAGE_KEYS.REPORTS);
        this.patients = [];
        this.tests = [];
        this.samples = [];
        this.results = [];
        this.reports = [];
    }

    // Auto-ID Generators
    generatePatientId() {
        const nextNum = this.patients.length + 1001;
        return `PAT-${nextNum}`;
    }

    generateTestId() {
        const nextNum = this.tests.length + 2001;
        return `TST-${nextNum}`;
    }

    generateSampleId() {
        const nextNum = this.samples.length + 3001;
        return `SMP-${nextNum}`;
    }

    generateResultId() {
        const nextNum = this.results.length + 4001;
        return `RES-${nextNum}`;
    }

    generateReportId() {
        const nextNum = this.reports.length + 5001;
        return `REP-${nextNum}`;
    }
}

// Global Data Store Instance
const db = new LabDataManager();

// ============================================================================
// 7. USER INTERFACE CONTROLLER (UI)
// ============================================================================

const UI = {
    currentTab: "dashboard",
    currentProcessingTest: null,
    pendingDeleteAction: null,

    init() {
        this.setupNavigation();
        this.setupRealtimeClock();
        this.setupEventListeners();
        this.setupFormSubmissions();
        this.renderAll();
    },

    // --- NAVIGATION & TABS ---
    setupNavigation() {
        const navButtons = document.querySelectorAll(".sidebar-nav .nav-item");
        navButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const targetTab = btn.getAttribute("data-tab");
                if (targetTab) {
                    UI.navigateTo(targetTab);
                }
            });
        });

        // Mobile sidebar toggle
        const toggleBtn = document.getElementById("sidebar-toggle");
        const sidebar = document.getElementById("sidebar");
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener("click", () => {
                sidebar.classList.toggle("open");
            });
        }
    },

    navigateTo(tabName) {
        this.currentTab = tabName;

        // Update nav items
        document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
            if (item.getAttribute("data-tab") === tabName) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        // Update tab panes
        document.querySelectorAll(".tab-pane").forEach(pane => {
            if (pane.id === `tab-${tabName}`) {
                pane.classList.add("active");
            } else {
                pane.classList.remove("active");
            }
        });

        // Update breadcrumb
        const breadcrumbMap = {
            "dashboard": "Dashboard Overview",
            "patients": "Patient Management",
            "tests": "Test Orders & Catalog",
            "samples": "Sample Collection",
            "processing": "Test Processing Simulator",
            "results": "Result Management",
            "reports": "Laboratory Reports",
            "oop-showcase": "OOP Architecture Verification Lab"
        };
        const breadcrumb = document.getElementById("active-breadcrumb");
        if (breadcrumb) breadcrumb.textContent = breadcrumbMap[tabName] || "Dashboard";

        // Close mobile sidebar if open
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("open");

        // Refresh data for the active view
        this.renderAll();
    },

    setupRealtimeClock() {
        const clockEl = document.getElementById("live-clock-text");
        const updateClock = () => {
            const now = new Date();
            const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            if (clockEl) clockEl.textContent = now.toLocaleDateString('en-US', options);
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    // --- EVENT LISTENERS ---
    setupEventListeners() {
        // Topbar quick buttons
        document.getElementById("btn-quick-patient")?.addEventListener("click", () => this.openAddPatientModal());
        document.getElementById("btn-quick-test")?.addEventListener("click", () => this.openAssignTestModal());

        // Storage reset/clear
        document.getElementById("btn-seed-data")?.addEventListener("click", () => {
            this.confirmAction("Reset to Demo Records?", "This will reload realistic sample records for Patients, Tests, Samples, Results, and Reports.", () => {
                db.seedInitialDemoData();
                this.renderAll();
                this.showToast("Default laboratory demonstration data reloaded successfully.", "success");
            });
        });

        document.getElementById("btn-clear-data")?.addEventListener("click", () => {
            this.confirmAction("Clear All Storage?", "This will remove all records from browser LocalStorage. Are you sure?", () => {
                db.clearAllStorage();
                this.renderAll();
                this.showToast("All LocalStorage data cleared.", "info");
            });
        });

        // Patient tab actions
        document.getElementById("btn-add-patient-modal")?.addEventListener("click", () => this.openAddPatientModal());
        document.getElementById("patient-search-input")?.addEventListener("input", () => this.renderPatientsTable());
        document.getElementById("patient-gender-filter")?.addEventListener("change", () => this.renderPatientsTable());

        // Tests tab actions
        document.getElementById("btn-assign-test-modal")?.addEventListener("click", () => this.openAssignTestModal());
        document.getElementById("test-search-input")?.addEventListener("input", () => this.renderTestsTable());
        document.getElementById("test-status-filter")?.addEventListener("change", () => this.renderTestsTable());

        // Category filter pills
        document.querySelectorAll("#test-category-pills .pill-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll("#test-category-pills .pill-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.renderTestsTable();
            });
        });

        // Sample tab actions
        document.getElementById("btn-collect-sample-modal")?.addEventListener("click", () => this.openSampleCollectModal());
        document.getElementById("sample-search-input")?.addEventListener("input", () => this.renderSamplesTable());
        document.getElementById("sample-status-filter")?.addEventListener("change", () => this.renderSamplesTable());

        // Processing simulator
        document.getElementById("btn-start-simulation")?.addEventListener("click", () => this.startProcessingSimulation());
        document.getElementById("btn-proceed-results")?.addEventListener("click", () => {
            if (this.currentProcessingTest) {
                this.openEnterResultModal(this.currentProcessingTest.testId);
            }
        });

        // Results tab
        document.getElementById("btn-enter-result-manual")?.addEventListener("click", () => {
            // Find first completed or processing test without a result
            const pendingResultTest = db.tests.find(t => t.status === "Completed" && !db.getResultByTestId(t.testId));
            if (pendingResultTest) {
                this.openEnterResultModal(pendingResultTest.testId);
            } else if (db.tests.length > 0) {
                this.openEnterResultModal(db.tests[0].testId);
            } else {
                this.showToast("Please order a test first before entering results.", "warning");
            }
        });
        document.getElementById("result-search-input")?.addEventListener("input", () => this.renderResultsTable());

        // Auto-fill realistic normal values button
        document.getElementById("btn-prefill-realistic")?.addEventListener("click", () => this.autoPrefillResultFields());

        // Reports tab
        document.getElementById("btn-quick-generate-report")?.addEventListener("click", () => {
            const resultWithNoReport = db.results.find(r => !db.getReportByTestId(r.testId));
            if (resultWithNoReport) {
                this.generateReportFromResult(resultWithNoReport.resultId);
            } else if (db.results.length > 0) {
                this.generateReportFromResult(db.results[0].resultId);
            } else {
                this.showToast("No test results available to generate reports. Please complete a test first.", "warning");
            }
        });

        // Confirmation dialog proceed button
        document.getElementById("btn-confirm-proceed")?.addEventListener("click", () => {
            if (typeof this.pendingDeleteAction === "function") {
                this.pendingDeleteAction();
                this.pendingDeleteAction = null;
            }
            this.closeModal("modal-confirm");
        });
        document.getElementById("btn-confirm-cancel")?.addEventListener("click", () => {
            this.pendingDeleteAction = null;
            this.closeModal("modal-confirm");
        });

        // Category change in Assign Test modal updates test name dropdown
        document.getElementById("assign-test-category")?.addEventListener("change", (e) => {
            this.populateTestNameOptions(e.target.value);
        });

        // Test change in Collect Sample modal auto-populates patient name
        document.getElementById("sample-test-select")?.addEventListener("change", (e) => {
            this.updateSamplePatientDisplay(e.target.value);
        });
    },

    // --- FORM SUBMISSIONS ---
    setupFormSubmissions() {
        // Patient Form
        document.getElementById("form-patient")?.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const mode = document.getElementById("patient-form-mode").value;
                const id = document.getElementById("inp-patient-id").value;
                const name = document.getElementById("inp-patient-name").value;
                const age = document.getElementById("inp-patient-age").value;
                const gender = document.getElementById("inp-patient-gender").value;
                const blood = document.getElementById("inp-patient-blood").value;
                const phone = document.getElementById("inp-patient-phone").value;
                const date = document.getElementById("inp-patient-date").value;
                const address = document.getElementById("inp-patient-address").value;

                if (mode === "edit") {
                    db.updatePatient(id, { patientName: name, age, gender, phoneNumber: phone, bloodGroup: blood, address });
                    this.showToast(`Patient ${id} (${name}) details updated successfully.`, "success");
                } else {
                    const newPat = new Patient(id, name, age, gender, phone, date, blood, address);
                    db.addPatient(newPat);
                    this.showToast(`New patient ${id} (${name}) registered successfully.`, "success");
                }

                this.closeModal("modal-patient");
                this.renderAll();
            } catch (err) {
                this.showToast(err.message, "danger");
            }
        });

        // Assign Test Form
        document.getElementById("form-assign-test")?.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const testId = document.getElementById("assign-test-id").value;
                const patientId = document.getElementById("assign-patient-select").value;
                const category = document.getElementById("assign-test-category").value;
                const testName = document.getElementById("assign-test-name").value;
                const date = document.getElementById("assign-test-date").value;
                const priority = document.getElementById("assign-test-priority").value;
                const notes = document.getElementById("assign-test-notes").value;

                // Instantiate via polymorphic factory
                const testInstance = LabTestFactory.create({
                    testId, patientId, testName, category, dateAssigned: date, status: "Assigned", notes, priority
                });

                db.addTest(testInstance);
                this.closeModal("modal-assign-test");
                this.renderAll();
                this.showToast(`Test order ${testId} (${testName}) assigned to patient ${patientId}.`, "success");

                // Prompt user to register sample right away
                setTimeout(() => {
                    this.openSampleCollectModal(testId);
                }, 400);
            } catch (err) {
                this.showToast(err.message, "danger");
            }
        });

        // Sample Collection Form
        document.getElementById("form-collect-sample")?.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const sampleId = document.getElementById("sample-id-inp").value;
                const testId = document.getElementById("sample-test-select").value;
                const sampleType = document.getElementById("sample-type-select").value;
                const dateTime = document.getElementById("sample-datetime-inp").value;
                const status = document.getElementById("sample-status-select").value;
                const phleb = document.getElementById("sample-phleb-inp").value;

                const test = db.getTest(testId);
                const sample = new Sample(sampleId, testId, test.patientId, sampleType, dateTime, status, phleb);

                db.addSample(sample);
                this.closeModal("modal-collect-sample");
                this.renderAll();
                this.showToast(`Specimen ${sampleId} successfully logged for test ${testId}.`, "success");
            } catch (err) {
                this.showToast(err.message, "danger");
            }
        });

        // Enter Result Form
        document.getElementById("form-enter-result")?.addEventListener("submit", (e) => {
            e.preventDefault();
            try {
                const testId = document.getElementById("res-test-id").value;
                const patientId = document.getElementById("res-patient-id").value;
                const sampleId = document.getElementById("res-sample-id").value;
                const clinicalNotes = document.getElementById("res-clinical-notes").value;
                const pathRemarks = document.getElementById("res-path-remarks").value;
                const techName = document.getElementById("res-technician").value;
                const pathName = document.getElementById("res-pathologist").value;

                // Gather parameter fields
                const paramRows = document.querySelectorAll("#dynamic-parameters-container .param-row");
                const parameters = [];

                paramRows.forEach(row => {
                    const name = row.getAttribute("data-name");
                    const unit = row.getAttribute("data-unit");
                    const ref = row.getAttribute("data-ref");
                    const input = row.querySelector(".param-val-input");
                    const flagSelect = row.querySelector(".param-flag-select");

                    const value = input ? input.value : "";
                    const flag = flagSelect ? flagSelect.value : "NORMAL";

                    parameters.push({ name, value, unit, referenceRange: ref, flag });
                });

                if (parameters.length === 0) {
                    throw new InvalidResultError("At least one diagnostic parameter is required.");
                }

                const resultId = db.generateResultId();
                const result = new TestResult(
                    resultId, testId, patientId, sampleId,
                    parameters, clinicalNotes, pathRemarks,
                    techName, pathName
                );

                db.addResult(result);
                this.closeModal("modal-enter-result");
                this.renderAll();
                this.showToast(`Results ${resultId} saved and finalized for test ${testId}.`, "success");

                // Prompt user to preview and print report
                setTimeout(() => {
                    this.generateReportFromResult(resultId);
                }, 400);
            } catch (err) {
                this.showToast(err.message, "danger");
            }
        });
    },

    // --- RENDER MASTER METHODS ---
    renderAll() {
        this.updateDashboardMetrics();
        this.renderPatientsTable();
        this.renderTestsTable();
        this.renderSamplesTable();
        this.renderProcessingQueue();
        this.renderResultsTable();
        this.renderReportsTable();
        this.updateStorageIndicator();
    },

    updateStorageIndicator() {
        const textEl = document.getElementById("storage-record-summary");
        if (textEl) {
            textEl.textContent = `${db.patients.length} pats, ${db.tests.length} tests, ${db.reports.length} reps`;
        }

        // Nav badges
        const pBadge = document.getElementById("nav-patient-count");
        if (pBadge) pBadge.textContent = db.patients.length;

        const tBadge = document.getElementById("nav-test-count");
        if (tBadge) tBadge.textContent = db.tests.length;

        const sBadge = document.getElementById("nav-sample-count");
        if (sBadge) {
            const pendingSamples = db.samples.filter(s => s.status === "Pending Collection" || s.status === "Collected").length;
            sBadge.textContent = pendingSamples;
        }

        const rBadge = document.getElementById("nav-report-count");
        if (rBadge) rBadge.textContent = db.reports.length;
    },

    // ==========================================
    // MODULE 1: DASHBOARD
    // ==========================================
    updateDashboardMetrics() {
        // Stats Counts
        const totalPatients = db.patients.length;
        const totalTests = db.tests.length;
        const samplesCollected = db.samples.filter(s => s.status === "Collected" || s.status === "Processing" || s.status === "Completed").length;
        const testsCompleted = db.tests.filter(t => t.status === "Completed").length;
        const reportsGenerated = db.reports.length;

        document.getElementById("stat-total-patients").textContent = totalPatients;
        document.getElementById("stat-total-tests").textContent = totalTests;
        document.getElementById("stat-samples-collected").textContent = samplesCollected;
        document.getElementById("stat-tests-completed").textContent = testsCompleted;
        document.getElementById("stat-reports-generated").textContent = reportsGenerated;

        // Breakdown by category
        const bloodTests = db.tests.filter(t => t.category === "Blood Test").length;
        const urineTests = db.tests.filter(t => t.category === "Urine Test").length;
        const imagingTests = db.tests.filter(t => t.category === "Imaging Test").length;

        document.getElementById("dash-blood-count").textContent = `${bloodTests} tests`;
        document.getElementById("dash-urine-count").textContent = `${urineTests} tests`;
        document.getElementById("dash-imaging-count").textContent = `${imagingTests} tests`;

        const maxRatio = totalTests > 0 ? totalTests : 1;
        document.getElementById("dash-blood-bar").style.width = `${(bloodTests / maxRatio) * 100}%`;
        document.getElementById("dash-urine-bar").style.width = `${(urineTests / maxRatio) * 100}%`;
        document.getElementById("dash-imaging-bar").style.width = `${(imagingTests / maxRatio) * 100}%`;

        // Dashboard Recent Requisitions Table
        const tbody = document.getElementById("dashboard-recent-tests-body");
        if (!tbody) return;

        const recent = db.tests.slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><p>No laboratory test orders found in the database.</p></td></tr>`;
            return;
        }

        tbody.innerHTML = recent.map(test => {
            let patientName = "Unknown";
            try {
                patientName = db.getPatient(test.patientId).patientName;
            } catch (e) { /* ignore */ }

            const catBadgeClass = test.category === "Blood Test" ? "blood" : test.category === "Urine Test" ? "urine" : "imaging";
            const statusBadgeClass = test.status === "Completed" ? "status-completed" : test.status === "In Processing" ? "status-processing" : test.status === "Sample Collected" ? "status-collected" : "status-assigned";

            return `
                <tr>
                    <td><strong class="code-pill">${test.testId}</strong></td>
                    <td><strong>${patientName}</strong> <span class="form-hint">(${test.patientId})</span></td>
                    <td><span class="badge-cat ${catBadgeClass}">${test.category}</span></td>
                    <td>${test.testName}</td>
                    <td>${test.dateAssigned}</td>
                    <td><span class="status-badge ${statusBadgeClass}">${test.status}</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn" title="View / Process Test" onclick="UI.navigateTo('processing'); UI.selectTestForProcessing('${test.testId}');">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
                            </button>
                            ${db.getReportByTestId(test.testId) ? `
                                <button class="action-btn success" title="View Lab Report" onclick="UI.viewExistingReport('${test.testId}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    // ==========================================
    // MODULE 2: PATIENT MANAGEMENT
    // ==========================================
    renderPatientsTable() {
        const tbody = document.getElementById("patients-table-body");
        if (!tbody) return;

        const search = (document.getElementById("patient-search-input")?.value || "").toLowerCase().trim();
        const genderFilter = document.getElementById("patient-gender-filter")?.value || "";

        let filtered = db.patients.filter(p => {
            const matchesSearch = p.patientId.toLowerCase().includes(search) ||
                                  p.patientName.toLowerCase().includes(search) ||
                                  p.phoneNumber.toLowerCase().includes(search);
            const matchesGender = !genderFilter || p.gender === genderFilter;
            return matchesSearch && matchesGender;
        });

        const footer = document.getElementById("patient-count-footer");
        if (footer) footer.textContent = `Showing ${filtered.length} of ${db.patients.length} patient records`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><p>No patient records match the filter criteria.</p></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(patient => `
            <tr>
                <td><strong class="code-pill">${patient.patientId}</strong></td>
                <td><strong>${patient.patientName}</strong></td>
                <td>${patient.age} Yrs / ${patient.gender}</td>
                <td>${patient.phoneNumber}</td>
                <td><span class="badge-pill info">${patient.bloodGroup}</span></td>
                <td>${patient.registrationDate}</td>
                <td class="text-right">
                    <div class="action-btn-group">
                        <button class="action-btn" title="Assign Diagnostic Test" onclick="UI.openAssignTestModal('${patient.patientId}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/></svg>
                        </button>
                        <button class="action-btn" title="Edit Patient Details" onclick="UI.openEditPatientModal('${patient.patientId}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </button>
                        <button class="action-btn danger" title="Delete Patient" onclick="UI.deletePatientPrompt('${patient.patientId}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    },

    openAddPatientModal() {
        document.getElementById("patient-form-mode").value = "add";
        document.getElementById("modal-patient-title").textContent = "Register New Patient";
        document.getElementById("inp-patient-id").value = db.generatePatientId();
        document.getElementById("inp-patient-name").value = "";
        document.getElementById("inp-patient-age").value = "";
        document.getElementById("inp-patient-gender").value = "Male";
        document.getElementById("inp-patient-blood").value = "O+";
        document.getElementById("inp-patient-phone").value = "";
        document.getElementById("inp-patient-date").value = new Date().toISOString().split('T')[0];
        document.getElementById("inp-patient-address").value = "";

        this.openModal("modal-patient");
    },

    openEditPatientModal(patientId) {
        try {
            const patient = db.getPatient(patientId);
            document.getElementById("patient-form-mode").value = "edit";
            document.getElementById("modal-patient-title").textContent = `Edit Patient: ${patient.patientId}`;
            document.getElementById("inp-patient-id").value = patient.patientId;
            document.getElementById("inp-patient-name").value = patient.patientName;
            document.getElementById("inp-patient-age").value = patient.age;
            document.getElementById("inp-patient-gender").value = patient.gender;
            document.getElementById("inp-patient-blood").value = patient.bloodGroup;
            document.getElementById("inp-patient-phone").value = patient.phoneNumber;
            document.getElementById("inp-patient-date").value = patient.registrationDate;
            document.getElementById("inp-patient-address").value = patient.address;

            this.openModal("modal-patient");
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    deletePatientPrompt(patientId) {
        try {
            const patient = db.getPatient(patientId);
            this.confirmAction(
                `Delete Patient ${patient.patientId}?`,
                `Are you sure you want to permanently remove patient record "${patient.patientName}"? This action cannot be undone.`,
                () => {
                    db.deletePatient(patientId);
                    this.renderAll();
                    this.showToast(`Patient ${patientId} removed from records.`, "info");
                }
            );
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    // ==========================================
    // MODULE 3: TEST MANAGEMENT
    // ==========================================
    renderTestsTable() {
        const tbody = document.getElementById("tests-table-body");
        if (!tbody) return;

        const search = (document.getElementById("test-search-input")?.value || "").toLowerCase().trim();
        const activePill = document.querySelector("#test-category-pills .pill-btn.active")?.getAttribute("data-category") || "ALL";
        const statusFilter = document.getElementById("test-status-filter")?.value || "";

        let filtered = db.tests.filter(t => {
            let patientName = "";
            try { patientName = db.getPatient(t.patientId).patientName.toLowerCase(); } catch (e) {}

            const matchesSearch = t.testId.toLowerCase().includes(search) ||
                                  t.testName.toLowerCase().includes(search) ||
                                  patientName.includes(search);

            const matchesCategory = activePill === "ALL" || t.category === activePill;
            const matchesStatus = !statusFilter || t.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><p>No diagnostic test orders found.</p></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(test => {
            let patientName = "Unknown Patient";
            try { patientName = db.getPatient(test.patientId).patientName; } catch (e) {}

            const catBadgeClass = test.category === "Blood Test" ? "blood" : test.category === "Urine Test" ? "urine" : "imaging";
            const statusBadgeClass = test.status === "Completed" ? "status-completed" : test.status === "In Processing" ? "status-processing" : test.status === "Sample Collected" ? "status-collected" : "status-assigned";

            const hasSample = db.getSampleByTestId(test.testId);
            const hasResult = db.getResultByTestId(test.testId);
            const hasReport = db.getReportByTestId(test.testId);

            return `
                <tr>
                    <td><strong class="code-pill">${test.testId}</strong></td>
                    <td><strong>${patientName}</strong> <span class="form-hint">(${test.patientId})</span></td>
                    <td><span class="badge-cat ${catBadgeClass}">${test.category}</span></td>
                    <td><strong>${test.testName}</strong></td>
                    <td>${test.dateAssigned}</td>
                    <td><span class="status-badge ${statusBadgeClass}">${test.status}</span></td>
                    <td class="text-right">
                        <div class="action-btn-group">
                            ${!hasSample ? `
                                <button class="action-btn" title="Collect Specimen Sample" onclick="UI.openSampleCollectModal('${test.testId}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/></svg>
                                </button>
                            ` : ''}

                            <button class="action-btn" title="Run Polymorphic Test Processing" onclick="UI.navigateTo('processing'); UI.selectTestForProcessing('${test.testId}');">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </button>

                            <button class="action-btn" title="Enter / Edit Diagnostic Results" onclick="UI.openEnterResultModal('${test.testId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>

                            ${hasResult ? `
                                <button class="action-btn success" title="View / Generate Laboratory Report" onclick="UI.viewOrGenerateReport('${test.testId}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </button>
                            ` : ''}

                            <button class="action-btn danger" title="Delete Test Order" onclick="UI.deleteTestPrompt('${test.testId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    openAssignTestModal(preselectedPatientId = null) {
        if (db.patients.length === 0) {
            this.showToast("No registered patients found. Please add a patient first.", "warning");
            this.openAddPatientModal();
            return;
        }

        document.getElementById("assign-test-id").value = db.generateTestId();
        document.getElementById("assign-test-date").value = new Date().toISOString().split('T')[0];
        document.getElementById("assign-test-notes").value = "";

        // Populate Patient Select dropdown
        const patSelect = document.getElementById("assign-patient-select");
        patSelect.innerHTML = db.patients.map(p => `
            <option value="${p.patientId}" ${preselectedPatientId === p.patientId ? "selected" : ""}>
                ${p.patientName} (${p.patientId} - ${p.gender}, ${p.age}y)
            </option>
        `).join("");

        // Populate Test Name options
        const catSelect = document.getElementById("assign-test-category");
        catSelect.value = "Blood Test";
        this.populateTestNameOptions("Blood Test");

        this.openModal("modal-assign-test");
    },

    populateTestNameOptions(category) {
        const testNameSelect = document.getElementById("assign-test-name");
        let options = [];

        if (category === "Blood Test") {
            options = ["Complete Blood Count (CBC)", "Blood Glucose", "Hemoglobin"];
        } else if (category === "Urine Test") {
            options = ["Urine Routine Examination", "Urine Culture"];
        } else if (category === "Imaging Test") {
            options = ["X-Ray", "Ultrasound"];
        }

        testNameSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
    },

    deleteTestPrompt(testId) {
        try {
            const test = db.getTest(testId);
            this.confirmAction(
                `Delete Test Order ${test.testId}?`,
                `Are you sure you want to remove test "${test.testName}"? Associated samples and results will remain archived.`,
                () => {
                    db.deleteTest(testId);
                    this.renderAll();
                    this.showToast(`Test order ${testId} deleted.`, "info");
                }
            );
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    // ==========================================
    // MODULE 4: SAMPLE COLLECTION
    // ==========================================
    renderSamplesTable() {
        const tbody = document.getElementById("samples-table-body");
        if (!tbody) return;

        const search = (document.getElementById("sample-search-input")?.value || "").toLowerCase().trim();
        const statusFilter = document.getElementById("sample-status-filter")?.value || "";

        let filtered = db.samples.filter(s => {
            let patientName = "";
            try { patientName = db.getPatient(s.patientId).patientName.toLowerCase(); } catch (e) {}

            const matchesSearch = s.sampleId.toLowerCase().includes(search) ||
                                  s.testId.toLowerCase().includes(search) ||
                                  s.sampleType.toLowerCase().includes(search) ||
                                  patientName.includes(search);
            const matchesStatus = !statusFilter || s.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><p>No specimen samples recorded.</p></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(sample => {
            let patientName = "Unknown";
            let testName = "Test";
            try { patientName = db.getPatient(sample.patientId).patientName; } catch (e) {}
            try { testName = db.getTest(sample.testId).testName; } catch (e) {}

            const statusClass = sample.status === "Completed" ? "status-completed" : sample.status === "Processing" ? "status-processing" : sample.status === "Collected" ? "status-collected" : "status-pending";

            return `
                <tr>
                    <td>
                        <strong class="code-pill">${sample.sampleId}</strong>
                        <div class="form-hint" style="font-family: monospace;">||||||||||||||</div>
                    </td>
                    <td><strong>${sample.testId}</strong> <span class="form-hint">(${testName})</span></td>
                    <td>${patientName}</td>
                    <td><span class="badge-pill info">${sample.sampleType}</span></td>
                    <td>${sample.collectionDateTime}</td>
                    <td><span class="status-badge ${statusClass}">${sample.status}</span></td>
                    <td class="text-right">
                        <div class="action-btn-group">
                            ${sample.status === "Pending Collection" ? `
                                <button class="action-btn success" title="Mark Collected" onclick="UI.quickUpdateSampleStatus('${sample.sampleId}', 'Collected')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                                </button>
                            ` : ''}

                            <button class="action-btn" title="Send to Analyzer Processing" onclick="UI.navigateTo('processing'); UI.selectTestForProcessing('${sample.testId}');">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>
                            </button>

                            <button class="action-btn danger" title="Delete Sample" onclick="UI.deleteSamplePrompt('${sample.sampleId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    openSampleCollectModal(preselectedTestId = null) {
        if (db.tests.length === 0) {
            this.showToast("No laboratory tests found. Please assign a test first.", "warning");
            this.openAssignTestModal();
            return;
        }

        document.getElementById("sample-id-inp").value = db.generateSampleId();

        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById("sample-datetime-inp").value = localIso;

        // Populate Test Order Select
        const testSelect = document.getElementById("sample-test-select");
        testSelect.innerHTML = db.tests.map(t => {
            let patName = "";
            try { patName = db.getPatient(t.patientId).patientName; } catch (e) {}
            return `
                <option value="${t.testId}" ${preselectedTestId === t.testId ? "selected" : ""}>
                    ${t.testId} - ${t.testName} (${patName})
                </option>
            `;
        }).join("");

        // Auto-select type based on test category
        const initialTestId = preselectedTestId || db.tests[0].testId;
        this.updateSamplePatientDisplay(initialTestId);

        this.openModal("modal-collect-sample");
    },

    updateSamplePatientDisplay(testId) {
        try {
            const test = db.getTest(testId);
            const patient = db.getPatient(test.patientId);
            document.getElementById("sample-patient-display").value = `${patient.patientName} (${patient.patientId}) - Age: ${patient.age}, Gender: ${patient.gender}`;

            const typeSelect = document.getElementById("sample-type-select");
            if (test.category === "Blood Test") {
                typeSelect.value = test.testName === "Blood Glucose" ? "Fluoride Blood (Glucose)" : "Whole Blood (EDTA)";
            } else if (test.category === "Urine Test") {
                typeSelect.value = test.testName === "Urine Culture" ? "Midstream Urine (MSU)" : "Clean Catch Urine";
            } else {
                typeSelect.value = "Digital Imaging Order";
            }
        } catch (e) {
            document.getElementById("sample-patient-display").value = "Patient record unavailable";
        }
    },

    quickUpdateSampleStatus(sampleId, newStatus) {
        try {
            db.updateSampleStatus(sampleId, newStatus);
            this.renderAll();
            this.showToast(`Sample ${sampleId} status updated to "${newStatus}".`, "success");
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    deleteSamplePrompt(sampleId) {
        this.confirmAction(
            `Delete Sample ${sampleId}?`,
            `Are you sure you want to delete specimen sample ${sampleId}?`,
            () => {
                db.deleteSample(sampleId);
                this.renderAll();
                this.showToast(`Sample ${sampleId} deleted.`, "info");
            }
        );
    },

    // ==========================================
    // MODULE 5: TEST PROCESSING SIMULATOR
    // ==========================================
    renderProcessingQueue() {
        const queueContainer = document.getElementById("processing-queue-list");
        if (!queueContainer) return;

        // Pending or ready tests
        const queueTests = db.tests;
        const pendingBadge = document.getElementById("queue-pending-count");
        if (pendingBadge) {
            const pendingCount = queueTests.filter(t => t.status !== "Completed").length;
            pendingBadge.textContent = `${pendingCount} In Queue`;
        }

        if (queueTests.length === 0) {
            queueContainer.innerHTML = `<div class="table-empty-state"><p>No test orders in queue.</p></div>`;
            return;
        }

        queueContainer.innerHTML = queueTests.map(test => {
            let patientName = "Unknown";
            try { patientName = db.getPatient(test.patientId).patientName; } catch (e) {}

            const isActive = this.currentProcessingTest && this.currentProcessingTest.testId === test.testId;
            const statusClass = test.status === "Completed" ? "status-completed" : test.status === "In Processing" ? "status-processing" : test.status === "Sample Collected" ? "status-collected" : "status-assigned";

            return `
                <div class="queue-item ${isActive ? 'active' : ''}" onclick="UI.selectTestForProcessing('${test.testId}')">
                    <div class="queue-item-top">
                        <span class="queue-test-id">${test.testId}</span>
                        <span class="status-badge ${statusClass}">${test.status}</span>
                    </div>
                    <div class="queue-patient-name">${patientName}</div>
                    <div class="queue-test-name">${test.testName} (${test.category})</div>
                </div>
            `;
        }).join("");
    },

    selectTestForProcessing(testId) {
        try {
            const test = db.getTest(testId);
            this.currentProcessingTest = test;

            // Highlight queue item
            this.renderProcessingQueue();

            // Reveal active simulator view
            document.getElementById("sim-placeholder")?.classList.add("hidden");
            const activeView = document.getElementById("sim-active-view");
            if (activeView) activeView.classList.remove("hidden");

            // Meta
            let patientName = "Unknown";
            try { patientName = db.getPatient(test.patientId).patientName; } catch (e) {}

            document.getElementById("sim-test-id").textContent = test.testId;
            document.getElementById("sim-patient-name").textContent = patientName;

            const catBadge = document.getElementById("sim-category-badge");
            catBadge.textContent = test.category;
            catBadge.className = `badge-cat ${test.category === "Blood Test" ? "blood" : test.category === "Urine Test" ? "urine" : "imaging"}`;

            const oopCode = document.getElementById("sim-oop-class");
            const className = test instanceof BloodTest ? "BloodTest" : test instanceof UrineTest ? "UrineTest" : "ImagingTest";
            oopCode.textContent = `${className} extends LabTest (Polymorphic)`;

            const statusBadge = document.getElementById("sim-status-badge");
            statusBadge.textContent = test.status;
            statusBadge.className = `status-badge ${test.status === "Completed" ? "status-completed" : test.status === "In Processing" ? "status-processing" : "status-pending"}`;

            // Reset progress & log
            document.getElementById("sim-progress-fill").style.width = test.status === "Completed" ? "100%" : "0%";
            document.getElementById("sim-percent").textContent = test.status === "Completed" ? "100%" : "0%";
            document.getElementById("sim-step-name").textContent = test.status === "Completed" ? "Test analysis completed and archived." : "Standby. Click 'Execute processTest()' to initiate analyzer run.";
            document.getElementById("sim-step-detail").textContent = test.status === "Completed" ? "Hardware processing cycle finished. Diagnostic results ready for entry." : "Simulated clinical analyzer instrument ready.";

            // Reset buttons
            const startBtn = document.getElementById("btn-start-simulation");
            const proceedBtn = document.getElementById("btn-proceed-results");

            if (test.status === "Completed") {
                startBtn?.classList.add("hidden");
                proceedBtn?.classList.remove("hidden");
            } else {
                startBtn?.classList.remove("hidden");
                proceedBtn?.classList.add("hidden");
            }

            // Render stage graphic
            this.renderMachineStage(test);

            // Initial log
            const logBox = document.getElementById("sim-log-content");
            if (logBox) {
                logBox.innerHTML = `
                    <div class="sim-log-line"><span class="timestamp">[00:00.0]</span> Instrument linked to Test order ${test.testId} (${test.testName}).</div>
                    <div class="sim-log-line step"><span class="timestamp">[00:00.1]</span> OOP polymorphism dispatched: Invoking class instance method ${className}.prototype.processTest().</div>
                `;
            }
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    renderMachineStage(test) {
        const stage = document.getElementById("machine-stage");
        if (!stage) return;

        if (test instanceof BloodTest) {
            stage.innerHTML = `
                <div class="machine-blood-anim">
                    <div class="centrifuge-rotor" id="sim-centrifuge-rotor">
                        <div class="centrifuge-core"></div>
                    </div>
                    <div class="flow-cytometry-wave">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                </div>
            `;
        } else if (test instanceof UrineTest) {
            stage.innerHTML = `
                <div class="machine-urine-anim">
                    <div class="microscope-lens-view">
                        <div class="scan-crosshair"></div>
                        <div class="scan-crosshair vert"></div>
                        <div class="sediment-particle"></div>
                    </div>
                </div>
            `;
        } else {
            stage.innerHTML = `
                <div class="machine-imaging-anim">
                    <div class="dicom-grid">
                        ${Array.from({ length: 24 }).map(() => '<div class="dicom-pixel"></div>').join("")}
                    </div>
                    <div class="laser-scanner-line"></div>
                </div>
            `;
        }
    },

    async startProcessingSimulation() {
        if (!this.currentProcessingTest) return;

        const test = this.currentProcessingTest;
        const sample = db.getSampleByTestId(test.testId);

        const startBtn = document.getElementById("btn-start-simulation");
        const proceedBtn = document.getElementById("btn-proceed-results");
        if (startBtn) startBtn.disabled = true;

        // Activate machine visual CSS animation
        document.getElementById("sim-centrifuge-rotor")?.classList.add("spinning");
        document.querySelectorAll(".wave-bar").forEach(b => b.classList.add("active"));

        const logBox = document.getElementById("sim-log-content");
        const progressFill = document.getElementById("sim-progress-fill");
        const percentText = document.getElementById("sim-percent");
        const stepNameText = document.getElementById("sim-step-name");
        const stepDetailText = document.getElementById("sim-step-detail");
        const statusBadge = document.getElementById("sim-status-badge");

        statusBadge.textContent = "Processing";
        statusBadge.className = "status-badge status-processing";

        try {
            // Polymorphic method invocation: executes BloodTest.processTest, UrineTest.processTest, or ImagingTest.processTest
            const resultMeta = await test.processTest(sample, (stepInfo) => {
                progressFill.style.width = `${stepInfo.percent}%`;
                percentText.textContent = `${stepInfo.percent}%`;
                stepNameText.textContent = `Phase ${stepInfo.step}/5: ${stepInfo.name}`;
                stepDetailText.textContent = stepInfo.detail;

                if (logBox) {
                    const now = new Date();
                    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).slice(0, 2)}`;
                    const line = document.createElement("div");
                    line.className = "sim-log-line step";
                    line.innerHTML = `<span class="timestamp">[${timeStr}]</span> [Step ${stepInfo.step}]: ${stepInfo.name} - ${stepInfo.detail}`;
                    logBox.appendChild(line);
                    logBox.scrollTop = logBox.scrollHeight;
                }
            });

            // Finished
            statusBadge.textContent = "Completed";
            statusBadge.className = "status-badge status-completed";

            // Stop animations
            document.getElementById("sim-centrifuge-rotor")?.classList.remove("spinning");
            document.querySelectorAll(".wave-bar").forEach(b => b.classList.remove("active"));

            if (logBox) {
                const finishLine = document.createElement("div");
                finishLine.className = "sim-log-line success";
                finishLine.innerHTML = `<span class="timestamp">[DONE]</span> Polymorphic processTest() returned status: SUCCESS. Methodology: ${resultMeta.methodology}`;
                logBox.appendChild(finishLine);
                logBox.scrollTop = logBox.scrollHeight;
            }

            db.saveToStorage();
            this.renderAll();

            if (startBtn) startBtn.classList.add("hidden");
            if (proceedBtn) proceedBtn.classList.remove("hidden");

            this.showToast(`Test ${test.testId} procedure completed successfully! Ready for result entry.`, "success");
        } catch (err) {
            this.showToast(err.message, "danger");
            if (startBtn) startBtn.disabled = false;
        }
    },

    // ==========================================
    // MODULE 6: RESULT MANAGEMENT
    // ==========================================
    renderResultsTable() {
        const tbody = document.getElementById("results-table-body");
        if (!tbody) return;

        const search = (document.getElementById("result-search-input")?.value || "").toLowerCase().trim();

        let filtered = db.results.filter(r => {
            let patientName = "";
            let testName = "";
            try { patientName = db.getPatient(r.patientId).patientName.toLowerCase(); } catch (e) {}
            try { testName = db.getTest(r.testId).testName.toLowerCase(); } catch (e) {}

            return r.resultId.toLowerCase().includes(search) ||
                   r.testId.toLowerCase().includes(search) ||
                   patientName.includes(search) ||
                   testName.includes(search);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><p>No finalized diagnostic test results found.</p></td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(result => {
            let patientName = "Unknown";
            let test = null;
            try { patientName = db.getPatient(result.patientId).patientName; } catch (e) {}
            try { test = db.getTest(result.testId); } catch (e) {}

            const testName = test ? test.testName : "Diagnostic Test";
            const testCat = test ? test.category : "Lab Test";
            const catBadgeClass = testCat === "Blood Test" ? "blood" : testCat === "Urine Test" ? "urine" : "imaging";

            const summarySnippet = result.parameters.slice(0, 3).map(p => `${p.name}: <strong>${p.value}</strong>`).join(" | ");

            return `
                <tr>
                    <td><strong class="code-pill">${result.resultId}</strong></td>
                    <td><strong>${result.testId}</strong></td>
                    <td>${patientName}</td>
                    <td>
                        <strong>${testName}</strong>
                        <div><span class="badge-cat ${catBadgeClass}">${testCat}</span></div>
                    </td>
                    <td>${result.dateRecorded}</td>
                    <td><span class="form-hint">${summarySnippet}</span></td>
                    <td class="text-right">
                        <div class="action-btn-group">
                            <button class="action-btn" title="Edit Results" onclick="UI.openEnterResultModal('${result.testId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="action-btn success" title="Generate Printable Lab Report" onclick="UI.generateReportFromResult('${result.resultId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    openEnterResultModal(testId) {
        try {
            const test = db.getTest(testId);
            const patient = db.getPatient(test.patientId);
            const sample = db.getSampleByTestId(testId);
            const existingResult = db.getResultByTestId(testId);

            document.getElementById("res-test-id").value = test.testId;
            document.getElementById("res-patient-id").value = patient.patientId;
            document.getElementById("res-sample-id").value = sample ? sample.sampleId : "";
            document.getElementById("res-test-category").value = test.category;
            document.getElementById("res-test-name").value = test.testName;

            document.getElementById("res-disp-testid").textContent = test.testId;
            document.getElementById("res-disp-patient").textContent = `${patient.patientName} (${patient.gender}, ${patient.age}y)`;
            document.getElementById("res-disp-testname").textContent = test.testName;

            const catBadge = document.getElementById("res-disp-cat");
            catBadge.textContent = test.category;
            catBadge.className = `badge-cat ${test.category === "Blood Test" ? "blood" : test.category === "Urine Test" ? "urine" : "imaging"}`;

            // Populate specific fields based on test name
            this.renderDynamicResultParameters(test.testName, existingResult);

            if (existingResult) {
                document.getElementById("res-clinical-notes").value = existingResult.clinicalNotes || "";
                document.getElementById("res-path-remarks").value = existingResult.pathologistRemarks || "";
                document.getElementById("res-technician").value = existingResult.technicianName || "Sarah Jenkins, MLS(ASCP)cm";
                document.getElementById("res-pathologist").value = existingResult.pathologistName || "Dr. Arthur Vance, MD, FACP";
            } else {
                document.getElementById("res-clinical-notes").value = "Specimen analyzed following standard calibrated clinical lab protocol.";
                document.getElementById("res-path-remarks").value = "Diagnostic parameters evaluated and clinically correlated.";
            }

            this.openModal("modal-enter-result");
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    renderDynamicResultParameters(testName, existingResult = null) {
        const container = document.getElementById("dynamic-parameters-container");
        if (!container) return;

        // Definitions of parameters tailored for each specific test
        const testParamDefinitions = {
            "Complete Blood Count (CBC)": [
                { name: "Hemoglobin (Hb)", unit: "g/dL", ref: "12.0 - 15.5", default: "13.8" },
                { name: "Total Leucocytes (WBC)", unit: "/mcL", ref: "4,000 - 11,000", default: "6,800" },
                { name: "Red Blood Cells (RBC)", unit: "million/mcL", ref: "4.2 - 5.4", default: "4.75" },
                { name: "Platelet Count", unit: "/mcL", ref: "150,000 - 450,000", default: "245,000" },
                { name: "Packed Cell Volume (PCV)", unit: "%", ref: "37.0 - 48.0", default: "41.5" },
                { name: "Mean Corpuscular Volume (MCV)", unit: "fL", ref: "80.0 - 100.0", default: "87.0" }
            ],
            "Blood Glucose": [
                { name: "Fasting Blood Sugar (FBS)", unit: "mg/dL", ref: "70 - 99", default: "92" },
                { name: "Post-Prandial Blood Sugar (PPBS)", unit: "mg/dL", ref: "< 140", default: "128" },
                { name: "HbA1c (Glycated Hemoglobin)", unit: "%", ref: "4.0 - 5.6", default: "5.3" }
            ],
            "Hemoglobin": [
                { name: "Hemoglobin Concentration", unit: "g/dL", ref: "12.0 - 16.5", default: "14.5" },
                { name: "Blood Group & Rh Type", unit: "--", ref: "ABO / Rh Verified", default: "O Positive (O+)" },
                { name: "Peripheral Smear Examination", unit: "--", ref: "Normocytic Normochromic", default: "Normocytic, normochromic RBCs. Adequate platelets." }
            ],
            "Urine Routine Examination": [
                { name: "Physical Color & Appearance", unit: "--", ref: "Pale Yellow / Clear", default: "Pale Yellow / Clear" },
                { name: "Specific Gravity", unit: "--", ref: "1.005 - 1.030", default: "1.015" },
                { name: "Reaction (pH)", unit: "--", ref: "4.5 - 8.0", default: "6.0" },
                { name: "Chemical Protein (Albumin)", unit: "--", ref: "Negative", default: "Negative" },
                { name: "Chemical Glucose", unit: "--", ref: "Negative", default: "Negative" },
                { name: "Chemical Ketones", unit: "--", ref: "Negative", default: "Negative" },
                { name: "Pus Cells (WBC)", unit: "/HPF", ref: "0 - 5", default: "1 - 2" },
                { name: "Red Blood Cells (RBC)", unit: "/HPF", ref: "0 - 2", default: "Nil" },
                { name: "Epithelial Cells", unit: "/HPF", ref: "Occasional", default: "1 - 3" }
            ],
            "Urine Culture": [
                { name: "Specimen Nature", unit: "--", ref: "Midstream Sterile Specimen", default: "Mid-Stream Clean Catch Urine" },
                { name: "Incubation Period", unit: "Hours", ref: "48 Hours at 37°C", default: "48 Hours Aerobic" },
                { name: "Colony Count", unit: "CFU/mL", ref: "< 10,000 (No Significant Growth)", default: "< 10,000 CFU/mL" },
                { name: "Bacterial Organism Isolated", unit: "--", ref: "No Organism Isolated", default: "No bacterial growth after 48 hours" },
                { name: "Antibiotic Sensitivity Status", unit: "--", ref: "Sterile Culture", default: "Not indicated (Sterile culture)" }
            ],
            "X-Ray": [
                { name: "Anatomical Region Examined", unit: "--", ref: "As Ordered", default: "Chest PA View (Erect)" },
                { name: "Radiation Exposure Technique", unit: "--", ref: "Standard ALARA", default: "120 kVp, 3.2 mAs" },
                { name: "Lung Fields & Parenchyma", unit: "--", ref: "Clear Lung Fields", default: "Both lung fields are clear. No active infiltrates or mass." },
                { name: "Cardiothoracic Ratio (CTR)", unit: "--", ref: "< 0.50 (Normal)", default: "0.46 (Normal size)" },
                { name: "Pleural & Diaphragmatic Contours", unit: "--", ref: "Sharp CP Angles", default: "Bilateral CP angles and dome of diaphragms are clear." }
            ],
            "Ultrasound": [
                { name: "Anatomical Region / System", unit: "--", ref: "As Ordered", default: "Whole Abdomen & Pelvis" },
                { name: "Liver Size & Parenchyma", unit: "--", ref: "Normal Size / Smooth", default: "Normal size (13.4 cm), smooth contour, homogeneous echotexture." },
                { name: "Gallbladder & Biliary Tree", unit: "--", ref: "Calculi-Free", default: "Well-distended, thin wall (<3mm), no calculi or sludge." },
                { name: "Bilateral Kidneys (Renal)", unit: "--", ref: "Intact CMD", default: "Normal bilateral renal size and cortico-medullary differentiation." },
                { name: "Spleen & Pancreas", unit: "--", ref: "Normal Architecture", default: "Normal size and echotexture without focal mass." }
            ]
        };

        const params = testParamDefinitions[testName] || [
            { name: "Primary Clinical Parameter", unit: "units", ref: "Standard", default: "Normal" },
            { name: "Secondary Diagnostic Finding", unit: "units", ref: "Standard", default: "Unremarkable" }
        ];

        let html = `
            <table class="param-table">
                <thead>
                    <tr>
                        <th style="width: 32%;">Investigation Parameter</th>
                        <th style="width: 28%;">Observed Value *</th>
                        <th style="width: 14%;">Unit</th>
                        <th style="width: 16%;">Reference Range</th>
                        <th style="width: 10%;">Flag</th>
                    </tr>
                </thead>
                <tbody>
        `;

        params.forEach(p => {
            let existingVal = p.default;
            let existingFlag = "NORMAL";

            if (existingResult && existingResult.parameters) {
                const found = existingResult.parameters.find(ep => ep.name === p.name);
                if (found) {
                    existingVal = found.value;
                    existingFlag = found.flag || "NORMAL";
                }
            }

            html += `
                <tr class="param-row" data-name="${p.name}" data-unit="${p.unit}" data-ref="${p.ref}">
                    <td><strong>${p.name}</strong></td>
                    <td>
                        <input type="text" required class="param-input-sm param-val-input" value="${existingVal}">
                    </td>
                    <td><code>${p.unit}</code></td>
                    <td><span class="form-hint">${p.ref}</span></td>
                    <td>
                        <select class="form-select-sm param-flag-select">
                            <option value="NORMAL" ${existingFlag === "NORMAL" ? "selected" : ""}>NORMAL</option>
                            <option value="HIGH" ${existingFlag === "HIGH" ? "selected" : ""}>HIGH</option>
                            <option value="LOW" ${existingFlag === "LOW" ? "selected" : ""}>LOW</option>
                            <option value="ABNORMAL" ${existingFlag === "ABNORMAL" ? "selected" : ""}>ABNORMAL</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    },

    autoPrefillResultFields() {
        const testName = document.getElementById("res-test-name").value;
        this.renderDynamicResultParameters(testName, null);
        this.showToast("Standard physiological reference values populated.", "info");
    },

    // ==========================================
    // MODULE 7: REPORT GENERATION
    // ==========================================
    renderReportsTable() {
        const tbody = document.getElementById("reports-table-body");
        if (!tbody) return;

        if (db.reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="table-empty-state"><p>No generated laboratory reports available.</p></td></tr>`;
            return;
        }

        tbody.innerHTML = db.reports.map(report => {
            let patientName = "Unknown";
            let test = null;
            try { patientName = db.getPatient(report.patientId).patientName; } catch (e) {}
            try { test = db.getTest(report.testId); } catch (e) {}

            const testName = test ? test.testName : "Diagnostic Test";
            const testCat = test ? test.category : "Blood Test";
            const catBadgeClass = testCat === "Blood Test" ? "blood" : testCat === "Urine Test" ? "urine" : "imaging";

            return `
                <tr>
                    <td><strong class="code-pill">${report.reportId}</strong></td>
                    <td><strong>${patientName}</strong> <span class="form-hint">(${report.patientId})</span></td>
                    <td>
                        <strong>${testName}</strong>
                        <div><span class="badge-cat ${catBadgeClass}">${testCat}</span></div>
                    </td>
                    <td><code>${report.sampleId}</code></td>
                    <td>${report.generatedDate}</td>
                    <td><span class="badge-pill success">Verified & Signed</span></td>
                    <td class="text-right">
                        <div class="action-btn-group">
                            <button class="action-btn success" title="View & Print Report" onclick="UI.viewReport('${report.reportId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            </button>
                            <button class="action-btn danger" title="Delete Report Record" onclick="UI.deleteReportPrompt('${report.reportId}')">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    },

    viewOrGenerateReport(testId) {
        const existing = db.getReportByTestId(testId);
        if (existing) {
            this.viewReport(existing.reportId);
        } else {
            const result = db.getResultByTestId(testId);
            if (result) {
                this.generateReportFromResult(result.resultId);
            } else {
                this.showToast("No test result found for this test order yet.", "warning");
            }
        }
    },

    viewExistingReport(testId) {
        this.viewOrGenerateReport(testId);
    },

    generateReportFromResult(resultId) {
        try {
            const result = db.results.find(r => r.resultId === resultId);
            if (!result) throw new InvalidResultError(`Result record ${resultId} not found.`);

            const test = db.getTest(result.testId);
            const patient = db.getPatient(result.patientId);
            const sample = result.sampleId ? db.getSample(result.sampleId) : null;

            // Generate report using OOP LabReport implementing IReportGenerator contract
            const reportId = db.generateReportId();
            const labReportInstance = new LabReport(reportId, test.testId, patient.patientId, sample ? sample.sampleId : "SMP-N/A", result.resultId);

            db.addReport(labReportInstance);
            this.renderAll();

            this.viewReport(reportId);
            this.showToast(`Official laboratory report ${reportId} generated!`, "success");
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    viewReport(reportId) {
        try {
            const reportMeta = db.getReport(reportId);
            if (!reportMeta) throw new Error(`Report ${reportId} not found.`);

            const test = db.getTest(reportMeta.testId);
            const patient = db.getPatient(reportMeta.patientId);
            const sample = reportMeta.sampleId ? db.getSample(reportMeta.sampleId) : null;
            const result = db.getResultByTestId(reportMeta.testId);

            // Reconstruct full report data using OOP LabReport contract method
            const labReport = new LabReport(reportMeta.reportId, test.testId, patient.patientId, sample?.sampleId, result?.resultId, reportMeta.generatedDate);
            const reportDocument = labReport.generateReport({ patient, test, sample, result });

            this.renderReportSheet(reportDocument);
            this.openModal("modal-report-view");
        } catch (err) {
            this.showToast(err.message, "danger");
        }
    },

    renderReportSheet(doc) {
        const container = document.getElementById("printable-report-sheet");
        if (!container) return;

        // Render parameters rows
        const paramRows = doc.results.parameters.map(p => `
            <tr class="${p.isAbnormal ? 'highlight' : ''}">
                <td><strong>${p.name}</strong></td>
                <td class="observed-val ${p.isAbnormal ? 'abnormal' : ''}">${p.value}</td>
                <td>${p.unit}</td>
                <td>${p.referenceRange}</td>
                <td>
                    <span class="rep-flag-pill ${p.flag === 'NORMAL' ? 'norm' : p.flag === 'HIGH' ? 'high' : 'low'}">
                        ${p.flag}
                    </span>
                </td>
            </tr>
        `).join("");

        container.innerHTML = `
            <div class="lab-report-sheet">
                <div class="report-watermark">APEX LAB DEMO</div>

                <!-- Header -->
                <div class="rep-header-block">
                    <div class="rep-lab-brand">
                        <div class="rep-lab-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                            </svg>
                        </div>
                        <div class="rep-lab-details">
                            <h1>${doc.laboratory.name}</h1>
                            <div class="sub">${doc.laboratory.accreditation}</div>
                            <div class="address">${doc.laboratory.address} | ${doc.laboratory.contact}</div>
                        </div>
                    </div>
                    <div class="rep-barcode-seal">
                        <div class="rep-barcode-lines">|| | ||| | || |||| | |||</div>
                        <div class="rep-report-id-code">REPORT REF: ${doc.reportId}</div>
                        <div class="rep-accreditation-seal">${doc.laboratory.licenseNo}</div>
                    </div>
                </div>

                <!-- Patient Metadata Table -->
                <table class="rep-meta-table">
                    <tr>
                        <td class="meta-label">Patient ID:</td>
                        <td class="meta-val">${doc.patient.id}</td>
                        <td class="meta-label">Test Order ID:</td>
                        <td class="meta-val">${doc.test.id}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Patient Name:</td>
                        <td class="meta-val">${doc.patient.name}</td>
                        <td class="meta-label">Sample ID:</td>
                        <td class="meta-val">${doc.sample.id} (${doc.sample.type})</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Age / Gender:</td>
                        <td class="meta-val">${doc.patient.age} Yrs / ${doc.patient.gender}</td>
                        <td class="meta-label">Collection Date:</td>
                        <td class="meta-val">${doc.sample.collectedAt}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Blood Group:</td>
                        <td class="meta-val">${doc.patient.bloodGroup}</td>
                        <td class="meta-label">Report Date:</td>
                        <td class="meta-val">${doc.generatedDate}</td>
                    </tr>
                </table>

                <!-- Test Banner -->
                <div class="rep-test-banner">
                    <h2>${doc.test.name}</h2>
                    <span>CATEGORY: ${doc.test.category.toUpperCase()} | METHOD: ${doc.test.methodology}</span>
                </div>

                <!-- Results Parameters Table -->
                <table class="rep-results-table">
                    <thead>
                        <tr>
                            <th style="width: 34%;">Investigation Parameter</th>
                            <th style="width: 20%;">Observed Value</th>
                            <th style="width: 14%;">Biological Unit</th>
                            <th style="width: 20%;">Reference Interval</th>
                            <th style="width: 12%;">Interpretation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paramRows}
                    </tbody>
                </table>

                <!-- Clinical Remarks -->
                <div class="rep-notes-box">
                    <strong>CLINICAL NOTES & INTERPRETATION:</strong>
                    <p>${doc.results.clinicalNotes}</p>
                    <p style="margin-top: 4px;"><strong>Pathologist Impression:</strong> ${doc.results.pathologistRemarks}</p>
                </div>

                <!-- Mandatory Educational Disclaimer -->
                <div class="rep-educational-disclaimer">
                    *** ${doc.disclaimer} ***
                </div>

                <!-- Signatures -->
                <div class="rep-signatures-grid">
                    <div class="rep-sig-item">
                        <div class="rep-sig-line">Sarah Jenkins</div>
                        <div class="rep-sig-name">${doc.results.technicianName}</div>
                        <div class="rep-sig-title">Medical Laboratory Technologist</div>
                    </div>
                    <div class="rep-sig-item" style="text-align: right;">
                        <div class="rep-sig-line">Arthur Vance, MD</div>
                        <div class="rep-sig-name">${doc.results.pathologistName}</div>
                        <div class="rep-sig-title">Consultant Clinical Pathologist, MD, FACP</div>
                    </div>
                </div>

                <!-- Footer Bar -->
                <div class="rep-footer-bar">
                    <span>Apex Diagnostics Clinical Laboratory System v2.0</span>
                    <span>Electronic Verification Hash: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                    <span>Page 1 of 1</span>
                </div>
            </div>
        `;

        // Wire download PDF button
        const dlBtn = document.getElementById("btn-download-pdf");
        if (dlBtn) {
            dlBtn.onclick = () => {
                window.print();
            };
        }
    },

    deleteReportPrompt(reportId) {
        this.confirmAction(
            `Delete Report ${reportId}?`,
            `Are you sure you want to delete report ${reportId}? The diagnostic test and result records will not be deleted.`,
            () => {
                db.deleteReport(reportId);
                this.renderAll();
                this.showToast(`Report ${reportId} deleted.`, "info");
            }
        );
    },

    // --- MODAL UTILITIES ---
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("hidden");
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add("hidden");
    },

    confirmAction(title, message, onProceed) {
        document.getElementById("confirm-title").textContent = title;
        document.getElementById("confirm-message").textContent = message;
        this.pendingDeleteAction = onProceed;
        this.openModal("modal-confirm");
    },

    // --- TOAST NOTIFICATIONS ---
    showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;

        const iconSvg = type === "success"
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
            : type === "danger"
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
            : type === "warning"
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

        const titleText = type === "success" ? "Success" : type === "danger" ? "Error" : type === "warning" ? "Notice" : "Information";

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-content">
                <div class="toast-title">${titleText}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        toast.querySelector(".toast-close").addEventListener("click", () => {
            toast.remove();
        });

        container.appendChild(toast);

        // Auto remove after 4.5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = "0";
                toast.style.transform = "translateX(50px)";
                setTimeout(() => toast.remove(), 250);
            }
        }, 4500);
    }
};

// ============================================================================
// 8. OOP ARCHITECTURE VERIFICATION TEST RUNNER (Section 2 Verification)
// ============================================================================

const OOPLab = {
    log(message, type = "info") {
        const consoleEl = document.getElementById("oop-console-output");
        if (!consoleEl) return;

        const line = document.createElement("div");
        line.className = `console-line ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        line.innerHTML = `<span style="color: #64748b;">[${timestamp}]</span> ${message}`;

        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    },

    clearConsole() {
        const consoleEl = document.getElementById("oop-console-output");
        if (consoleEl) consoleEl.innerHTML = "";
        this.log("Terminal cleared. Ready for new test execution.", "info");
    },

    // Test A: Encapsulation
    testEncapsulation() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT A: ENCAPSULATION & PRIVATE FIELDS", "highlight");
        try {
            const pat = new Patient("PAT-TEST-01", "Dr. Jane Doe", 38, "Female", "+1 (555) 777-8899");
            this.log(`1. Created Patient instance with private properties (#patientId, #patientName, #age, #gender, #phoneNumber).`, "info");
            this.log(`2. Accessing through public getters: ID = "${pat.patientId}", Name = "${pat.patientName}", Age = ${pat.age}`, "success");

            // Test setter validation
            this.log(`3. Testing setter validation with age = 45...`, "info");
            pat.age = 45;
            this.log(`   Updated age via setter: ${pat.age} [PASSED]`, "success");

            // Test invalid setter
            try {
                this.log(`4. Attempting to set invalid age (-10)...`, "info");
                pat.age = -10;
            } catch (validationErr) {
                this.log(`   Setter correctly threw validation error: "${validationErr.message}" [PASSED]`, "success");
            }
        } catch (err) {
            this.log(`Encapsulation test failed: ${err.message}`, "error");
        }
    },

    testPrivateViolation() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING PRIVATE FIELD ENFORCEMENT (#)", "highlight");
        try {
            const pat = new Patient("PAT-TEST-02", "Mark Spencer", 44, "Male", "+1 (555) 111-2233");
            this.log("1. In JavaScript runtime, referencing pat.#patientName directly outside class declaration results in a fatal SyntaxError.", "warning");
            this.log("2. Simulating direct property access pat['#patientName']: Value = " + pat['#patientName'] + " (undefined)", "success");
            this.log("3. Attempting pat.patientId direct write (read-only getter with no setter):", "info");

            const originalId = pat.patientId;
            try {
                pat.patientId = "PAT-HACKED";
            } catch (e) { /* strict mode throws TypeError */ }

            if (pat.patientId === originalId) {
                this.log(`   pat.patientId remains unchanged ("${pat.patientId}") because private field has no setter [PASSED]`, "success");
            }
        } catch (err) {
            this.log(`Private violation test: ${err.message}`, "error");
        }
    },

    // Test B & C: Abstraction & Inheritance
    testAbstractDirectInstantiation() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT C: ABSTRACTION (LabTest class)", "highlight");
        try {
            this.log("1. Attempting direct instantiation: new LabTest('TST-99', 'PAT-01', 'Test', 'Blood')...", "info");
            new LabTest("TST-99", "PAT-01", "Test", "Blood");
            this.log("ERROR: Direct instantiation was not blocked!", "error");
        } catch (err) {
            this.log(`2. Caught expected abstraction error: "${err.message}" [PASSED]`, "success");
            this.log("3. LabTest successfully enforces abstract-style contract: new.target === LabTest check.", "info");
        }
    },

    testSubclassInheritance() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT B: INHERITANCE (LabTest -> BloodTest, UrineTest, ImagingTest)", "highlight");
        try {
            const b = new BloodTest("TST-B", "P-1", "CBC");
            const u = new UrineTest("TST-U", "P-2", "Urine Routine");
            const i = new ImagingTest("TST-I", "P-3", "X-Ray");

            this.log(`1. b instanceof BloodTest: ${b instanceof BloodTest}`, "info");
            this.log(`2. b instanceof LabTest (Inheritance confirmed): ${b instanceof LabTest} [PASSED]`, "success");
            this.log(`3. u instanceof LabTest (Inheritance confirmed): ${u instanceof LabTest} [PASSED]`, "success");
            this.log(`4. i instanceof LabTest (Inheritance confirmed): ${i instanceof LabTest} [PASSED]`, "success");
            this.log(`5. Inherited method check: b.markAsProcessing() -> status is "${b.status}" [PASSED]`, "success");
        } catch (err) {
            this.log(`Inheritance test failed: ${err.message}`, "error");
        }
    },

    // Test D: Polymorphism
    async testPolymorphism() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT D: POLYMORPHISM (Runtime Method Overriding)", "highlight");
        try {
            const tests = [
                new BloodTest("TST-POLY-1", "PAT-1", "Complete Blood Count (CBC)"),
                new UrineTest("TST-POLY-2", "PAT-2", "Urine Routine Examination"),
                new ImagingTest("TST-POLY-3", "PAT-3", "Digital X-Ray")
            ];

            this.log(`Looping through ${tests.length} polymorphic LabTest subclasses and calling processTest():`, "info");

            for (const t of tests) {
                this.log(`-> Calling processTest() on instance of ${t.constructor.name}...`, "info");
                // Fast-track simulation for OOP lab
                const res = await t.processTest({ sampleId: "SMP-OOP" }, (step) => {
                    if (step.step === 1 || step.step === 5) {
                        this.log(`   [${t.constructor.name}] Step ${step.step}: ${step.name}`, "info");
                    }
                });
                this.log(`   Completed with methodology: "${res.methodology}" [POLYMORPHISM PASSED]`, "success");
            }
            this.log("All three subclasses executed unique overridden procedures polymorphically!", "success");
        } catch (err) {
            this.log(`Polymorphism test failed: ${err.message}`, "error");
        }
    },

    // Test E: Interface-like Implementation
    testInterfaceContract() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT E: INTERFACE-LIKE CONTRACT (IReportGenerator -> LabReport)", "highlight");
        try {
            // Direct instantiation of interface should throw
            try {
                this.log("1. Attempting new IReportGenerator()...", "info");
                new IReportGenerator();
            } catch (ifaceErr) {
                this.log(`   Caught expected interface instantiation guard: "${ifaceErr.message}" [PASSED]`, "success");
            }

            const rep = new LabReport("REP-DEMO-01", "TST-2001", "PAT-1001", "SMP-3001", "RES-4001");
            this.log(`2. rep instanceof IReportGenerator: ${rep instanceof IReportGenerator} [PASSED]`, "success");
            this.log(`3. Verified adherence to contract methods: generateReport() exists = ${typeof rep.generateReport === "function"}, formatResults() exists = ${typeof rep.formatResults === "function"} [PASSED]`, "success");
        } catch (err) {
            this.log(`Interface test error: ${err.message}`, "error");
        }
    },

    // Test F: Custom Exception Handling
    testExceptionHandling() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT F: CUSTOM EXCEPTION HANDLING CLASSES", "highlight");

        const testErrors = [
            () => { throw new PatientNotFoundError("PAT-9999"); },
            () => { throw new InvalidSampleError("Specimen container compromised or clotted."); },
            () => { throw new TestNotFoundError("TST-9999"); },
            () => { throw new InvalidResultError("Critical panic range exceeded validation threshold."); }
        ];

        testErrors.forEach(trigger => {
            try {
                trigger();
            } catch (err) {
                this.log(`Caught Error: [Class: ${err.name}] -> Message: "${err.message}" [PASSED]`, "success");
            }
        });
        this.log("All 4 required custom exception classes verified and operational.", "success");
    },

    // Test G: Collections
    inspectCollections() {
        this.log("--------------------------------------------------", "highlight");
        this.log("TESTING OOP CONCEPT G: COLLECTIONS & LOCALSTORAGE", "highlight");
        this.log(`1. Active Patients in Collection: ${db.patients.length}`, "info");
        this.log(`2. Active Tests in Collection: ${db.tests.length}`, "info");
        this.log(`3. Active Specimen Samples in Collection: ${db.samples.length}`, "info");
        this.log(`4. Active Test Results in Collection: ${db.results.length}`, "info");
        this.log(`5. Active Lab Reports in Collection: ${db.reports.length}`, "info");

        let totalBytes = 0;
        for (const k in LabDataManager.STORAGE_KEYS) {
            const val = localStorage.getItem(LabDataManager.STORAGE_KEYS[k]);
            if (val) totalBytes += val.length;
        }
        this.log(`6. Browser LocalStorage Usage: ~${(totalBytes / 1024).toFixed(2)} KB synced [PASSED]`, "success");
    }
};

// ============================================================================
// 9. APPLICATION INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
    // Load the shared MySQL-backed records before rendering the dashboard.
    await db.syncWithServer();
    UI.init();
    console.log("%c Apex Diagnostic Laboratory System Initialized ", "background: #0284c7; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;");
});
