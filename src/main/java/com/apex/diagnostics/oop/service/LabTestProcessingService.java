package com.apex.diagnostics.oop.service;

import com.apex.diagnostics.oop.dto.LabTestProcessRequest;
import com.apex.diagnostics.oop.dto.LabTestProcessResponse;
import com.apex.diagnostics.oop.model.LabTest;
import org.springframework.stereotype.Service;

@Service
public class LabTestProcessingService {
    private final LabTestFactory factory;

    public LabTestProcessingService(LabTestFactory factory) {
        this.factory = factory;
    }

    public LabTestProcessResponse process(LabTestProcessRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        // One base-class reference can hold either child object. The overridden method
        // selected at runtime demonstrates polymorphism.
        LabTest test = factory.create(request.testType(), request.patientName(), request.sampleId());
        return new LabTestProcessResponse(
                test.getTestType(),
                test.getPatientName(),
                test.getSampleId(),
                test.getProcessingProcedure(),
                "Inheritance, polymorphism and encapsulation"
        );
    }
}
