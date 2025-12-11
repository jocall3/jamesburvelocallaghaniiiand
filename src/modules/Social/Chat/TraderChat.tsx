```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, List, ListItem, ListItemText, Avatar, Typography, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
}

const TraderChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock data for initial messages (replace with real-time data source)
    const initialMessages: ChatMessage[] = [
      { id: uuidv4(), sender: 'TraderA', message: 'Hey everyone! Watching TSLA today.', timestamp: new Date() },
      { id: uuidv4(), sender: 'TraderB', message: 'Yeah, me too! Hoping for a breakout.', timestamp: new Date() },
    ];
    setMessages(initialMessages);

    // Scroll to the bottom of the chat box on initial load and whenever new messages are added
    scrollToBottom();
  }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const newChatMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'You', // Replace with the actual logged-in user's ID/name
        message: newMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, newChatMessage]);
      setNewMessage('');

      // Simulate broadcasting the message to other traders (replace with a real-time messaging system)
      console.log('Broadcasting message:', newChatMessage);
    }
  };

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  return (
    <Box
      sx={{
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ccc',
        borderRadius: '5px',
        overflow: 'hidden',
      }}
    >
      {/* Chat Display Area */}
      <Box
        ref={chatBoxRef}
        sx={{
          flexGrow: 1,
          padding: '10px',
          overflowY: 'auto',
        }}
      >
        <List>
          {messages.map((message) => (
            <ListItem key={message.id} alignItems="flex-start">
              <Avatar sx={{ mr: 1 }}>
                <AccountCircle />
              </Avatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {message.sender}
                  </Typography>
                }
                secondary={
                  <React.Fragment>
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {message.message}
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Message Input Area */}
      <Box sx={{ padding: '10px', borderTop: '1px solid #ccc' }}>
        <TextField
          fullWidth
          placeholder="Type your message..."
          variant="outlined"
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSendMessage} aria-label="send">
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default TraderChat;
```