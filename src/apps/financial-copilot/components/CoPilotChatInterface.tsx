```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import clsx from 'clsx';
import { styled } from '@mui/material/styles';

// Mock API for demonstration purposes
const mockApiCall = async (message: string): Promise<{ response: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (message.toLowerCase().includes('balance')) {
        resolve({ response: 'Your current account balance is $15,450.75.' });
      } else if (message.toLowerCase().includes('transaction')) {
        resolve({ response: 'Your last transaction was a purchase of $55.20 at "Coffee Shop" yesterday.' });
      } else if (message.toLowerCase().includes('budget')) {
        resolve({ response: 'Your monthly budget for groceries is currently $400. You have $150 remaining.' });
      } else {
        resolve({ response: `I received your message: "${message}". How can I assist you further with your finances?` });
      }
    }, 1500); // Simulate network latency
  });
};

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '70vh', // Adjust height as needed
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const MessageBubble = styled(Box)<{ isUser?: boolean }>(({ theme, isUser }) => ({
  display: 'inline-block',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  maxWidth: '80%',
  wordWrap: 'break-word',
  textAlign: isUser ? 'right' : 'left',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.action.hover,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  marginLeft: isUser ? 'auto' : 0,
  marginRight: isUser ? 0 : 'auto',
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

const StyledTextField = styled(TextField)({
  flexGrow: 1,
  marginRight: '8px',
});

interface Message {
  text: string;
  isUser: boolean;
}

const CoPilotChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const newUserMessage: Message = { text: inputValue, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await mockApiCall(inputValue);
      const aiMessage: Message = { text: response.response, isUser: false };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { text: 'Sorry, I encountered an error. Please try again.', isUser: false };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      <MessagesArea>
        {messages.map((message, index) => (
          <MessageBubble key={index} isUser={message.isUser}>
            <Typography variant="body1">{message.text}</Typography>
          </MessageBubble>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </MessagesArea>
      <InputArea>
        <StyledTextField
          placeholder="Ask your financial questions..."
          variant="outlined"
          fullWidth
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <IconButton
          color="primary"
          aria-label="send message"
          onClick={handleSendMessage}
          disabled={isLoading || inputValue.trim() === ''}
        >
          <SendIcon />
        </IconButton>
      </InputArea>
    </ChatContainer>
  );
};

export default CoPilotChatInterface;
```