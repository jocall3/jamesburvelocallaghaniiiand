import React, { CSSProperties } from 'react';

const SchemaExplorer = () => {
  return (
    <div style={styles.page}>
      <article style={styles.article}>
        <header>
          <h1 style={styles.h1}>5 Lessons on Clarity I Learned From a Financial Data Explorer</h1>
          <p style={styles.intro}>
            We’ve all been there: staring at a dense specification or a sprawling dataset, wondering where to even begin. Complexity is the default state in software, but our job is to carve paths of clarity through it. I recently stumbled upon a React component built to explore the ISO 20022 schema—a global standard for financial messaging—and it was a masterclass in exactly that. It wasn't just functional; it was thoughtful. Buried in its logic were powerful, universal principles for building better software. Here are the five most surprising takeaways.
          </p>
        </header>

        <section style={styles.section}>
          <h2 style={styles.h2}>1. Separate Your Concerns: The Brain vs. The Face</h2>
          <p style={styles.p}>
            The first thing that stands out is the clean separation of concerns. The code is split into a primary <code>SchemaExplorer</code> component that acts as the "brain"—managing state, handling search logic, and orchestrating data flow—and a <code>DefinitionDetails</code> component that is purely the "face," responsible only for presenting a single piece of data.
          </p>
          <p style={styles.p}>
            This isn’t just a React best practice; it’s a fundamental principle of clarity. It means you can completely refactor how the data looks without breaking how it's managed. It’s the software equivalent of not trying to think and speak at the exact same time—one process informs the other, but they remain distinct. This separation makes the code cleaner, easier to debug, and infinitely more scalable.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>2. Anticipate the User: Search Isn't an Afterthought</h2>
          <p style={styles.p}>
            In a system with potentially thousands of definitions, scrolling is not a user experience—it's a chore. This component understands that. The search bar isn't tucked away in a menu; it's the first thing you see, a primary feature that acknowledges the scale of the data.
          </p>
          <p style={styles.p}>
            More importantly, the implementation is thoughtful. It uses React's <code>useMemo</code> hook to ensure the list filtering is performant, preventing unnecessary re-calculations on every single render. This small detail reveals a deep empathy for the user. It anticipates their need for a fast, responsive interface and builds for it from the start.
          </p>
          <blockquote style={styles.blockquote}>
            The most elegant feature is the one that removes the most friction. For large datasets, that feature is almost always search.
          </blockquote>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>3. Raw Data is Rarely User-Friendly: Be the Translator</h2>
          <p style={styles.p}>
            Perhaps the most insightful piece of the entire component is a small helper function named <code>parseDescription</code>. Its sole job is to take a raw, potentially messy description string and intelligently split it into a human-readable paragraph and a structured, tabular list of codes. It uses a bit of regex to find patterns and impose order where there was none.
          </p>
          <p style={styles.p}>
            This is a profound lesson that extends far beyond this one component. Our role as developers isn't just to shuttle data from a database to a screen. We are translators. We must interpret raw information and present it in a way that provides insight and understanding. Good code doesn't just display data; it tells its story.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>4. A Clean UI is About What You *Don't* Show</h2>
          <p style={styles.p}>
            The details view is a masterclass in minimalism. It’s filled with conditional rendering logic like <code>{`{definition.pattern && ...}`}</code>. If a specific data definition doesn't have a `minLength` or a `pattern` attribute, those sections simply don't appear in the UI. There are no "N/A" labels or empty fields cluttering the view.
          </p>
          <p style={styles.p}>
            This creates a dynamic and context-aware interface that feels clean and perfectly tailored to the data being viewed. It’s a powerful reminder that clarity is often achieved through subtraction, not addition. The most important design decision you can make is choosing what to leave out.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>5. Good Styling is Architectural</h2>
          <p style={styles.p}>
            It’s easy to dismiss styling as a final, decorative step, but this component argues otherwise. It uses a single, co-located <code>styles</code> object where every visual choice is deliberate and organized. The highlight color for a selected item (<code>selectedListItem</code>), the monospace font for code snippets (<code>codeBlock</code>), the subtle borders—it’s all part of a unified system.
          </p>
          <p style={styles.p}>
            This treats the user interface not as a coat of paint, but as a core part of the component's architecture. It communicates that how something *looks* and *feels* is just as important as how it *works*. This holistic approach leads to a more cohesive, intuitive, and ultimately more professional user experience.
          </p>
        </section>

        <footer style={styles.footer}>
          <p style={styles.p}>
            Looking at this schema explorer, it's clear that building great software is about more than just writing code that executes. It's about building systems that clarify, guide, and communicate. Each component, each function, is an opportunity to turn complexity into a conversation.
          </p>
          <p style={styles.p}>
            The real takeaway isn't a specific React pattern, but a mindset: that our primary job is to be relentless editors of complexity. So, the next time you sit down to code, ask yourself not just "What am I building?" but "What am I making clear?"
          </p>
        </footer>
      </article>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Georgia, serif',
    lineHeight: 1.7,
    color: '#333333',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
  },
  article: {
    maxWidth: '740px',
    width: '100%',
  },
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '1rem',
    color: '#111111',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  h2: {
    fontSize: '1.8rem',
    fontWeight: 700,
    lineHeight: 1.3,
    marginTop: '3rem',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #eeeeee',
    color: '#111111',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  intro: {
    fontSize: '1.2rem',
    color: '#555555',
    marginBottom: '3rem',
  },
  p: {
    fontSize: '1.1rem',
    marginBottom: '1.5rem',
  },
  section: {
    marginBottom: '2rem',
  },
  blockquote: {
    borderLeft: '3px solid #0056b3',
    paddingLeft: '1.5rem',
    margin: '2rem 0',
    fontStyle: 'italic',
    color: '#555555',
    fontSize: '1.2rem',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#eeeeee',
    padding: '0.2em 0.4em',
    borderRadius: '3px',
    fontSize: '90%',
  },
  footer: {
    marginTop: '4rem',
    paddingTop: '2rem',
    borderTop: '1px solid #eeeeee',
  },
};

export default SchemaExplorer;