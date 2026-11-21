package com.apex.diagnostics.oop.model;

/** Urine test is another specialized LabTest (inheritance). */
public class UrineTest extends LabTest {
    public UrineTest(String patientName, String sampleId) {
        super(patientName, sampleId);
    }

    @Override
    public String getTestType() {
        return "Urine Test";
    }

    @Override
    public String getProcessingProcedure() {
        return "Check container and sample condition, mix the specimen, perform reagent-strip analysis, and complete microscopy when requested.";
    }
}
