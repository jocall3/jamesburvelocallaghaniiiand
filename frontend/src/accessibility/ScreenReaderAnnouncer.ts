export type Politeness = 'polite' | 'assertive' | 'off';

class ScreenReaderAnnouncer {
  private politeElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;

  /**
   * Creates a hidden div element with specific ARIA live attributes.
   * @param politeness The aria-live setting ('polite' or 'assertive').
   */
  private createLiveRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const element = document.createElement('div');
    element.setAttribute('aria-live', politeness);
    element.setAttribute('aria-atomic', 'true');

    // Assign roles to ensure broad screen reader compatibility
    if (politeness === 'assertive') {
      element.setAttribute('role', 'alert');
    } else {
      element.setAttribute('role', 'status');
    }

    // CSS to visually hide the element but keep it in the accessibility tree
    element.style.position = 'absolute';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.padding = '0';
    element.style.margin = '-1px';
    element.style.overflow = 'hidden';
    element.style.clip = 'rect(0, 0, 0, 0)';
    element.style.whiteSpace = 'nowrap';
    element.style.border = '0';

    document.body.appendChild(element);
    return element;
  }

  /**
   * Retrieves or creates the DOM element for the specified politeness level.
   */
  private getElement(politeness: 'polite' | 'assertive'): HTMLElement {
    if (politeness === 'assertive') {
      if (!this.assertiveElement || !document.body.contains(this.assertiveElement)) {
        this.assertiveElement = this.createLiveRegion('assertive');
      }
      return this.assertiveElement;
    } else {
      if (!this.politeElement || !document.body.contains(this.politeElement)) {
        this.politeElement = this.createLiveRegion('polite');
      }
      return this.politeElement;
    }
  }

  /**
   * Triggers a screen reader announcement.
   * @param message The text to be announced.
   * @param politeness 'polite' (waits until user is idle) or 'assertive' (interrupts immediately).
   */
  public announce(message: string, politeness: Politeness = 'polite'): void {
    if (politeness === 'off' || !message) return;

    const element = this.getElement(politeness);

    // Clear text content momentarily. This ensures that if the same message 
    // is announced twice in a row, the screen reader perceives it as an update.
    element.textContent = '';

    // Set the message after a minimal delay to register the DOM mutation
    setTimeout(() => {
      element.textContent = message;
    }, 50);
  }
}

const announcerInstance = new ScreenReaderAnnouncer();

/**
 * Helper function to announce a message to screen readers.
 * @param message The text content to announce.
 * @param politeness The priority of the announcement (default: 'polite').
 */
export const announce = (message: string, politeness: Politeness = 'polite') => {
  announcerInstance.announce(message, politeness);
};

export default announcerInstance;