# Stage 1: Build the application
# Use the official Golang Alpine image for a small build environment.
# Pinning the version ensures reproducible builds.
FROM golang:1.22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Set necessary environment variables for the build
# CGO_ENABLED=0 is crucial for creating a static binary that can run in distroless
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64

# Add labels for metadata
LABEL stage=builder

# Copy go.mod and go.sum files to leverage Docker's layer caching.
# This step will only be re-run if these files change.
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire source code into the container
COPY . .

# Build the Go application.
# -ldflags="-w -s" strips debugging information, reducing the binary size.
# The output is a single, statically-linked binary named 'auth-service'.
RUN go build -ldflags="-w -s" -o /auth-service ./cmd/authservice

# ---

# Stage 2: Create the final, minimal production image
# Use a distroless static image for a minimal attack surface.
# It contains only the application and its runtime dependencies.
FROM gcr.io/distroless/static-debian12 AS final

# Set the working directory
WORKDIR /

# Add OCI-compliant labels for image metadata
LABEL org.opencontainers.image.title="APP_02_Identity_AuthService"
LABEL org.opencontainers.image.description="Centralized Authentication and Identity Service for the AI Ecosystem."
# A placeholder for the source repository URL
LABEL org.opencontainers.image.source="https://github.com/your-org/your-repo"
# A placeholder for the version, which should be injected during CI/CD
LABEL org.opencontainers.image.version="0.1.0"

# Copy the compiled binary from the builder stage
COPY --from=builder /auth-service /auth-service

# Copy the configuration files.
# It's good practice to mount configuration at runtime, but including a default
# allows the container to run out-of-the-box.
COPY --from=builder /app/configs /configs

# Use a non-root user for security. The distroless image provides a 'nonroot' user.
# UID 65532, GID 65532
USER nonroot:nonroot

# Expose the port the application will listen on.
# This is documentation for the user; it doesn't actually publish the port.
# 8080 for the main API (e.g., REST/OAuth2)
# 9090 for internal services (e.g., gRPC, metrics)
EXPOSE 8080
EXPOSE 9090

# Healthcheck to ensure the service is running correctly.
# This assumes the binary has a 'health' subcommand that performs a self-check
# and exits with 0 on success. This is more reliable in a distroless container
# than using curl/wget.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/auth-service", "health"]

# Set the entrypoint for the container
ENTRYPOINT ["/auth-service"]

# Default command to run the service.
# This can be overridden when running the container.
# It points to the production configuration file by default.
CMD ["run", "--config", "/configs/config.production.yml"]