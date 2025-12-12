import React from 'react';

const BlogPost = () => {
  return (
    <article>
      <header>
        <h1>Beyond the Grid: 4 Unexpected Lessons from a Single React Data Table</h1>
      </header>
      <p>
        If you're a developer, you've built a data table. It's a rite of passage. At first, it seems simple: just map over an array and spit out some rows. But then the feature requests roll in. "Can we sort by this column?" "Can we search the descriptions?" "Can we filter by date?" Suddenly, your simple component balloons into a complex beast of state management and event handling.
      </p>
      <p>
        We recently came across a React component for a transaction list, and buried within its clean, functional code were some powerful patterns for tackling this exact complexity. It’s a masterclass in building interactive, data-heavy UI. Here are the four most impactful takeaways you can steal for your next project.
      </p>

      <section>
        <h2>1. Your UI Library Is More Flexible Than You Think</h2>
        <p>
          We often treat UI libraries like Ant Design or Material-UI as rigid sets of pre-built components. We take what they give us and call it a day. But the best libraries offer "escape hatches"—powerful ways to inject your own logic and components into their structure.
        </p>
        <p>
          This component’s most brilliant feature is its custom search filter. Instead of using a default, generic filter, it uses Ant Design's <code>filterDropdown</code> property to render a completely custom React component. This dropdown contains a search input, a "Search" button, and a "Reset" button, giving the user full control right where they need it.
        </p>
        <p>
          The lesson here is profound: don't just use your tools, interrogate them. Dig into the documentation for those less-common props. The power to create a truly bespoke user experience is often hiding just one property away.
        </p>
      </section>

      <section>
        <h2>2. Write Functions That Build Configurations, Not Just Components</h2>
        <p>
          As developers, we're trained to abstract repeating UI into reusable components. But what about repeating *logic* or *configuration*? This component introduces a subtle but powerful pattern: a helper function, <code>getColumnSearchProps</code>, that doesn't return JSX. Instead, it returns a configuration object.
        </p>
        <p>
          This function takes a column name (<code>dataIndex</code>) and returns all the props needed to make that column searchable—the custom filter dropdown, the filter icon, the filtering logic, everything. This configuration object is then spread directly into the column definitions.
        </p>
        <blockquote>
          <p>
            This is the DRY (Don't Repeat Yourself) principle applied at the configuration level. It keeps the column definitions clean, declarative, and incredibly easy to maintain. Need to change the search behavior? You only have to do it in one place.
          </p>
        </blockquote>
      </section>

      <section>
        <h2>3. The Surprisingly Elegant Regex Trick for Highlighting Search Terms</h2>
        <p>
          Creating a great search experience means giving the user visual feedback. Highlighting the search term within the results is a classic way to do this. The implementation here is a beautiful piece of functional programming and regular expression wizardry.
        </p>
        <p>
          Instead of a complex loop, the code uses a single line: <code>text.split(new RegExp(`(?<=(.))(${'searchText'})`, 'i'))</code>. This might look intimidating, but it's a clever way to split a string *by* the search term while keeping the term itself for later use. It then maps over the resulting array to reconstruct the string, wrapping the matched term in a span for styling.
        </p>
        <p>
          It's a small detail, but it's a reminder that a deep understanding of your language's core features (like JavaScript's RegExp) can often lead to more elegant and efficient solutions than importing yet another library.
        </p>
      </section>

      <section>
        <h2>4. Master the Separation of "Data" Props and "View" State</h2>
        <p>
          Effective state management is what separates a good React component from a great one. This component makes a crucial distinction between two types of state.
        </p>
        <p>
          First, there's the "data" that comes from outside, passed in as the <code>transactions</code> prop. This is the source of truth. Second, there's the "view state"—things like <code>searchText</code> and <code>searchedColumn</code>. This state doesn't change the underlying data; it only changes how that data is *presented* to the user.
        </p>
        <p>
          The component uses <code>useEffect</code> to sync its internal, display-ready data (<code>dataSource</code>) whenever the incoming <code>transactions</code> prop changes. This clear separation makes the component predictable, easier to debug, and highly reusable. It’s a foundational React concept executed with textbook precision.
        </p>
      </section>

      <footer>
        <p>
          A single component can be a treasure trove of learning if you look closely enough. It’s not just about the final UI; it’s about the patterns, the abstractions, and the small, clever decisions that lead to robust and maintainable code.
        </p>
        <p>
          So, the next time you're building what seems like a "simple" feature, ask yourself: what hidden patterns in your own codebase could you elevate into powerful, reusable abstractions?
        </p>
      </footer>
    </article>
  );
};

export default BlogPost;