"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { matchUserInputToCategory, getCategoryDisplayText } from "@/utils/preferenceCategories";

interface Message {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface OnboardingData {
  ageRange?: string;
  coffeePersonality?: string;
  socialEnergy?: string;
  conversationTopics?: string;
  groupPreference?: string;
  locationPreference?: string;
  timePreference?: string;
  socialGoals?: string;
  meetingFrequency?: string;
  completed?: boolean;
}

const QUESTIONS = [
  "Per iniziare, dimmi: sei giovane (18-24), adulto (25-40), o più maturo? 🎂",
  "Come preferisci il tuo caffè? Veloce tipo espresso, normale, o con calma tipo cappuccino? ☕",
  "Quanto sei socievole? Timido e riservato, normale, o super estroverso? 😊",
  "Di cosa ti piace parlare? Lavoro, hobby, storie di vita, attualità, o arte? 💬",
  "Preferisci incontrare una persona sola, un piccolo gruppo, o tante persone insieme? 👥",
  "Che ambiente preferisci? Tranquillo, vivace, all'aperto, o posto per lavorare? 🏪",
  "Come organizzi i tuoi incontri? Spontaneo, con un po' di preavviso, o tutto pianificato? ⏰",
  "Cosa speri di ottenere? Nuove amicizie, networking professionale, divertimento, o imparare cose nuove? 🎯",
  "Con che frequenza vorresti incontrare persone? Spesso, una volta a settimana, ogni tanto, o raramente? 📅"
];

const CATEGORIES = [
  'ageRange',
  'coffeePersonality', 
  'socialEnergy',
  'conversationTopics',
  'groupPreference',
  'locationPreference',
  'timePreference',
  'socialGoals',
  'meetingFrequency'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { shouldRedirect, isLoading: authLoading } = useRequireAuth();

  // Simple state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start chat when user is available
  useEffect(() => {
    if (user && !chatStarted) {
      console.log('🤖 STARTING CHAT WITH:', user.firstName);
      setChatStarted(true);
      
      // Welcome message
      const welcomeMsg: Message = {
        id: 'welcome',
        content: `Ciao ${user.firstName}! 👋 Sono Caffè, il tuo assistente di Caffis! ☕`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages([welcomeMsg]);
      
      // First question after delay
      setTimeout(() => {
        const firstQuestion: Message = {
          id: 'q0',
          content: QUESTIONS[0],
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, firstQuestion]);
      }, 2000);
    }
  }, [user, chatStarted]);

  const addBotMessage = (content: string, delay: number = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }, delay);
  };

  const processUserResponse = (userInput: string) => {
    const categoryName = CATEGORIES[currentQuestionIndex];
    const matched = matchUserInputToCategory(userInput, categoryName);
    
    if (!matched) {
      // Invalid response - ask again
      addBotMessage(`Non ho capito bene la tua risposta. ${QUESTIONS[currentQuestionIndex]}`, 1000);
      return;
    }
    
    // Valid response - save and continue
    const updatedData = { ...onboardingData, [categoryName]: matched };
    setOnboardingData(updatedData);
    
    // Give confirmation
    const displayText = getCategoryDisplayText(categoryName, matched);
    addBotMessage(`Perfetto! ✅`, 1000);
    
    // Move to next question or complete
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;
      
      if (nextIndex >= QUESTIONS.length) {
        // All questions completed
        completeOnboarding({ ...updatedData, completed: true });
      } else {
        // Next question
        setCurrentQuestionIndex(nextIndex);
        addBotMessage(QUESTIONS[nextIndex], 1500);
      }
    }, 2500);
  };

  const completeOnboarding = async (data: OnboardingData) => {
    addBotMessage("🎉 Perfetto! Il tuo profilo è completo!", 1000);
    
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('caffis_auth_token') || localStorage.getItem('token');
        
        if (token) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/preferences`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            updateUser({ ...user, onboardingCompleted: true });
          }
        }
        
        setIsComplete(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
        
      } catch (error) {
        console.error('Error saving preferences:', error);
        router.push('/dashboard');
      }
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || isComplete || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    processUserResponse(currentMessage.trim());
    setCurrentMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-amber-800">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">
            ☕ Benvenuto in Caffis!
          </h1>
          <p className="text-amber-700">
            Conosciamoci meglio per trovarti i compagni di caffè perfetti
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-amber-200 rounded-full h-2">
            <div 
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentQuestionIndex / QUESTIONS.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-amber-600 mt-2">
            {currentQuestionIndex}/{QUESTIONS.length} - {Math.round((currentQuestionIndex / QUESTIONS.length) * 100)}% completato
          </p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-xs ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    message.sender === 'bot' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    {message.sender === 'bot' ? '☕' : user?.firstName?.[0] || 'U'}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm">
                    ☕
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isComplete && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi la tua risposta..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  className="px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invia
                </button>
              </div>
            </div>
          )}
          
          {/* Completion Message */}
          {isComplete && (
            <div className="border-t border-gray-200 p-6 text-center">
              <div className="animate-pulse">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-amber-800 font-semibold">
                  Profilo completato! Reindirizzamento al dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}