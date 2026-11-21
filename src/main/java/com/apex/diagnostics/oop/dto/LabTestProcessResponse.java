package com.apex.diagnostics.oop.dto;

public record LabTestProcessResponse(
        String testType,
        String patientName,
        String sampleId,
        String processingProcedure,
        String oopConcepts
) { }
