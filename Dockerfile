# Build the Spring Boot application
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests clean package

# Run the packaged application on a small Java 17 runtime
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/target/diagnostic-laboratory-management-1.0.0.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
