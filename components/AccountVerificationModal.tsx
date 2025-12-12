From 'Verify' to 'Verified': 4 UX Secrets Hidden in a Single React Component

We’ve all done it. Adding a new bank account to a service and being told to wait for two tiny deposits to show up. A few days later, you return, plug in the numbers—say, $0.12 and $0.47—and just like magic, you’re verified. It feels simple, almost trivial. But behind that seamless experience is a surprising amount of thoughtful design.

I recently stumbled upon a React component that handles this exact flow, and it was a masterclass in user experience engineering. It wasn't about flashy animations or clever micro-interactions. Instead, its brilliance was in the quiet, robust logic that anticipates a user's needs. Here are the four most impactful lessons I took away from it.

**1. Your UI Isn't a Page, It's a State Machine**

In the old days of the web, a multi-step process like this might have involved three different URLs. You’d click a button, the page would reload, you’d fill out more info, and so on. This component, however, does it all within a single modal.

The secret is a simple piece of state: `const [step, setStep] = useState('initiate');`. This one line of code turns the component into a mini state machine. The UI can be in an `initiate` state (explaining the process), a `confirm` state (asking for the deposit amounts), or a `success` state (celebrating the result).

By rendering different content based on the current `step`, the component guides the user through a journey without ever losing context. It’s a powerful reminder that great UI isn't about a collection of pages; it's about managing transitions between states gracefully.

**2. The Best User Flows Welcome Interruption**

What happens if the user starts the verification process, closes the browser, and only comes back two days later when the deposits have actually arrived? A naive implementation would force them to start all over again.

This component is smarter. When it loads, it checks the account's status from the server.

> If the `verification_status` is already `'pending_verification'`, the component skips the initial step and jumps directly to the confirmation screen.

This is a game-changer. It acknowledges that user journeys are not always linear. People get distracted, they have to wait for external events (like bank transfers), and your application should respect that. By syncing its own state with the "source of truth" from the backend, the UI meets the user exactly where they are, not where it wishes they were.

**3. Talk to the User, Not Just the Server**

There’s nothing more frustrating than filling out a form, hitting "Submit," and waiting ten seconds only to be told you made a mistake. This component avoids that pain by validating user input on the client-side, providing an immediate and tight feedback loop.

When the user enters the deposit amounts, a simple regular expression (`/^[0-9]*\.?[0-9]{0,2}$/`) ensures they can only type valid currency formats in real-time. Before submitting, another check confirms there are exactly two positive numbers.

This isn't just about preventing bad data from hitting your API. It's a form of respect for the user's time and attention. By catching errors before a network request is even made, the component feels faster, smarter, and more helpful.

**4. A Component Should Know How to Feed Itself**

A common pattern in React is for parent components to fetch all the data and "drip" it down to children as props. This can lead to components that are bloated with logic that isn't relevant to them.

This verification modal takes a different approach. When it opens, a `useEffect` hook fires off an API call to fetch the necessary data it needs to function, like the list of internal accounts the user can originate the deposits from.

This makes the component wonderfully self-contained and reusable. You can drop it anywhere in your application, and as long as you tell it which external account to verify, it handles the rest. It knows what it needs, and it knows how to get it. This principle of co-locating data fetching with the component that uses the data is a cornerstone of modern, scalable frontend architecture.

**Conclusion**

Looking at this single file, you see a story unfold—a story about a user's journey. It’s a story that anticipates pauses, corrects mistakes gently, and provides a clear path forward. The code shows that the most profound user experiences aren't always built with complex libraries or dazzling effects, but with a deep empathy for the user, expressed through clean, resilient state management.

It leaves me wondering: what "simple" component in your own application holds a surprising amount of hidden logic, and what can it teach you about the user's story?