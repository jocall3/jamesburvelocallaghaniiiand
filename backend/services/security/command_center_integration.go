package security

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloud.google.com/go/securitycenter/apiv1"
	"cloud.google.com/go/securitycenter/apiv1/securitycenterpb"
	"google.golang.org/api/iterator"
	"google.golang.org/protobuf/types/known/timestamppb" // Used for finding.GetEventTime().AsTime() indirectly
)

// AlertHandler is a function type that processes a Google Security Command Center finding.
// Implementations should handle the context for cancellation and potential errors during processing.
type AlertHandler func(ctx context.Context, finding *securitycenterpb.Finding) error

// SCCIntegrationService provides methods to interact with Google Security Command Center,
// specifically for polling real-time infrastructure alerts.
type SCCIntegrationService struct {
	client          *securitycenter.Client
	organizationID  string // Full resource name, e.g., "organizations/1234567890"
	pollingInterval time.Duration
	lastPollTime    time.Time // Tracks the event_time of the latest finding processed
	alertHandler    AlertHandler
}

// NewSCCIntegrationService creates and initializes a new SCCIntegrationService.
//
// organizationID must be the full resource name of the Google Cloud organization
// to monitor, in the format "organizations/{organization_id}".
//
// interval specifies how often the service will poll SCC for new findings.
// It must be a positive duration.
//
// handler is the function to be called for each new or updated finding. If nil,
// a DefaultAlertHandler that logs the finding details will be used.
//
// The context (`ctx`) is used for creating the SCC client and should typically
// be a long-lived context (e.g., context.Background() or a root context for the application).
func NewSCCIntegrationService(ctx context.Context, organizationID string, interval time.Duration, handler AlertHandler) (*SCCIntegrationService, error) {
	if organizationID == "" {
		return nil, fmt.Errorf("organizationID cannot be empty")
	}
	if interval <= 0 {
		return nil, fmt.Errorf("polling interval must be positive")
	}
	if handler == nil {
		handler = DefaultAlertHandler // Use a default logging handler if none is provided
	}

	client, err := securitycenter.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create Security Command Center client: %w", err)
	}

	svc := &SCCIntegrationService{
		client:          client,
		organizationID:  organizationID,
		pollingInterval: interval,
		// Initialize lastPollTime to a reasonable past value to catch recent findings on startup.
		// In a production system, this value should ideally be persisted (e.g., in a database)
		// to ensure no findings are missed across service restarts.
		lastPollTime: time.Now().Add(-24 * time.Hour), // Start by fetching findings from the last 24 hours
		alertHandler:    handler,
	}

	log.Printf("Security Command Center integration service initialized for organization %s with polling interval %s", organizationID, interval)
	return svc, nil
}

// Close closes the underlying Security Command Center client, releasing its resources.
// It should be called when the service is no longer needed to prevent resource leaks.
func (s *SCCIntegrationService) Close() error {
	if s.client != nil {
		log.Println("Closing Security Command Center client.")
		return s.client.Close()
	}
	return nil
}

// PollForAlerts starts a goroutine that periodically polls Google Security Command Center
// for new or updated findings. The polling continues until the provided context is cancelled.
//
// This function is blocking and designed to be run in its own goroutine (e.g., `go svc.PollForAlerts(ctx)`).
// The `ctx` parameter allows for graceful shutdown of the polling loop.
func (s *SCCIntegrationService) PollForAlerts(ctx context.Context) {
	ticker := time.NewTicker(s.pollingInterval)
	defer ticker.Stop()

	log.Println("Starting SCC alert polling goroutine...")

	// Perform an initial poll immediately upon startup
	s.fetchAndProcessFindings(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping SCC alert polling due to context cancellation.")
			return
		case <-ticker.C:
			s.fetchAndProcessFindings(ctx)
		}
	}
}

// fetchAndProcessFindings fetches findings from SCC based on the configured criteria
// and processes them using the service's alertHandler.
func (s *SCCIntegrationService) fetchAndProcessFindings(ctx context.Context) {
	log.Printf("Polling SCC for findings with event_time > %s...", s.lastPollTime.Format(time.RFC3339))

	// The parent specifies the scope for listing findings.
	// "organizations/{organization_id}/sources/-" lists findings across all sources within an organization.
	// For project-specific findings, use "projects/{project_id}/sources/-".
	parent := fmt.Sprintf("%s/sources/-", s.organizationID)

	// Filter for active findings whose event_time (when the security event occurred)
	// is strictly after the last successfully processed finding's event_time.
	// RFC3339Nano provides sufficient precision for the filter string.
	filter := fmt.Sprintf("state=\"ACTIVE\" AND event_time > \"%s\"", s.lastPollTime.Format(time.RFC3339Nano))

	req := &securitycenterpb.ListFindingsRequest{
		Parent:   parent,
		Filter:   filter,
		OrderBy:  "event_time desc", // Order by newest events first to easily find the latest event_time
		PageSize: 1000,              // Use the maximum page size to reduce API call overhead
	}

	it := s.client.ListFindings(ctx, req)
	var processedCount int
	var latestEventTime = s.lastPollTime // Keep track of the actual latest event_time seen in this batch

	for {
		resp, err := it.Next()
		if err == iterator.Done {
			break // No more findings to process for this request
		}
		if err != nil {
			log.Printf("Error listing Security Command Center findings: %v", err)
			return // Exit this polling cycle; will retry on the next ticker interval
		}

		finding := resp.GetFinding()
		if finding == nil {
			log.Println("Received a nil finding from SCC, skipping.")
			continue
		}

		processedCount++

		// Update latestEventTime if this finding's event time is newer than anything seen so far in this batch.
		if finding.GetEventTime() != nil {
			eventTime := finding.GetEventTime().AsTime()
			if eventTime.After(latestEventTime) {
				latestEventTime = eventTime
			}
		}

		// Process the finding using the provided alert handler
		if err := s.alertHandler(ctx, finding); err != nil {
			log.Printf("Error processing finding '%s' (%s): %v", finding.GetDisplayName(), finding.GetName(), err)
		}
	}

	// Update the service's lastPollTime.
	// If new findings were processed, update `lastPollTime` to the `event_time` of the latest finding found.
	// If no new findings were found but the API call was successful, advance `lastPollTime` to `time.Now()`
	// to ensure the query window keeps moving forward, preventing the filter from becoming too stale.
	if processedCount > 0 {
		s.lastPollTime = latestEventTime
	} else {
		s.lastPollTime = time.Now()
	}

	log.Printf("Finished polling. Processed %d findings. Next poll will look for findings after %s.",
		processedCount, s.lastPollTime.Format(time.RFC3339))
}

// DefaultAlertHandler is a simple implementation of AlertHandler that logs the
// essential details of a Security Command Center finding to the console.
//
// In a production environment, this function would typically integrate with
// more sophisticated alert management systems (e.g., storing in a database,
// sending notifications, triggering automated remediation workflows).
func DefaultAlertHandler(ctx context.Context, finding *securitycenterpb.Finding) error {
	// Check context for cancellation to ensure timely shutdown if the parent context is cancelled.
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
		log.Printf("[SCC Alert] Severity: %-8s | Category: %-30s | Resource: %s | Finding: %s | State: %s | EventTime: %s",
			finding.GetSeverity().String(),
			finding.GetCategory(),
			finding.GetResourceName(),
			finding.GetDisplayName(),
			finding.GetState().String(),
			finding.GetEventTime().AsTime().Format(time.RFC3339),
		)
		return nil
	}
}