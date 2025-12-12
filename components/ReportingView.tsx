import React from 'react';
import { Box, Typography, Divider, Paper, Container } from '@mui/material';

const ReportingView = () => {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 } }}>
                {/* Headline */}
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
                    From UI to API: 5 Hidden Lessons in a Single React Component
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
                    We deconstructed a simple reporting dashboard. What we found reveals the core truths of modern web development.
                </Typography>

                {/* Introduction */}
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                    We interact with them every day: sleek dashboards, interactive forms, and dynamic web pages. We click a button, and magic happens. But have you ever stopped to consider the intricate dance of logic, data, and error-handling that occurs just beneath that polished surface? We decided to do just that. By examining the code for a seemingly straightforward reporting component, we uncovered five powerful takeaways that aren't just about code—they're about the fundamental principles of building robust, user-friendly digital experiences.
                </Typography>

                <Divider sx={{ my: 4 }} />

                {/* Point 1 */}
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        1. Your App Doesn't Wait, and Neither Should Your Users
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        One of the first things you notice in the code is the heavy use of `async/await`. When a user requests a report, the app doesn't freeze and wait. It sends a request to the server and says, "Let me know when you're done." This is the essence of asynchronous programming.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        This is more than a technical detail; it's the bedrock of modern user experience. In a world of shrinking attention spans, a frozen interface is a dead interface. By handling long-running tasks like report generation in the background, the application remains fluid and responsive, allowing the user to continue interacting with other parts of the page. It’s a crucial reminder that great software respects the user's time.
                    </Typography>
                </Box>

                {/* Point 2 */}
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        2. Your Frontend is Just a Pretty Face (And That's a Good Thing)
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        The React component itself doesn't actually generate any reports or fetch data from a database. Instead, every significant action is a call to an external API. The frontend is responsible for one thing: presenting data and capturing user intent. All the heavy lifting—the business logic, the security, the data processing—is handled by a separate backend server.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        This separation of concerns is a cornerstone of scalable architecture. It allows teams to work independently on the frontend and backend, enables the same backend to power multiple clients (like a web app and a mobile app), and creates a more secure system by keeping sensitive operations off the client's machine. The UI might get all the attention, but its strength lies in knowing what *not* to do.
                    </Typography>
                </Box>

                {/* Point 3 */}
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        3. The Hidden Complexity: Juggling a Dozen States at Once
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        A quick glance reveals a flurry of `useState` hooks: `isLoading`, `reportRuns`, `reportTypes`, `selectedReportType`, `reportGenerationError`, and more. Each one tracks a tiny piece of the component's reality. Is the app currently fetching data? What did the user select from the dropdown? Did the last action result in an error?
                    </Typography>
                    <Box component="blockquote" sx={{ borderLeft: 4, borderColor: 'primary.main', pl: 2, my: 2, fontStyle: 'italic' }}>
                        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                            "A component's state is its memory. And in this case, it has to remember a lot."
                        </Typography>
                    </Box>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        This highlights a profound challenge in frontend development: state management. Even in a simple component, the number of variables to track can be surprisingly high. This is why entire libraries and patterns (like Redux, Zustand, or Context API) exist—to tame this inherent complexity. It’s a testament to the fact that creating a "simple" user interface is often anything but.
                    </Typography>
                </Box>

                {/* Point 4 */}
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        4. Plan for Failure: Why Your Code's 'What Ifs' Matter Most
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        The code isn't just a "happy path" script. It's littered with `try...catch` blocks, loading spinners, and conditional rendering for error messages. The developer didn't just assume the report would generate successfully; they planned for what would happen if it didn't.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        This practice, known as defensive programming, is what separates amateur code from professional, production-ready software. It's about anticipating problems—a slow network, a server error, invalid user input—and providing a graceful experience instead of a crash or a confusing blank screen. The most robust applications aren't the ones where nothing goes wrong, but the ones that are designed to handle it when it inevitably does.
                    </Typography>
                </Box>

                {/* Point 5 */}
                <Box sx={{ my: 4 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        5. Speak the Same Language: How TypeScript Prevents API Misunderstandings
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        Throughout the file, you see `interface` definitions like `ReportRun` and `BalanceTransaction`. These aren't just comments; they are TypeScript types that create a strict "contract" for what data should look like when it comes from the API. The code expects `report.created` to be a number and `report.result.url` to be a string.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        This is incredibly powerful. It eliminates a whole class of bugs caused by data mismatches (e.g., trying to format a date that is unexpectedly `null`). It makes the code self-documenting and allows developers to work with more confidence and speed. It ensures that the frontend and backend teams are speaking the exact same language, preventing costly misunderstandings down the line.
                    </Typography>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Conclusion */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Beneath the Surface
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                        A single component, a single screen, yet it contains a microcosm of the principles that govern modern software engineering: asynchronicity, architectural patterns, state management, resilience, and type safety. It’s a powerful reminder that the simplest user interfaces are often built upon a foundation of deep and thoughtful complexity.
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 'bold', mt: 3 }}>
                        So, the next time you click a button on a website, what hidden dance of code and logic will you imagine playing out just beneath the surface?
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default ReportingView;