package com.apex.diagnostics.oop.service;

import com.apex.diagnostics.oop.model.BloodTest;
import com.apex.diagnostics.oop.model.LabTest;
import com.apex.diagnostics.oop.model.UrineTest;
import org.springframework.stereotype.Component;

@Component
public class LabTestFactory {
    public LabTest create(String testType, String patientName, String sampleId) {
        if (testType == null || testType.isBlank()) {
            throw new IllegalArgumentException("Test type is required.");
        }
        return switch (testType.trim().toLowerCase()) {
            case "blood", "blood test" -> new BloodTest(patientName, sampleId);
            case "urine", "urine test" -> new UrineTest(patientName, sampleId);
            default -> throw new IllegalArgumentException("Unsupported test type. Choose Blood Test or Urine Test.");
        };
    }
}
