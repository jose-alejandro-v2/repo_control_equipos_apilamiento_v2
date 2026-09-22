FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre
ENV TZ=America/Lima
WORKDIR /app
COPY --from=build /build/target/quarkus-app/ ./quarkus-app/
EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=America/Lima", "-jar", "quarkus-app/quarkus-run.jar"]
