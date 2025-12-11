import os
from google.cloud import documentai_v1 as documentai # Using v1 for the stable Document AI API

class InvoiceProcessor:
    """
    A pipeline using Google Cloud Document AI to extract structured data from PDF invoices.
    """

    def __init__(self, project_id: str, location: str, processor_id: str):
        """
        Initializes the InvoiceProcessor.

        Args:
            project_id: Your Google Cloud project ID.
            location: The Document AI processor location (e.g., 'us', 'eu').
            processor_id: The ID of your specialized Document AI invoice processor.
                          This is typically an 'INVOICE_PROCESSOR' type.
        """
        self.project_id = project_id
        self.location = location
        self.processor_id = processor_id
        
        self.client = documentai.DocumentProcessorServiceClient()
        self.processor_name = self.client.processor_path(project_id, location, processor_id)

    def _get_entity_value(self, entity: documentai.Document.Entity):
        """
        Extracts the value from a Document AI entity, prioritizing normalized value,
        then mention_text, then raw text. Handles Money, Date, and basic Text.
        """
        if entity.normalized_value:
            if entity.normalized_value.money_value:
                # Handle cases where units or nanos might be None
                units = entity.normalized_value.money_value.units if entity.normalized_value.money_value.units is not None else 0
                nanos = entity.normalized_value.money_value.nanos if entity.normalized_value.money_value.nanos is not None else 0
                
                # Combine units and nanos to get a float representation
                amount_val = float(units) + (nanos / 1_000_000_000)
                
                return {
                    "currency": entity.normalized_value.money_value.currency_code,
                    "amount": amount_val,
                    "raw_text": entity.mention_text if entity.mention_text else (entity.text_anchor.content if entity.text_anchor else None)
                }
            elif entity.normalized_value.date_value:
                date_val = entity.normalized_value.date_value
                # Format date as YYYY-MM-DD
                return f"{date_val.year:04d}-{date_val.month:02d}-{date_val.day:02d}"
            elif entity.normalized_value.text:
                return entity.normalized_value.text
        
        # Fallback to mention_text or entity.text if no normalized value is explicitly set
        if entity.mention_text:
            return entity.mention_text
        elif entity.text:
            return entity.text
            
        return None

    def process_invoice(self, invoice_bytes: bytes) -> dict:
        """
        Processes a PDF invoice using Document AI and extracts structured data.

        Args:
            invoice_bytes: The content of the PDF invoice file as bytes.

        Returns:
            A dictionary containing the extracted invoice data.
        """
        raw_document = documentai.RawDocument(
            content=invoice_bytes,
            mime_type='application/pdf'
        )
        request = documentai.ProcessRequest(
            name=self.processor_name,
            raw_document=raw_document
        )

        try:
            response = self.client.process_document(request=request)
            document = response.document

            extracted_data = {}
            line_items = []

            for entity in document.entities:
                # Special handling for line_item and its properties as they are nested
                if entity.type == "line_item":
                    item_data = {}
                    item_data["mention_text"] = entity.mention_text if entity.mention_text else "" # Raw text span for the line item
                    for prop in entity.properties:
                        prop_value = self._get_entity_value(prop)
                        if prop_value is not None:
                            # Map property types to dictionary keys
                            if prop.type == "description":
                                item_data["description"] = prop_value
                            elif prop.type == "quantity":
                                # Attempt to convert quantity to a float/int if it's a numeric string
                                try:
                                    item_data["quantity"] = float(prop_value) if isinstance(prop_value, str) else prop_value
                                except ValueError:
                                    item_data["quantity"] = prop_value # Keep as string if conversion fails
                            elif prop.type == "unit_price":
                                # This will be a dict {currency, amount} if it's a money_value
                                item_data["unit_price"] = prop_value
                            elif prop.type == "amount":
                                # This will be a dict {currency, amount} if it's a money_value
                                item_data["amount"] = prop_value
                            elif prop.type == "unit_of_measure":
                                item_data["unit_of_measure"] = prop_value
                            # Add other line item properties as needed (e.g., "product_code")
                    if item_data:
                        line_items.append(item_data)
                    continue # Continue to the next top-level entity after processing line item properties

                # General top-level fields
                value = self._get_entity_value(entity)
                if value is None:
                    continue # Skip entities without a discernible value

                if entity.type == "vendor_name":
                    extracted_data["vendor_name"] = value
                elif entity.type == "vendor_address":
                    extracted_data["vendor_address"] = value
                elif entity.type == "invoice_id":
                    extracted_data["invoice_id"] = value
                elif entity.type == "purchase_order":
                    extracted_data["purchase_order"] = value
                elif entity.type == "invoice_date":
                    extracted_data["invoice_date"] = value
                elif entity.type == "due_date":
                    extracted_data["due_date"] = value
                elif entity.type == "total_amount":
                    extracted_data["total_amount"] = value # This will be a dict {currency, amount}
                elif entity.type == "total_tax_amount":
                    extracted_data["total_tax_amount"] = value
                elif entity.type == "net_amount":
                    extracted_data["net_amount"] = value
                elif entity.type == "currency":
                    # Sometimes currency is a top-level entity, capture its code
                    extracted_data["currency_code"] = value 
                elif entity.type == "receiver_name":
                    extracted_data["receiver_name"] = value
                elif entity.type == "receiver_address":
                    extracted_data["receiver_address"] = value
                # Add more top-level entities as needed based on Document AI Invoice Parser output
                # e.g., "customer_name", "customer_address", "shipping_address", "billing_address", "payment_terms"

            if line_items:
                extracted_data["line_items"] = line_items

            return extracted_data

        except Exception as e:
            # It's good practice to log the error context for debugging
            print(f"Error processing invoice with Document AI processor {self.processor_name}: {e}")
            # Re-raise the exception for higher-level handling or implement specific error handling strategy
            raise