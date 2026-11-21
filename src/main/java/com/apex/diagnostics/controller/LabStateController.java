package com.apex.diagnostics.controller;

import com.apex.diagnostics.service.LabStateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LabStateController {
    private final LabStateService service;
    public LabStateController(LabStateService service) { this.service = service; }

    @GetMapping("/state")
    public Map<String, Object> getState() { return service.getState(); }

    @PutMapping("/state")
    public Map<String, Object> saveState(@RequestBody Map<String, Object> state) { return service.saveState(state); }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "application", "Apex Diagnostic Laboratory Management System");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
