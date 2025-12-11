```typescript
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Buffer } from 'buffer';

// Interface for the parsed invoice data
export interface InvoiceData {
  vendor: string | null;
  amount: number | null;
  dueDate: Date | null;
  invoiceNumber: string | null;
  rawText: string;
}

// Simplified representation of Google API credentials
export interface GoogleApiCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string; // Assuming we have a refresh token for offline access
}

/**
 * Service to integrate with the Gmail API for automating invoice processing.
 */
export class GmailParserService {
  private gmail: gmail_v1.Gmail;
  private auth: OAuth2Client;

  constructor(credentials: GoogleApiCredentials) {
    this.auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    this.auth.setCredentials({ refresh_token: credentials.refreshToken });

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  /**
   * Searches for emails matching a specific query.
   * @param query - The Gmail search query (e.g., 'from:service@example.com subject:invoice').
   * @param maxResults - The maximum number of messages to return.
   * @returns A list of message IDs.
   */
  public async findInvoiceEmails(query: string, maxResults = 10): Promise<string[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      return messages.map(msg => msg.id).filter((id): id is string => !!id);
    } catch (error) {
      console.error('Error searching for emails:', error);
      throw new Error('Failed to search emails in Gmail.');
    }
  }

  /**
   * Retrieves the full details of a single message.
   * @param messageId - The ID of the message to retrieve.
   * @returns The full message object.
   */
  public async getMessageDetails(messageId: string): Promise<gmail_v1.Schema$Message> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full', // Use 'full' to get the entire payload, including parts
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching message with ID ${messageId}:`, error);
      throw new Error(`Failed to fetch message details for ID: ${messageId}`);
    }
  }

  /**
   * Parses invoice data from a given Gmail message.
   * This is a simplified implementation and should be expanded with more robust parsing logic.
   * @param message - The Gmail message object.
   * @returns An object containing parsed invoice data.
   */
  public parseInvoiceFromMessage(message: gmail_v1.Schema$Message): InvoiceData {
    const bodyText = this.extractTextFromMessage(message);
    return this.extractInvoiceDataFromText(bodyText);
  }

  /**
   * Downloads a specific attachment from a message.
   * @param messageId - The ID of the message containing the attachment.
   * @param attachmentId - The ID of the attachment.
   * @returns A Buffer with the attachment data.
   */
  public async getAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId,
      });

      if (!response.data.data) {
        throw new Error('Attachment data is empty.');
      }

      // Gmail API returns base64url encoded data.
      const base64Data = response.data.data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error(`Error fetching attachment ${attachmentId} from message ${messageId}:`, error);
      throw new Error('Failed to fetch attachment.');
    }
  }

  /**
   * Extracts the plain text content from a message's payload.
   * @param message - The Gmail message object.
   * @returns The combined plain text content of the message.
   */
  private extractTextFromMessage(message: gmail_v1.Schema$Message): string {
    let text = '';
    const payload = message.payload;

    if (!payload) return '';

    // A helper function to recursively find text/plain parts
    const findTextPart = (part: gmail_v1.Schema$MessagePart): string | null => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return this.decodeBase64Url(part.body.data);
      }
      
      if (part.mimeType === 'text/html' && part.body?.data) {
        // As a fallback, decode HTML and strip tags. A more robust solution would use a library.
        const htmlContent = this.decodeBase64Url(part.body.data);
        return htmlContent.replace(/<[^>]*>?/gm, ' ');
      }
      
      if (part.parts) {
        for (const subPart of part.parts) {
          const result = findTextPart(subPart);
          if (result) return result;
        }
      }
      return null;
    };
    
    // Handle top-level payload directly if it's the body
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
        text = this.decodeBase64Url(payload.body.data);
    } else if (payload.parts) {
        // Search through multipart message parts
        for (const part of payload.parts) {
            const foundText = findTextPart(part);
            if (foundText) {
                text += foundText + '\n';
            }
        }
    }

    return text.trim();
  }

  /**
   * Decodes a base64url encoded string.
   * @param encodedString - The string to decode.
   * @returns The decoded string.
   */
  private decodeBase64Url(encodedString: string): string {
    const base64 = encodedString.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * A simplified regex-based parser to extract invoice details from text.
   * This should be replaced with a more advanced NLP or template-based solution for production.
   * @param text - The text content of the email body.
   * @returns An InvoiceData object.
   */
  private extractInvoiceDataFromText(text: string): InvoiceData {
    const amountMatch = text.match(/(?:Total|Amount Due|Amount)\s*:\s*\$?([\d,]+\.\d{2})/i);
    const dueDateMatch = text.match(/(?:Due Date|Payment Due)\s*:\s*(\w+\s\d{1,2},\s\d{4}|\d{4}-\d{2}-\d{2})/i);
    const invoiceNumberMatch = text.match(/(?:Invoice Number|Invoice #)\s*:\s*([A-Z0-9-]+)/i);
    
    // This is highly simplistic; vendor name would likely come from 'From' header or email content.
    const vendorMatch = text.match(/(?:Sincerely|Regards|Thank you,)\s*\n(.*)/i);

    return {
      vendor: vendorMatch ? vendorMatch[1].trim() : null,
      amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null,
      dueDate: dueDateMatch ? new Date(dueDateMatch[1]) : null,
      invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1] : null,
      rawText: text,
    };
  }
}
```