resource "google_pubsub_topic" "market_data_feed" {
  name = "market-data-feed"

  labels = {
    environment = "production"
    system      = "financial-mesh"
    data_type   = "market-ticks"
  }

  message_retention_duration = "86400s" # 24 hours
}

resource "google_pubsub_topic" "order_execution" {
  name = "order-execution"

  labels = {
    environment = "production"
    system      = "financial-mesh"
    data_type   = "orders"
  }

  message_retention_duration = "604800s" # 7 days
}

resource "google_pubsub_topic" "risk_assessment" {
  name = "risk-assessment"

  labels = {
    environment = "production"
    system      = "financial-mesh"
    data_type   = "risk-metrics"
  }
}

resource "google_pubsub_topic" "settlement_events" {
  name = "settlement-events"

  labels = {
    environment = "production"
    system      = "financial-mesh"
    data_type   = "transactions"
  }
}

resource "google_pubsub_topic" "compliance_audit" {
  name = "compliance-audit"

  labels = {
    environment = "production"
    system      = "financial-mesh"
    data_type   = "audit-logs"
  }
}

resource "google_pubsub_topic" "dead_letter_queue" {
  name = "financial-mesh-dlq"

  labels = {
    environment = "production"
    system      = "financial-mesh"
    purpose     = "error-handling"
  }
}