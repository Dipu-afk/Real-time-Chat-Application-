import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FiSend, FiSun, FiMoon } from 'react-icons/fi';

const WS_URL = 'ws://localhost:5000';
const API_URL = 'http://localhost:5000/api';

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isJoined, setIsJoined] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Check for saved username and theme preference
    const savedUsername = localStorage.getItem('username');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Initialize WebSocket connection
    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, {
              ...data,
              id: data.id || Date.now(),
              timestamp: data.timestamp || new Date().toISOString()
            }]);
            break;
          case 'system':
            setMessages(prev => [...prev, { 
              ...data, 
              id: Date.now(),
              timestamp: new Date().toISOString()
            }]);
            break;
          case 'typing':
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              if (data.isTyping) {
                newSet.add(data.username);
              } else {
                newSet.delete(data.username);
              }
              return newSet;
            });
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('username', username);
      setIsJoined(true);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'join',
          username: username.trim()
        }));
      }
      // Fetch message history after joining
      fetch(`${API_URL}/messages`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(error => console.error('Error fetching messages:', error));
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && username && wsRef.current?.readyState === WebSocket.OPEN) {
      const newMessage = {
        type: 'message',
        content: message.trim(),
        username: username,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };

      // Add message to local state immediately
      setMessages(prev => [...prev, newMessage]);

      // Send message to server
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: message.trim()
      }));

      setMessage('');
    }
  };

  const handleTyping = () => {
    if (!isTyping && wsRef.current?.readyState === WebSocket.OPEN) {
      setIsTyping(true);
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          isTyping: false
        }));
      }
    }, 1000);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
            Welcome to Chat App
          </h2>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Type your username here..."
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-500 text-white p-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Start Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Chat Room</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as: {username}</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <FiSun className="text-yellow-500" /> : <FiMoon className="text-gray-600" />}
            </button>
          </div>

          <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`animate-fade-in ${
                  msg.type === 'system'
                    ? 'text-center text-gray-500 dark:text-gray-400 text-sm'
                    : msg.username === 'ChatBot'
                    ? 'flex justify-start'
                    : msg.username === username
                    ? 'flex justify-end'
                    : 'flex justify-start'
                }`}
              >
                {msg.type !== 'system' && (
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.username === 'ChatBot'
                        ? 'bg-green-100 dark:bg-green-900 text-gray-800 dark:text-white border border-green-200 dark:border-green-800'
                        : msg.username === username
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1 flex items-center">
                      {msg.username === 'ChatBot' && (
                        <span className="mr-2 text-green-500">🤖</span>
                      )}
                      {msg.username === username ? 'You' : msg.username}
                    </div>
                    <div className="break-words">{msg.content}</div>
                    <div className="text-xs mt-1 opacity-75">
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </div>
                  </div>
                )}
                {msg.type === 'system' && (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-1 inline-block">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            {typingUsers.size > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic animate-fade-in">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleMessageSubmit} className="p-4 border-t dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Type your message here..."
              />
              <button
                type="submit"
                className="bg-primary-500 text-white p-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App; 