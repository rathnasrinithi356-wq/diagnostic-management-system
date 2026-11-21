package com.apex.diagnostics.oop.controller;

import com.apex.diagnostics.oop.dto.LabTestProcessRequest;
import com.apex.diagnostics.oop.dto.LabTestProcessResponse;
import com.apex.diagnostics.oop.service.LabTestProcessingService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lab-tests")
public class LabTestController {
    private final LabTestProcessingService service;

    public LabTestController(LabTestProcessingService service) {
        this.service = service;
    }

    @PostMapping("/process")
    public LabTestProcessResponse process(@RequestBody LabTestProcessRequest request) {
        return service.process(request);
    }
}
