// Copyright 2024 AI Fabric FZ-LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/aifabric/infra-ecosystem/apps/APP_02_Identity_AuthService/internal/agent"
	"github.com/aifabric/infra-ecosystem/apps/APP_02_Identity_AuthService/internal/api"
	"github.com/aifabric/infra-ecosystem/apps/APP_02_Identity_AuthService/internal/config"
	"github.com/aifabric/infra-ecosystem/apps/APP_02_Identity_AuthService/internal/data"
	"github.com/aifabric/infra-ecosystem/apps/APP_02_Identity_AuthService/internal/service"
	"github.com/aifabric/infra-ecosystem/sdks/go/core"
	"github.com/aifabric/infra-ecosystem/sdks/go/observability"
)

const (
	serviceName    = "APP_02_Identity_AuthService"
	shutdownTimeout = 15 * time.Second
)

func main() {
	// Initialize structured logger first.
	logger := observability.NewLogger(os.Stdout, serviceName, os.Getenv("LOG_LEVEL"))
	logger.Info("Starting service initialization")

	// Load configuration from environment variables and/or config files.
	cfg, err := config.Load()
	if err != nil {
		logger.Error("Failed to load configuration", slog.Any("error", err))
		os.Exit(1)
	}
	logger.Info("Configuration loaded successfully")

	// Initialize the Core SDK, which provides access to shared ecosystem components
	// like the event bus, service discovery, and distributed tracing.
	sdkCtx, sdkCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer sdkCancel()

	coreSDK, err := core.NewClient(sdkCtx, serviceName, cfg.CoreSDK)
	if err != nil {
		logger.Error("Failed to initialize Core SDK", slog.Any("error", err))
		os.Exit(1)
	}
	defer coreSDK.Close()
	logger.Info("Core SDK initialized")

	// Establish a connection to the identity database.
	dbCtx, dbCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer dbCancel()

	dbPool, err := data.ConnectDB(dbCtx, cfg.Database)
	if err != nil {
		logger.Error("Failed to connect to the database", slog.Any("error", err))
		os.Exit(1)
	}
	defer dbPool.Close()
	logger.Info("Database connection pool established")

	// Perform a simple health check on the database connection.
	if err := dbPool.Ping(dbCtx); err != nil {
		logger.Error("Database ping failed", slog.Any("error", err))
		os.Exit(1)
	}
	logger.Info("Database connection verified")

	// --- Dependency Injection ---
	// Instantiate components, wiring them together from the data layer up to the API layer.

	// Data Layer: Repositories for database interaction.
	userRepo := data.NewPostgresUserRepository(dbPool)
	apiKeyRepo := data.NewPostgresAPIKeyRepository(dbPool)
	orgRepo := data.NewPostgresOrganizationRepository(dbPool)
	policyRepo := data.NewPostgresPolicyRepository(dbPool)

	// Service Layer: Business logic components.
	tokenService, err := service.NewTokenService(cfg.JWT)
	if err != nil {
		logger.Error("Failed to initialize token service", slog.Any("error", err))
		os.Exit(1)
	}

	authService := service.NewAuthService(
		userRepo,
		apiKeyRepo,
		orgRepo,
		policyRepo,
		tokenService,
		coreSDK.EventBus(),
		logger,
	)

	// API Layer: Handlers that orchestrate service calls.
	apiHandlers := api.NewHandlers(authService, logger)

	// Agent Layer: Handlers for self-introspection endpoints.
	agentHandlers := agent.NewHandlers(serviceName, cfg.Version)

	// Router: Defines API routes and wires them to handlers and middleware.
	router := api.NewRouter(apiHandlers, agentHandlers, logger, coreSDK.Tracer())

	// --- HTTP Server Setup ---
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
		ErrorLog:     slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	// --- Graceful Shutdown and Server Start ---
	// Create a channel to listen for OS signals.
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, syscall.SIGINT, syscall.SIGTERM)

	// Create a channel to receive errors from the server goroutine.
	serverErrors := make(chan error, 1)

	// Start the server in a separate goroutine.
	go func() {
		logger.Info("HTTP server starting", slog.String("address", server.Addr))
		serverErrors <- server.ListenAndServe()
	}()

	// Block until a signal is received or the server exits unexpectedly.
	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("Server error", slog.Any("error", err))
			os.Exit(1)
		}
	case sig := <-shutdownChan:
		logger.Info("Shutdown signal received", slog.String("signal", sig.String()))

		// Create a context with a timeout for the graceful shutdown.
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()

		// Attempt to gracefully shut down the server.
		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("Graceful shutdown failed", slog.Any("error", err))
			// Force close if graceful shutdown fails.
			if err := server.Close(); err != nil {
				logger.Error("Failed to close server forcefully", slog.Any("error", err))
			}
		} else {
			logger.Info("HTTP server shut down gracefully")
		}
	}

	logger.Info("Service has been shut down")
}