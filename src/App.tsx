import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Database, Menu, LogIn } from 'lucide-react';
import { supabase } from './lib/supabase';
import { getGeminiResponse } from './lib/gemini';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSessions();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSessions();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession);
    }
  }, [currentSession]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

      if (error) {
        setAuthError(error.message);
      } else if (isSignUp) {
        setAuthError('Check your email for the confirmation link.');
      }
    } catch (err) {
      setAuthError('An unexpected error occurred. Please try again.');
    }

    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessions([]);
    setMessages([]);
    setCurrentSession(null);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
      if (data.length > 0 && !currentSession) {
        setCurrentSession(data[0].id);
      }
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const createNewSession = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ 
        title: 'New Chat',
        user_id: user?.id 
      }])
      .select()
      .single();

    if (!error && data) {
      setSessions([data, ...sessions]);
      setCurrentSession(data.id);
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentSession) return;

    setLoading(true);
    
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          session_id: currentSession,
          content: newMessage,
          role: 'user'
        }
      ])
      .select()
      .single();

    if (!messageError && messageData) {
      setMessages([...messages, messageData]);
      setNewMessage('');

      const assistantResponse = await getGeminiResponse(newMessage);

      const { data: assistantMessageData } = await supabase
        .from('messages')
        .insert([
          {
            session_id: currentSession,
            content: assistantResponse,
            role: 'assistant'
          }
        ])
        .select()
        .single();

      if (assistantMessageData) {
        setMessages(prev => [...prev, assistantMessageData]);
      }
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-oracle-lightgray flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="flex flex-col items-center gap-4 mb-8">
            <img 
              src="src\Oracle Academy logo higher res rgb.png" 
              alt="Oracle Academy"
              className="h-16 w-auto"
            />
            <h1 className="text-2xl font-bold text-oracle-gray">Oracle Support Assistant</h1>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className={`p-3 rounded-lg text-sm ${
                authError.includes('Check your email') 
                  ? 'bg-blue-50 text-oracle-red'
                  : 'bg-red-50 text-oracle-red'
              }`}>
                {authError}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-oracle-gray">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oracle-red focus:ring-oracle-red"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-oracle-gray">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-oracle-red focus:ring-oracle-red"
                required
                minLength={6}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={authLoading}
                className="flex-1 bg-oracle-red text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-oracle-darkred transition-colors disabled:opacity-50"
              >
                <LogIn size={20} />
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="flex-1 bg-gray-200 text-oracle-gray rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors"
              >
                {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-oracle-lightgray">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-white border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="src\Oracle Academy logo higher res rgb.png" 
              alt="Oracle Academy"
              className="h-12 w-auto"
            />
          </div>
          <button
            onClick={createNewSession}
            className="w-full bg-oracle-red text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-oracle-darkred transition-colors"
          >
            <MessageCircle size={20} />
            New Chat
          </button>
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-200 text-oracle-gray rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSession(session.id)}
              className={`w-full p-4 text-left hover:bg-oracle-lightgray transition-colors ${
                currentSession === session.id ? 'bg-oracle-lightgray' : ''
              }`}
            >
              <div className="font-medium truncate text-oracle-gray">{session.title}</div>
              <div className="text-sm text-gray-500">
                {format(new Date(session.created_at), 'MMM d, yyyy')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-oracle-lightgray rounded-lg transition-colors"
          >
            <Menu size={24} className="text-oracle-gray" />
          </button>
          <div className="flex items-center gap-2">
            <Database size={24} className="text-oracle-red" />
            <h1 className="text-xl font-semibold text-oracle-gray">Oracle Support Assistant</h1>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            {user.email}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-oracle-red text-white'
                    : 'bg-white border'
                }`}
              >
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {format(new Date(message.created_at), 'HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about Oracle databases, technologies, or issues..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-oracle-red"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-oracle-red text-white rounded-lg px-6 py-2 flex items-center gap-2 hover:bg-oracle-darkred transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;