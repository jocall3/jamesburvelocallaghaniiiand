package event_mesh

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"
)

// SignalType defines the categorization of kinetic intelligence signals.
type SignalType string

const (
	// SignalTypeTelemetry indicates raw sensor or metric data.
	SignalTypeTelemetry SignalType = "kinetic.telemetry"
	// SignalTypeThreat indicates a detected threat or anomaly.
	SignalTypeThreat SignalType = "kinetic.threat"
	// SignalTypeOperational indicates operational state changes.
	SignalTypeOperational SignalType = "kinetic.operational"
	// SignalTypeAudit indicates a security or access audit event.
	SignalTypeAudit SignalType = "kinetic.audit"
)

// Signal represents a standardized kinetic intelligence event.
// It is designed to carry payloads that may originate from various sources
// such as Cloud IoT, Vision API, or internal telemetry.
type Signal struct {
	ID        string                 `json:"id"`
	Type      SignalType             `json:"type"`
	Source    string                 `json:"source"`
	Timestamp time.Time              `json:"timestamp"`
	Payload   map[string]interface{} `json:"payload"`
	Metadata  map[string]string      `json:"metadata,omitempty"`
}

// HandlerFunc is the function signature for processing signals.
type HandlerFunc func(ctx context.Context, signal Signal) error

// subscription holds the details of a registered subscriber.
type subscription struct {
	id      string
	handler HandlerFunc
	options subOptions
}

type subOptions struct {
	async bool
}

// Dispatcher acts as the centralized event bus for the kinetic intelligence system.
// It manages the routing of signals to registered subscribers (services/components).
type Dispatcher struct {
	mu           sync.RWMutex
	subscribers  map[SignalType][]subscription
	eventQueue   chan Signal
	workerCount  int
	quit         chan struct{}
	wg           sync.WaitGroup
	errorHandler func(error)
}

// DispatcherConfig holds configuration for the event dispatcher.
type DispatcherConfig struct {
	BufferSize  int
	WorkerCount int
	ErrorHandler func(error)
}

// NewDispatcher initializes a new Dispatcher with the provided configuration.
func NewDispatcher(config DispatcherConfig) *Dispatcher {
	if config.BufferSize <= 0 {
		config.BufferSize = 1024
	}
	if config.WorkerCount <= 0 {
		config.WorkerCount = 4
	}
	if config.ErrorHandler == nil {
		config.ErrorHandler = func(err error) {
			log.Printf("Event Mesh Error: %v", err)
		}
	}

	return &Dispatcher{
		subscribers:  make(map[SignalType][]subscription),
		eventQueue:   make(chan Signal, config.BufferSize),
		workerCount:  config.WorkerCount,
		quit:         make(chan struct{}),
		errorHandler: config.ErrorHandler,
	}
}

// Start spins up the worker routines to begin processing the event queue.
func (d *Dispatcher) Start() {
	for i := 0; i < d.workerCount; i++ {
		d.wg.Add(1)
		go d.worker(i)
	}
	log.Printf("Kinetic Event Mesh Dispatcher started with %d workers", d.workerCount)
}

// Stop gracefully shuts down the dispatcher, waiting for the queue to drain and workers to exit.
func (d *Dispatcher) Stop() {
	close(d.quit)
	d.wg.Wait()
	close(d.eventQueue)
	log.Println("Kinetic Event Mesh Dispatcher stopped")
}

// Subscribe registers a handler for a specific signal type.
// Returns a subscription ID that can be used to unsubscribe.
func (d *Dispatcher) Subscribe(topic SignalType, handler HandlerFunc, async bool) (string, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	subID, err := generateID()
	if err != nil {
		return "", fmt.Errorf("failed to generate subscription ID: %w", err)
	}

	sub := subscription{
		id:      subID,
		handler: handler,
		options: subOptions{async: async},
	}

	d.subscribers[topic] = append(d.subscribers[topic], sub)
	return subID, nil
}

// Unsubscribe removes a subscription by its ID.
func (d *Dispatcher) Unsubscribe(subID string) {
	d.mu.Lock()
	defer d.mu.Unlock()

	for topic, subs := range d.subscribers {
		var newSubs []subscription
		for _, s := range subs {
			if s.id != subID {
				newSubs = append(newSubs, s)
			}
		}
		// Update only if we removed something
		if len(newSubs) != len(subs) {
			d.subscribers[topic] = newSubs
		}
	}
}

// Publish emits a signal to the mesh.
// This method is thread-safe and can be called from multiple goroutines.
func (d *Dispatcher) Publish(ctx context.Context, signal Signal) error {
	if signal.ID == "" {
		id, err := generateID()
		if err != nil {
			return err
		}
		signal.ID = id
	}
	if signal.Timestamp.IsZero() {
		signal.Timestamp = time.Now().UTC()
	}

	select {
	case d.eventQueue <- signal:
		return nil
	case <-d.quit:
		return errors.New("dispatcher is shutting down")
	case <-ctx.Done():
		return ctx.Err()
	}
}

// worker consumes signals from the queue and routes them to subscribers.
func (d *Dispatcher) worker(id int) {
	defer d.wg.Done()
	for {
		select {
		case <-d.quit:
			return
		case sig, ok := <-d.eventQueue:
			if !ok {
				return
			}
			d.route(sig)
		}
	}
}

// route determines which subscribers should receive the signal and invokes them.
func (d *Dispatcher) route(sig Signal) {
	d.mu.RLock()
	subs, exists := d.subscribers[sig.Type]
	d.mu.RUnlock()

	if !exists || len(subs) == 0 {
		return
	}

	for _, sub := range subs {
		if sub.options.async {
			// Fork a goroutine for async subscribers
			go func(s subscription, signal Signal) {
				d.executeHandler(s, signal)
			}(sub, sig)
		} else {
			// Execute synchronously within the worker
			d.executeHandler(sub, sig)
		}
	}
}

// executeHandler runs the subscriber logic and handles panic recovery/errors.
func (d *Dispatcher) executeHandler(sub subscription, sig Signal) {
	defer func() {
		if r := recover(); r != nil {
			d.errorHandler(fmt.Errorf("panic in subscriber %s: %v", sub.id, r))
		}
	}()

	// Create a context with timeout for the handler
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := sub.handler(ctx, sig); err != nil {
		d.errorHandler(fmt.Errorf("subscriber %s failed to handle signal %s: %w", sub.id, sig.ID, err))
	}
}

// generateID generates a random unique identifier for signals and subscriptions.
func generateID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}