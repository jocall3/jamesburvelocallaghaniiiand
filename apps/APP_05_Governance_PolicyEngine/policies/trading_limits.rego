# METADATA
#
# This policy file is part of APP_05_Governance_PolicyEngine.
# It defines a set of rules for governing financial trading activities based on user roles,
# trade characteristics, and market conditions. This policy is designed to be evaluated
# by an Open Policy Agent (OPA) engine.
#
# The primary goal is to enforce risk management and compliance constraints automatically.
# This demonstrates the core capability of the Policy Engine: translating complex business
# rules into executable, auditable code.
#
# TENSION: Speed vs. Safety
# This policy balances the need for rapid trade execution (speed) with the imperative
# to prevent catastrophic errors, fraud, or non-compliant activities (safety).
# The rules are structured to provide fast path approvals for common, low-risk scenarios
# while escalating or blocking high-risk or unusual trades.

package governance.trading.limits

import future.keywords.if
import future.keywords.in

# By default, all trades are denied.
# A trade is only allowed if it passes all relevant checks and the `deny_reasons` set remains empty.
default allow = false

# --- Entry Point ---
# The final decision is based on whether any denial reasons were generated.
# This provides a clear, auditable trail for every decision.
allow if {
	count(deny_reasons) == 0
}

# --- Denial Reason Generation ---
# This set collects all reasons why a trade should be denied.
# If the set is empty, the trade is allowed.

deny_reasons contains reason if {
	# Universal check: All trades must have a positive notional value.
	input.trade.notional_value <= 0
	reason := "Trade must have a positive notional value."
}

deny_reasons contains reason if {
	# Apply role-specific rule sets.
	# This structure allows for modular and clear policy definition per role.
	reasons := retail_investor_violations
	count(reasons) > 0
	reason := reasons[_]
}

deny_reasons contains reason if {
	reasons := institutional_trader_violations
	count(reasons) > 0
	reason := reasons[_]
}

deny_reasons contains reason if {
	reasons := market_maker_violations
	count(reasons) > 0
	reason := reasons[_]
}

# --- Role-Specific Violation Sets ---

# Rules for "retail_investor" role
retail_investor_violations contains reason if {
	user_has_role("retail_investor")
	not is_market_hours(input.context.timestamp)
	reason := "Retail trades are only permitted during standard market hours (9:30 AM - 4:00 PM ET)."
}

retail_investor_violations contains reason if {
	user_has_role("retail_investor")
	input.trade.notional_value > config.limits.retail.max_notional_value
	reason := sprintf("Trade notional value of %.2f exceeds the retail limit of %.2f.", [input.trade.notional_value, config.limits.retail.max_notional_value])
}

retail_investor_violations contains reason if {
	user_has_role("retail_investor")
	input.trade.type == "sell_short"
	is_high_risk_instrument(input.trade.instrument)
	reason := sprintf("Short selling of high-risk instrument '%s' is not permitted for retail investors.", [input.trade.instrument])
}

retail_investor_violations contains reason if {
	user_has_role("retail_investor")
	instrument_type := get_instrument_type(input.trade.instrument)
	instrument_type in config.prohibited_instruments.retail
	reason := sprintf("Trading in instrument type '%s' is not permitted for retail investors.", [instrument_type])
}

# Rules for "institutional_trader" role
institutional_trader_violations contains reason if {
	user_has_role("institutional_trader")
	input.trade.notional_value > config.limits.institutional.max_notional_value
	reason := sprintf("Trade notional value of %.2f exceeds the institutional limit of %.2f.", [input.trade.notional_value, config.limits.institutional.max_notional_value])
}

institutional_trader_violations contains reason if {
	user_has_role("institutional_trader")
	input.trade.notional_value > config.limits.institutional.pre_approval_threshold
	not input.trade.pre_approved == true
	reason := sprintf("Trades over %.2f require pre-approval.", [config.limits.institutional.pre_approval_threshold])
}

# Rules for "market_maker" role
market_maker_violations contains reason if {
	user_has_role("market_maker")
	not input.trade.instrument in config.mandates.market_maker[input.user.id]
	reason := sprintf("Market maker '%s' is not mandated to trade instrument '%s'.", [input.user.id, input.trade.instrument])
}


# --- Helper Functions & Data ---

# Check if the user has a specific role.
user_has_role(role) {
	input.user.roles[_] == role
}

# Check if a trade occurs during standard market hours (9:30 AM to 4:00 PM ET).
# Note: This is a simplified check and a production system would use a more robust time library
# and handle timezones and holidays properly.
is_market_hours(timestamp) {
	ts_parts := time.parse_rfc3339_ns(timestamp)
	ts_weekday := time.weekday(ts_parts)
	ts_weekday != "Saturday"
	ts_weekday != "Sunday"

	# Assuming UTC timestamp, ET is UTC-4 or UTC-5. We'll approximate with UTC-4 for simplicity.
	# 9:30 ET = 13:30 UTC. 16:00 ET = 20:00 UTC.
	ts_parts[3] >= 13 # Hour
	ts_parts[4] >= 30 # Minute
	ts_parts[3] < 20  # Hour
}

# Check if an instrument is classified as high-risk.
is_high_risk_instrument(instrument) {
	instrument in config.risk_classification.high_volatility
}

# A mock function to determine instrument type. In a real system, this would
# query an external data source.
get_instrument_type(instrument) = type if {
    startswith(instrument, "OPT:")
    type := "option"
} else = type if {
    startswith(instrument, "FUT:")
    type := "future"
} else = "equity"


# --- Configuration Data ---
# This section centralizes configurable values. In a real deployment, this data
# would be provided to OPA as external data, not hardcoded in the policy.
# This allows for dynamic policy updates without changing the code.

config := {
	"limits": {
		"retail": {
			"max_notional_value": 50000.00,
		},
		"institutional": {
			"max_notional_value": 10000000.00,
			"pre_approval_threshold": 5000000.00,
		},
	},
	"prohibited_instruments": {
		"retail": ["option", "future", "crypto_derivative"],
	},
	"risk_classification": {
		"high_volatility": [
			"GME",
			"AMC",
			"BBBYQ",
			"TSLA", # Example of a high-volatility large cap
		],
	},
	"mandates": {
		"market_maker": {
			"mm-user-001": ["AAPL", "MSFT", "GOOG", "AMZN"],
			"mm-user-002": ["TSLA", "NVDA", "META"],
		},
	},
}