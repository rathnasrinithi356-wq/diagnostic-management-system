package com.apex.diagnostics.oop.model;

/** Blood test is a specialized LabTest (inheritance). */
public class BloodTest extends LabTest {
    public BloodTest(String patientName, String sampleId) {
        super(patientName, sampleId);
    }

    @Override
    public String getTestType() {
        return "Blood Test";
    }

    @Override
    public String getProcessingProcedure() {
        return "Verify patient details, label the blood tube, centrifuge when required, and analyse the serum/plasma using the selected analyser.";
    }
}
