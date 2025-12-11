import logging
from google.cloud import language_v1
from google.api_core.exceptions import GoogleAPIError

logger = logging.getLogger(__name__)

class NaturalLanguageProcessor:
    """
    Integrates with Google Natural Language API to analyze text for market sentiment
    and key entities from news feeds.
    """
    def __init__(self, language_code: str = "en-US"):
        """
        Initializes the NaturalLanguageProcessor with the Google Cloud Natural Language client.

        Args:
            language_code (str): The language code for the text to be processed.
                                 Defaults to "en-US". The API can often auto-detect,
                                 but providing it can be more efficient/accurate for specific cases.
        """
        self.client = language_v1.LanguageServiceClient()
        self.language_code = language_code
        logger.info(f"NaturalLanguageProcessor initialized with language_code: {self.language_code}")

    def _create_document(self, text: str) -> language_v1.Document:
        """
        Helper method to create a Document object for the API.
        """
        return language_v1.Document(
            content=text,
            type_=language_v1.Document.Type.PLAIN_TEXT,
            language=self.language_code
        )

    def analyze_sentiment(self, text: str):
        """
        Analyzes the sentiment of the provided text.

        Args:
            text (str): The text content to analyze.

        Returns:
            dict: A dictionary containing 'score' and 'magnitude' of the sentiment,
                  or None if analysis fails.
                  Score ranges from -1.0 (negative) to 1.0 (positive).
                  Magnitude indicates the overall emotional intensity (0.0 to +inf).
                  Neutral sentiment has a score close to 0 and a low magnitude.
        """
        if not text:
            logger.warning("Attempted to analyze sentiment for empty text.")
            return None

        document = self._create_document(text)

        try:
            sentiment = self.client.analyze_sentiment(request={'document': document}).document_sentiment
            logger.debug(f"Sentiment analysis successful for text (first 50 chars): '{text[:50]}...'")
            return {
                "score": sentiment.score,
                "magnitude": sentiment.magnitude
            }
        except GoogleAPIError as e:
            logger.error(f"Google Natural Language API error during sentiment analysis: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during sentiment analysis: {e}")
            return None

    def analyze_entities(self, text: str):
        """
        Analyzes the entities (people, organizations, locations, events, products, etc.)
        within the provided text.

        Args:
            text (str): The text content to analyze.

        Returns:
            list: A list of dictionaries, where each dictionary represents an entity
                  with 'name', 'type', 'salience', 'mentions', and 'sentiment' (if available).
                  Returns an empty list if analysis fails or no entities are found.
        """
        if not text:
            logger.warning("Attempted to analyze entities for empty text.")
            return []

        document = self._create_document(text)

        try:
            response = self.client.analyze_entities(request={'document': document})
            entities_data = []
            for entity in response.entities:
                entity_info = {
                    "name": entity.name,
                    "type": language_v1.Entity.Type(entity.type_).name, # Convert enum to string
                    "salience": entity.salience,
                    "mentions": [mention.text.content for mention in entity.mentions]
                }
                # Add entity-level sentiment if it exists and is meaningful
                if entity.sentiment.score != 0 or entity.sentiment.magnitude != 0:
                    entity_info["sentiment"] = {
                        "score": entity.sentiment.score,
                        "magnitude": entity.sentiment.magnitude
                    }
                entities_data.append(entity_info)
            logger.debug(f"Entity analysis successful for text (first 50 chars): '{text[:50]}...'")
            return entities_data
        except GoogleAPIError as e:
            logger.error(f"Google Natural Language API error during entity analysis: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during entity analysis: {e}")
            return []

    def analyze_sentiment_and_entities(self, text: str):
        """
        Performs both sentiment and entity analysis on the provided text.
        This method calls the respective analysis functions and combines their results.

        Args:
            text (str): The text content to analyze.

        Returns:
            dict: A dictionary containing 'sentiment' and 'entities' results.
                  Returns None for overall failure (if both sub-analyses fail or text is empty).
        """
        if not text:
            logger.warning("Attempted to analyze sentiment and entities for empty text.")
            return None

        sentiment_result = self.analyze_sentiment(text)
        entities_result = self.analyze_entities(text)

        # Return None only if both analyses failed entirely
        if sentiment_result is None and not entities_result:
            return None

        return {
            "sentiment": sentiment_result,
            "entities": entities_result
        }