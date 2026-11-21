# Diagnostic Laboratory Management System

Java 17 + Spring Boot application with a browser frontend and JSON-file persistence.

## Technology
- Java 17, Spring Boot 3.4.5, Maven
- HTML, CSS and vanilla JavaScript frontend served from `src/main/resources/static`
- JSON file storage for patients, tests, samples, results and reports
- OOP demonstration: inheritance, polymorphism and encapsulation in `oop` package

## Run locally
1. Install JDK 17 and Maven 3.9+.
2. From the folder containing `pom.xml`, run `mvn spring-boot:run`.
3. Open `http://localhost:8080`.
4. Health check: `http://localhost:8080/api/health`.

The application creates `./data/lab-state.json` automatically when state is first saved. To choose another path, set `LAB_DATA_FILE` (or Spring property `lab.storage.file`).

## Build
`mvn clean package`

The generated jar is in `target/`. Docker builds are supported by `Dockerfile` and `Dockerfile.vercel`.

## API
- `GET /api/health` - health check
- `GET /api/state` - read saved application state
- `PUT /api/state` - save application state as JSON. The `patients`, `tests`, `samples`, `results`, and `reports` fields, when present, must be arrays.
- `POST /api/lab-tests/process` - demonstrates test processing with the OOP classes.

## GitHub upload
Extract this ZIP. Upload the *contents* of the `diagnostic-lab-spring` folder into the repository root, keeping the `src` directory intact. The root should contain `pom.xml`, `Dockerfile`, `Dockerfile.vercel`, `vercel.json`, and `src/`. Do not upload individual Java files into the repository root.

## Vercel and file-storage limitation — read before deploying
This version does **not** require MySQL or any database credentials. It uses a JSON file on the application's local filesystem. This is appropriate for local development and a single-instance demonstration.

However, Vercel server/container filesystems are not a durable shared file store. Files written at runtime can be lost when an instance is replaced/restarted and may not be visible to other instances. Therefore, choosing file storage means you cannot rely on patient/test records being permanently saved and synchronized across all devices on Vercel. For reliable multi-device persistence, a durable shared database or object-storage service is required.

No MySQL environment variables are needed in this file-based version. The only runtime setting is optional `LAB_DATA_FILE`; normally leave it unset.

## Academic demonstration note
The JSON file is a simple coursework/demo persistence mechanism, not suitable for real patient medical records or production clinical use.
