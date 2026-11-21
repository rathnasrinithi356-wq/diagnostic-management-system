package com.apex.diagnostics.oop.model;

/**
 * Base class for laboratory tests.
 * OOP concepts: encapsulation (private fields) and inheritance (specialized tests extend this class).
 */
public abstract class LabTest {
    private final String patientName;
    private final String sampleId;

    protected LabTest(String patientName, String sampleId) {
        if (patientName == null || patientName.isBlank()) {
            throw new IllegalArgumentException("Patient name is required.");
        }
        if (sampleId == null || sampleId.isBlank()) {
            throw new IllegalArgumentException("Sample ID is required.");
        }
        this.patientName = patientName.trim();
        this.sampleId = sampleId.trim();
    }

    public String getPatientName() {
        return patientName;
    }

    public String getSampleId() {
        return sampleId;
    }

    public abstract String getTestType();

    /** Each child class supplies its own processing procedure (runtime polymorphism). */
    public abstract String getProcessingProcedure();
}
