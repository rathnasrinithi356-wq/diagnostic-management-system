package com.apex.diagnostics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** Stores the complete laboratory application state in a JSON file.
 * Suitable for local coursework/demo use; cloud container filesystems may be ephemeral.
 */
@Service
public class LabStateService {
    private final ObjectMapper objectMapper;
    private final Path dataFile;

    public LabStateService(ObjectMapper objectMapper,
            @Value("${lab.storage.file:./data/lab-state.json}") String fileName) {
        this.objectMapper = objectMapper;
        this.dataFile = Path.of(fileName).toAbsolutePath().normalize();
    }

    public synchronized Map<String, Object> getState() {
        if (!Files.exists(dataFile)) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(dataFile.toFile(), new TypeReference<Map<String, Object>>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to read saved laboratory data file: " + dataFile, ex);
        }
    }

    public synchronized Map<String, Object> saveState(Map<String, Object> state) {
        validateState(state);
        try {
            Path parent = dataFile.getParent();
            if (parent != null) Files.createDirectories(parent);
            Path tempFile = dataFile.resolveSibling(dataFile.getFileName() + ".tmp");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(tempFile.toFile(), state);
            try {
                Files.move(tempFile, dataFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(tempFile, dataFile, StandardCopyOption.REPLACE_EXISTING);
            }
            return Map.of("saved", true, "updatedAt", Instant.now().toString(), "storage", "json-file");
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to save laboratory data file: " + dataFile, ex);
        }
    }

    private void validateState(Map<String, Object> state) {
        if (state == null) throw new IllegalArgumentException("Request body is required.");
        for (String key : new String[]{"patients", "tests", "samples", "results", "reports"}) {
            Object value = state.get(key);
            if (value != null && !(value instanceof java.util.List<?>)) {
                throw new IllegalArgumentException("Field '" + key + "' must be an array.");
            }
        }
    }
}
