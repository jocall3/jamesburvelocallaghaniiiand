import os
import logging
import json
from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class BankingService:
    """
    Mock service to simulate internal banking logic.
    In a real production environment, this would connect to the core banking API
    or database via the services listed in the project goal (e.g., Firestore, Cloud SQL).
    """
    
    def __init__(self):
        # Simulated database
        self.accounts = {
            "checking": {"balance": 5400.00, "currency": "USD"},
            "savings": {"balance": 12500.50, "currency": "USD"},
            "credit": {"balance": -350.25, "currency": "USD"}
        }
        
    def get_balance(self, account_type):
        account = self.accounts.get(account_type.lower())
        if account:
            return account['balance'], account['currency']
        return None, None

    def transfer_funds(self, source, destination, amount):
        src_account = self.accounts.get(source.lower())
        dst_account = self.accounts.get(destination.lower())

        if not src_account or not dst_account:
            return False, "Invalid account specified."

        if src_account['balance'] < amount:
            return False, "Insufficient funds."

        # Execute transfer (atomic operation in real DB)
        src_account['balance'] -= amount
        dst_account['balance'] += amount
        
        return True, f"Successfully transferred ${amount} from {source} to {destination}."

    def get_recent_transactions(self, account_type):
        if account_type.lower() not in self.accounts:
            return None
        # Mock transactions
        return [
            {"merchant": "Coffee Shop", "amount": 4.50, "date": "2023-10-01"},
            {"merchant": "Grocery Store", "amount": 123.45, "date": "2023-09-28"},
            {"merchant": "Utility Bill", "amount": 85.00, "date": "2023-09-25"}
        ]

banking_service = BankingService()

# --- Intent Handlers ---

def handle_get_balance(parameters):
    account_type = parameters.get('account_type', 'checking')
    balance, currency = banking_service.get_balance(account_type)

    if balance is not None:
        text = f"The available balance in your {account_type} account is {balance:,.2f} {currency}."
    else:
        text = f"I could not find an account labeled '{account_type}'. You have checking, savings, and credit accounts."

    return {"fulfillmentText": text}

def handle_transfer_money(parameters):
    source = parameters.get('source_account', '')
    destination = parameters.get('destination_account', '')
    
    # Dialogflow system entities for currency usually come as a dict or number
    amount_param = parameters.get('amount', 0)
    amount = 0.0
    
    if isinstance(amount_param, dict):
        amount = float(amount_param.get('amount', 0))
    else:
        try:
            amount = float(amount_param)
        except ValueError:
            pass

    if amount <= 0:
        return {"fulfillmentText": "I need a valid positive amount to transfer."}

    success, message = banking_service.transfer_funds(source, destination, amount)
    
    return {"fulfillmentText": message}

def handle_transaction_history(parameters):
    account_type = parameters.get('account_type', 'checking')
    transactions = banking_service.get_recent_transactions(account_type)

    if transactions is None:
        return {"fulfillmentText": f"I couldn't access transaction history for {account_type}."}

    text = f"Here are the recent transactions for your {account_type} account:\n"
    for t in transactions:
        text += f"- {t['date']}: ${t['amount']} at {t['merchant']}\n"

    return {"fulfillmentText": text}

def handle_default_fallback(parameters):
    return {"fulfillmentText": "I didn't catch that. Could you please rephrase your request regarding your finances?"}

# Mapping intents to handler functions
INTENT_HANDLERS = {
    "account.balance": handle_get_balance,
    "account.transfer": handle_transfer_money,
    "account.transactions": handle_transaction_history,
    "Default Fallback Intent": handle_default_fallback
}

@app.route('/webhook', methods=['POST'])
def dialogflow_webhook():
    """
    Main entry point for Dialogflow fulfillment.
    """
    try:
        req = request.get_json(force=True)
        
        query_result = req.get('queryResult', {})
        intent_display_name = query_result.get('intent', {}).get('displayName')
        parameters = query_result.get('parameters', {})

        logger.info(f"Received intent: {intent_display_name}")
        logger.info(f"Parameters: {json.dumps(parameters)}")

        handler = INTENT_HANDLERS.get(intent_display_name)

        if handler:
            response_data = handler(parameters)
        else:
            # Fallback for unmapped intents
            response_data = {"fulfillmentText": f"Webhook received the intent '{intent_display_name}', but no handler is defined."}

        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return jsonify({
            "fulfillmentText": "An internal error occurred in the banking concierge service."
        })

if __name__ == '__main__':
    # Cloud Run/Functions typically set the PORT env variable
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)