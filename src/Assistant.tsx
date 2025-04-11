import React, { useState, useRef, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { Mic, MicOff, Send, Volume2, VolumeX, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';

export default function Assistant() {
  // Local state for UI
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);
  
  // References
  const recognitionRef = useRef<(typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition) | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Get auth and chat context
  const { user } = useAuth();
  const { 
    messages, 
    chats,
    currentChat,
    isLoading,
    error,
    sendMessage,
    fetchChats,
    loadChat,
    deleteChat,
    clearCurrentChat
  } = useChat();

  // Load chat history on component mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Auto-scroll to bottom when messages change or chat is loaded
  useEffect(() => {
    if (chatContainerRef.current && messages?.length > 0) {
      const scrollContainer = chatContainerRef.current;
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [messages, currentChat]);

  // Voice recognition handling
  const handleVoiceInput = () => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'fr-FR';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current!.onresult = (event: any) => {
          const transcript: string = event.results[0][0].transcript;
          setUserInput(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.start();
        setIsListening(true);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  };

  // Voice synthesis handling
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);

      const motherlyVoice = voices.find(v => 
        (v.name.includes("française") || v.name.includes("French")) && 
        (v.name.toLowerCase().includes("female") || v.name.includes("Amélie") || 
         v.name.includes("Sophie") || v.name.includes("Marie"))
      ) || 
      voices.find(v => 
        v.name.includes("Google UK English Female") ||
        v.name.includes("Samantha") ||
        v.name.includes("Victoria") ||
        v.name.includes("Karen")
      );

      if (motherlyVoice) {
        utterance.voice = motherlyVoice;
      }

      utterance.lang = 'fr-FR';
      utterance.rate = 0.85;
      utterance.pitch = 1.2;
      utterance.volume = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!userInput.trim() || isLoading) return;
    await sendMessage(userInput);
    setUserInput('');
  };

  // Handle chat selection
  const handleChatSelect = async (chatId: string) => {
    console.log('Selected chat ID:', chatId);
    await loadChat(chatId);
    setIsHistoryOpen(false);
  };

  // Handle new chat
  const handleNewChat = () => {
    clearCurrentChat();
    setIsHistoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 pt-16">
      <div className="relative mx-auto">
        {/* Chat history sidebar - fixed to left edge */}
        <div className={`fixed left-0 top-16 bottom-0 bg-white/95 backdrop-blur-sm shadow-2xl transition-all duration-300 overflow-y-auto rounded-xl ${
          isHistoryOpen ? 'w-72' : 'w-0'
        }`}>
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg mb-4 hover:bg-purple-700 transition-colors"
            >
              Nouvelle conversation
            </button>
            <div className="space-y-2">
              {(chats ?? []).map((chat) => (
                <div 
                  key={chat._id}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                    currentChat?._id === chat._id ? 'bg-purple-100' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleChatSelect(chat._id)}
                >
                  <div className="flex-1 truncate">
                    <p className="font-medium">{chat.title}</p>
                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat._id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main chat container */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            {/* Chat header */}
            <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
              <button
                onClick={() => isHistoryOpen ? setIsHistoryOpen(false) : setIsHistoryOpen(true)}
                className="text-white hover:text-purple-200 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold">
                {currentChat?.title || 'Nouvelle conversation'}
              </h1>
              <div className="w-6" /> {/* Spacer for alignment */}
            </div>

            {/* Messages container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto space-y-4 p-6 h-[calc(80vh-8rem)]"
            >
              {/* Loading state */}
              {isLoading && messages.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-2 text-purple-600">Chargement des messages...</span>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-lg">Pas de messages</p>
                  <p className="text-sm">Commencez une nouvelle conversation !</p>
                </div>
              )}
              {/* Error state */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <p>{error}</p>
                </div>
              )}

              {/* Messages */}
              {!isLoading && messages.length > 0 && messages.map((message) => (
                <div key={message._id} className="flex flex-col">
                  <div 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                        message.role === 'user' 
                          ? 'bg-purple-500 text-white ml-4' 
                          : 'bg-white border-2 border-purple-100 mr-4'
                      }`}
                    >
                      {message.role === 'bot' ? (
                        <TypeAnimation
                          sequence={[message.content]}
                          wrapper="p"
                          speed={50}
                          cursor={false}
                        />
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                  {message.role === 'bot' && message.explanation && (
                    <button
                      onClick={() => {
                        setSelectedExplanation(message.explanation!);
                        setIsPanelOpen(true);
                      }}
                      className="self-start mt-2 text-sm text-purple-600 hover:text-purple-800 underline ml-4"
                    >
                      Voir l'explication
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Input section */}
            {isLoading && (
              <div className="flex justify-center items-center py-4 bg-purple-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-2 text-purple-600">En train de réfléchir...</span>
              </div>
            )}
            <div className="p-4 border-t border-purple-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Pose ta question ici..."
                  className="flex-1 p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none shadow-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={handleVoiceInput}
                  className={`p-4 rounded-xl ${
                    isListening ? 'bg-red-500' : 'bg-purple-500'
                  } text-white hover:opacity-90 transition-opacity shadow-sm`}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <button
                  onClick={handleSubmit}
                  className={`p-4 rounded-xl bg-yellow-400 text-gray-800 hover:bg-yellow-500 transition-colors shadow-sm ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isLoading}
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation panel - fixed to right edge */}
        <div className={`fixed right-0 top-16 bottom-0 bg-white/95 backdrop-blur-sm shadow-2xl transition-all duration-300 overflow-hidden rounded-xl ${
          isPanelOpen ? 'w-96' : 'w-0'
        }`}>
          
          {selectedExplanation && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <button
                onClick={() => isPanelOpen ? setIsPanelOpen(false) : setIsPanelOpen(true)}
                className="text-blue hover:text-purple-200 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-purple-800">Explications</h3>
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speakText(selectedExplanation)}
                  className={`p-3 rounded-lg ${
                    isSpeaking ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                  } hover:opacity-80 transition-opacity`}
                >
                  {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>
              <div className="prose prose-purple max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 bg-white p-6 rounded-xl border border-purple-100 shadow-inner">
                  {selectedExplanation}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
