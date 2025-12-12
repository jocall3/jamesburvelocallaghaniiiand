import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import ChatInput from './components/ChatInput';
import ConversationHistory from './components/ConversationHistory';
import AIInsightCard from './components/AIInsightCard';
import { fetchAIInsights, sendMessageToAI } from './api'; // Assuming these functions exist
import { Message } from './types'; // Assuming Message type is defined

const CoPilotDashboardView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [aiInsights, setAIInsights] = useState<any[]>([]); // Adjust type as needed

  useEffect(() => {
    // Fetch initial AI insights when the component mounts
    const loadInsights = async () => {
      setIsLoadingInsights(true);
      try {
        const insights = await fetchAIInsights();
        setAIInsights(insights);
      } catch (error) {
        console.error("Error fetching AI insights:", error);
        // Handle error appropriately, e.g., show a message to the user
      } finally {
        setIsLoadingInsights(false);
      }
    };
    loadInsights();
  }, []);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Simulate sending message to AI and getting a response
      // In a real app, this would involve an API call
      const aiResponse = await sendMessageToAI(inputText);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.reply, // Assuming the API returns an object with a 'reply' field
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      // Optionally, update AI insights based on the conversation
      // For example, if the user asks for a specific report, fetch it
    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Financial Copilot Dashboard
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <ConversationHistory messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Proactive AI Insights
          </Typography>
          {isLoadingInsights ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(70vh - 48px)' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {aiInsights.length > 0 ? (
                aiInsights.map((insight, index) => (
                  <Grid item xs={12} key={index}>
                    <AIInsightCard title={insight.title} description={insight.description} action={insight.action} />
                  </Grid>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No AI insights available at the moment.
                </Typography>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CoPilotDashboardView;