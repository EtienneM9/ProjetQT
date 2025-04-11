import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { UserRoundSearchIcon } from 'lucide-react';

interface Message {
  _id: string;
  role: 'user' | 'bot';
  content: string;
  explanation?: string;
  createdAt: Date;
}

interface Chat {
  _id: string;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  currentChat: Chat | null;
  chats: Chat[];
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  fetchChats: () => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  clearCurrentChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data.chats);
    } catch (error) {
      console.error('Fetch chats error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadChat = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      // Clear current messages before loading new ones
      setMessages([]);
      
      // First fetch chat data
      // First fetch chat details
      console.log('Fetching chat details for:', chatId);
      const chatResponse = await fetch(`/api/chats/${chatId}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load chat');
      }

      const chatData = await chatResponse.json();
      console.log('Loaded chat data:', chatData);
      
      if (!chatData.chat) {
        throw new Error('Invalid chat data received');
      }

      // Update chat data first
      setCurrentChat(chatData.chat);
      console.log('Current chat set to:', chatData.chat);

      // Then fetch chat messages
      console.log('Fetching messages for chat:', chatId);
      const messagesResponse = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!messagesResponse.ok) {
        throw new Error('Failed to load messages');
      }

      const messagesData = await messagesResponse.json();
      console.log('Setting messages:', messagesData.messages);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error('Load chat error:', error);
      // Clean up state on error
      setMessages([]);
      setCurrentChat(null);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chat';
      console.error('Detailed error:', { 
        message: errorMessage, 
        chatId,
        statusCode: error instanceof Response ? error.status : undefined 
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const newUserMessage: Message = {
        _id: Date.now().toString() + '-user',
        role: 'user',
        content,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, newUserMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
          chatId: currentChat?._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const parsedResponse = data.choices[0].message.content;

      if (!parsedResponse || !parsedResponse.quickrep || !parsedResponse.explication) {
        throw new Error('Invalid response format from server');
      }

      const newBotMessage: Message = {
        _id: Date.now().toString() + '-bot',
        role: 'bot',
        content: parsedResponse.quickrep,
        explanation: parsedResponse.explication,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, newBotMessage]);

      // Update the current chat's last message
      if (currentChat) {
        setCurrentChat(prev => ({
          ...prev!,
          lastMessage: parsedResponse.quickrep,
          updatedAt: new Date()
        }));
      }

      // If this is a new chat, update the chat list and set current chat
      if (!currentChat) {
        await fetchChats();
        // Create new chat from response
        setCurrentChat({
          _id: data.chatId,
          title: content.slice(0, 50) + '...',
          lastMessage: parsedResponse.quickrep,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      // Remove the user message if the API call failed
      setMessages(prev => prev.slice(0, -1));
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentChat, fetchChats]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove chat from local state
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      // Clear current chat if it was deleted
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete chat');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentChat]);

  const clearCurrentChat = useCallback(() => {
    setIsLoading(true);
    setCurrentChat(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const value = {
    currentChat,
    chats,
    messages,
    isLoading,
    error,
    sendMessage,
    fetchChats,
    loadChat,
    deleteChat,
    clearCurrentChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
