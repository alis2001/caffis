"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { smartMatchUserInput, getSmartConfirmation, getCategoryDisplayText } from "@/utils/preferenceCategories";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Sparkles, Coffee, MessageCircle, VolumeX, Volume2, ArrowRight, Shield } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  isTranscribing?: boolean;
}

interface OnboardingData {
  ageRange?: string;
  coffeePersonality?: string;
  socialEnergy?: string;
  conversationTopics?: string;
  groupPreference?: string;
  locationPreference?: string;
  socialGoals?: string;
  meetingFrequency?: string;
  completed?: boolean;
}

// Speech Recognition Interface
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onspeechstart: () => void;
  onspeechend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const INTRODUCTION_MESSAGES = [
  "Sono qui per aiutarti a creare il tuo profilo perfetto su Caffis! ✨",
  "Ti farò alcune domande per capire le tue preferenze e trovare i compagni di caffè ideali per te. Ci vorranno solo 2-3 minuti! 🕐",
  "🎤 Puoi rispondere scrivendo o parlando - clicca il microfono per usare la voce!"
];

const QUESTIONS = [
  "Per iniziare, dimmi: che età hai? Sei giovane (18-24), adulto (25-40), o più maturo (40+)? 🎂",
  "Come preferisci il tuo caffè? Veloce tipo espresso, normale, o con calma tipo cappuccino? ☕",
  "Quanto sei socievole? Timido e riservato, normale, o super estroverso? 😊",
  "Di cosa ti piace parlare? Lavoro, hobby, storie di vita, attualità, o arte? 💬",
  "Preferisci incontrare una persona sola, un piccolo gruppo (3-4), o tante persone insieme? 👥",
  "Che ambiente preferisci? Tranquillo, vivace, all'aperto, o posto per lavorare? 🏪",
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
  'socialGoals',
  'meetingFrequency'
];

export default function VoiceOnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { shouldRedirect, isLoading: authLoading } = useRequireAuth();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [chatPhase, setChatPhase] = useState<'greeting' | 'intro' | 'questions' | 'complete'>('greeting');

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isRecordingSupported, setIsRecordingSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [confidence, setConfidence] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializeRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsRecordingSupported(true);
        
        const recognition = new SpeechRecognition();
        
        // Optimize for Italian language
        recognition.lang = 'it-IT';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        // Event handlers
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsListening(true);
          setVoiceError("");
          setInterimTranscript("");
        };

        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
          setInterimTranscript("");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;

            if (event.results[i].isFinal) {
              final += transcript;
              setConfidence(confidence);
              console.log(`🎯 Final transcript: "${transcript}" (confidence: ${confidence})`);
            } else {
              interim += transcript;
            }
          }

          setInterimTranscript(interim);
          
          if (final) {
            setFinalTranscript(final);
            setCurrentMessage(final);
            
            // Auto-stop listening after getting final result
            setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
            }, 500);
          }

          // Clear silence timeout on speech
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Set new silence timeout
          silenceTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              console.log('🔇 Stopping due to silence');
              recognitionRef.current.stop();
            }
          }, 3000); // Stop after 3 seconds of silence
        };

        recognition.onerror = (event) => {
          console.error('🚨 Speech recognition error:', event.error);
          setVoiceError(`Errore: ${event.error}`);
          setIsListening(false);
          
          // Handle specific errors
          if (event.error === 'no-speech') {
            setVoiceError("Non ho sentito nulla. Prova di nuovo!");
          } else if (event.error === 'audio-capture') {
            setVoiceError("Problema con il microfono. Controlla le autorizzazioni.");
          } else if (event.error === 'not-allowed') {
            setVoiceError("Autorizzazione microfono negata. Abilita l'accesso al microfono.");
          }
        };

        recognition.onspeechstart = () => {
          console.log('🗣️ Speech detected');
        };

        recognition.onspeechend = () => {
          console.log('🤐 Speech ended');
        };

        recognitionRef.current = recognition;
      } else {
        console.warn('🚨 Speech Recognition not supported');
        setIsRecordingSupported(false);
      }
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // Voice controls
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setVoiceError("");
      setInterimTranscript("");
      setFinalTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript]);

  // Redirect if not authenticated
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  // Initialize chat flow ONCE
  useEffect(() => {
    if (user && !authLoading && !initializeRef.current) {
      initializeRef.current = true;
      console.log('🤖 Starting voice onboarding for:', user.firstName);
      startChatFlow();
    }
  }, [user, authLoading]);

  const getSuggestions = (category: string): string => {
    const suggestions = {
      'ageRange': 'Prova a dirmi semplicemente la tua età numerica (es: "ho 25 anni") o una fascia (es: "sono giovane")',
      'coffeePersonality': 'Dimmi se preferisci caffè "veloce", "normale" o "lento"',
      'socialEnergy': 'Puoi dire "timido", "normale" o "socievole"',
      'conversationTopics': 'Di cosa parlare: "lavoro", "hobby", "storie personali", "news" o "arte"?',
      'groupPreference': 'Quante persone: "una sola", "piccolo gruppo" o "tante persone"?',
      'locationPreference': 'Che posto: "tranquillo", "vivace", "all\'aperto" o "per lavorare"?',
      'socialGoals': 'Cosa cerchi: "amicizie", "lavoro", "divertimento" o "imparare"?',
      'meetingFrequency': 'Frequenza: "spesso", "settimanale", "ogni tanto" o "raramente"?'
    };
    return suggestions[category] || 'Prova a rispondere in modo più semplice 😊';
  };

  const addMessage = (content: string, sender: 'bot' | 'user' = 'bot') => {
    const newMessage: Message = {
      id: `${sender}-${Date.now()}-${Math.random()}`,
      content,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addBotMessageWithTyping = async (content: string, delay: number = 2000) => {
    setIsTyping(true);
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        addMessage(content, 'bot');
        resolve();
      }, delay);
    });
  };

  const startChatFlow = async () => {
    setChatPhase('greeting');
    await addBotMessageWithTyping(`Ciao ${user?.firstName}! 👋 Sono Caffè, il tuo assistente di Caffis! ☕`, 1500);
    
    setChatPhase('intro');
    await addBotMessageWithTyping(INTRODUCTION_MESSAGES[0], 2500);
    await addBotMessageWithTyping(INTRODUCTION_MESSAGES[1], 2500);
    await addBotMessageWithTyping(INTRODUCTION_MESSAGES[2], 2000);
    
    setChatPhase('questions');
    setCurrentQuestionIndex(0);
    await addBotMessageWithTyping(QUESTIONS[0], 2000);
  };

  const processUserResponse = async (userInput: string) => {
    if (chatPhase !== 'questions' || currentQuestionIndex < 0) return;
    
    const categoryName = CATEGORIES[currentQuestionIndex];
    const matched = smartMatchUserInput(userInput, categoryName);
    
    console.log(`Processing: ${userInput} for category: ${categoryName}, matched: ${matched}`);
    
    if (!matched) {
      const suggestions = getSuggestions(categoryName);
      await addBotMessageWithTyping(
        `Non ho capito bene. ${suggestions}\n\n${QUESTIONS[currentQuestionIndex]}`, 
        1500
      );
      return;
    }
    
    const updatedData = { ...onboardingData, [categoryName]: matched };
    setOnboardingData(updatedData);
    
    const smartConfirmation = getSmartConfirmation(categoryName, matched, userInput);
    await addBotMessageWithTyping(smartConfirmation, 1000);
    
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= QUESTIONS.length) {
      await completeOnboarding({ ...updatedData, completed: true });
    } else {
      setCurrentQuestionIndex(nextIndex);
      await addBotMessageWithTyping(QUESTIONS[nextIndex], 2000);
    }
  };

  const completeOnboarding = async (data: OnboardingData) => {
    setChatPhase('complete');
    setIsComplete(true);
    
    await addBotMessageWithTyping("🎉 Fantastico! Il tuo profilo è completo!", 1500);
    await addBotMessageWithTyping("Ora posso aiutarti a trovare i compagni di caffè perfetti per te! ☕✨", 2000);
    
    try {
      const token = localStorage.getItem('caffis_auth_token') || localStorage.getItem('token');
      
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          updateUser({ ...user, onboardingCompleted: true });
          await addBotMessageWithTyping("Ti sto portando alla dashboard... 🚀", 1500);
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      await addBotMessageWithTyping("C'è stato un piccolo problema, ma ti porto comunque alla dashboard!", 1500);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    const message = currentMessage.trim() || finalTranscript.trim();
    if (!message || isComplete || isTyping) return;

    addMessage(message, 'user');
    processUserResponse(message);
    
    setCurrentMessage("");
    setFinalTranscript("");
    setInterimTranscript("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-apple-mesh flex items-center justify-center">
        <div className="card-apple text-center py-12 px-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-800">Caricamento...</p>
        </div>
      </div>
    );
  }

  const getProgressPercentage = () => {
    if (chatPhase === 'greeting') return 0;
    if (chatPhase === 'intro') return 10;
    if (chatPhase === 'questions') {
      return 10 + ((currentQuestionIndex + 1) / QUESTIONS.length) * 85;
    }
    return 100;
  };

  return (
    <div className="min-h-screen bg-apple-mesh">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-orange-400/10 to-yellow-400/10 backdrop-blur-sm"
            style={{
              width: `${80 + i * 15}px`,
              height: `${80 + i * 15}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              x: [-8, 8, -8],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="page-content-spacing relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Coffee className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
              Benvenuto in Caffis!
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6">
            Conosciamoci meglio per trovarti i compagni di caffè perfetti
          </p>
          
          {/* Progress bar - Liquid Glass Style */}
          <div className="relative w-full bg-white/20 backdrop-blur-md rounded-full h-3 border border-white/30 shadow-lg overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg"
              style={{ width: `${getProgressPercentage()}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ width: "50%" }}
              />
            </motion.div>
          </div>
          <p className="text-orange-600 mt-3 font-medium">
            {chatPhase === 'questions' && currentQuestionIndex >= 0 
              ? `Domanda ${currentQuestionIndex + 1}/${QUESTIONS.length}` 
              : chatPhase === 'complete' 
                ? 'Completato! 🎉'
                : 'Inizializzazione...'}
          </p>
        </motion.div>

        {/* Chat Container - Liquid Glass Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-apple bg-white/10 backdrop-blur-xl border-white/20 overflow-hidden"
        >
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 scrollbar-hide">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-3 max-w-xs ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <motion.div 
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ${
                      message.sender === 'bot' 
                        ? 'bg-gradient-to-br from-orange-500 to-yellow-500' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {message.sender === 'bot' ? '☕' : user?.firstName?.[0] || 'U'}
                  </motion.div>
                  
                  {/* Message Bubble */}
                  <motion.div 
                    className={`px-4 py-3 rounded-2xl backdrop-blur-md border shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500/80 to-purple-500/80 text-white border-blue-300/30 rounded-br-md'
                        : 'bg-white/80 text-gray-800 border-white/40 rounded-bl-md'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {/* Real-time transcription bubble */}
            <AnimatePresence>
              {(interimTranscript || isListening) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-end"
                >
                  <div className="flex items-end space-x-3 flex-row-reverse space-x-reverse max-w-xs">
                    <motion.div 
                      className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-white shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🎤
                    </motion.div>
                    <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 backdrop-blur-md text-green-800 rounded-br-md border-2 border-green-300/50">
                      <p className="text-sm leading-relaxed">
                        {interimTranscript || (isListening ? "🎤 Sto ascoltando..." : "")}
                      </p>
                      {confidence > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Confidenza: {Math.round(confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white shadow-lg">
                      ☕
                    </div>
                    <div className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl rounded-bl-md border border-white/40 shadow-lg">
                      <div className="flex space-x-1">
                        <motion.div 
                          className="w-2 h-2 bg-orange-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-orange-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.1 }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-orange-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isComplete && chatPhase === 'questions' && (
            <div className="border-t border-white/20 p-6 bg-white/5 backdrop-blur-md">
              {/* Voice Error Display */}
              <AnimatePresence>
                {voiceError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-100/80 backdrop-blur-md text-red-600 rounded-xl text-sm border border-red-200/50"
                  >
                    {voiceError}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex space-x-3">
                {/* Input Field */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentMessage || finalTranscript}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Scrivi o parla la tua risposta..."
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all focus:bg-white/70"
                    disabled={isTyping}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20 -z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                
                {/* Voice Button - Liquid Glass */}
                {isRecordingSupported && (
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isTyping}
                    className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 p-3 rounded-2xl shadow-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: isListening
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(185, 28, 28, 0.8) 100%)"
                        : "linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(21, 128, 61, 0.8) 100%)"
                    }}
                    whileHover={{ scale: isTyping ? 1 : 1.05 }}
                    whileTap={{ scale: isTyping ? 1 : 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Liquid Glass Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    
                    <motion.div
                      animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="relative z-10"
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </motion.div>
                    
                    <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
                  </motion.button>
                )}
                
                {/* Send Button - Liquid Glass */}
                <motion.button
                  onClick={handleSendMessage}
                  disabled={(!currentMessage.trim() && !finalTranscript.trim()) || isTyping}
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-6 py-3 rounded-2xl shadow-lg transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: (!currentMessage.trim() && !finalTranscript.trim()) || isTyping
                      ? "rgba(255, 255, 255, 0.1)" 
                      : "linear-gradient(135deg, rgba(249, 115, 22, 0.8) 0%, rgba(251, 146, 60, 0.8) 50%, rgba(253, 186, 116, 0.8) 100%)"
                  }}
                  whileHover={{ scale: ((!currentMessage.trim() && !finalTranscript.trim()) || isTyping) ? 1 : 1.05 }}
                  whileTap={{ scale: ((!currentMessage.trim() && !finalTranscript.trim()) || isTyping) ? 1 : 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Liquid Glass Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                  
                  <div className="relative z-10 flex items-center gap-2">
                    <Send size={20} />
                    <span className="font-medium">Invia</span>
                  </div>
                  
                  <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300" />
                </motion.button>
              </div>
              
              {/* Voice Status */}
              <div className="mt-4 text-center">
                {isRecordingSupported ? (
                  <motion.p
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-gray-500 flex items-center justify-center gap-2"
                  >
                    {isListening ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2 h-2 bg-red-500 rounded-full"
                        />
                        🎤 Registrazione in corso... Parla ora!
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        Clicca il microfono per parlare
                      </>
                    )}
                  </motion.p>
                ) : (
                  <p className="text-xs text-yellow-600 flex items-center justify-center gap-2">
                    <VolumeX className="w-3 h-3" />
                    ⚠️ Riconoscimento vocale non supportato dal browser
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Status Messages */}
          {chatPhase !== 'questions' && !isComplete && (
            <div className="border-t border-white/20 p-6 text-center bg-white/5 backdrop-blur-md">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-orange-600 flex items-center justify-center gap-2"
              >
                {chatPhase === 'greeting' && (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      👋
                    </motion.div>
                    Salutando...
                  </>
                )}
                {chatPhase === 'intro' && (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    💬 Spiegando il processo...
                  </>
                )}
              </motion.div>
            </div>
          )}
          
          {/* Completion Message */}
          {isComplete && (
            <div className="border-t border-white/20 p-8 text-center bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="space-y-4"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl"
                >
                  🎉
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 mb-2">
                    Profilo Completato!
                  </h3>
                  <p className="text-gray-600">
                    Ti stiamo portando alla dashboard...
                  </p>
                </div>
                
                {/* Liquid Glass Success Button */}
                <motion.div
                  className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-3xl shadow-lg relative overflow-hidden mx-auto inline-block"
                  style={{
                    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(99, 102, 241, 0.8) 100%)"
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ width: "50%" }}
                  />
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Shield className="w-6 h-6" />
                    </motion.div>
                    <span className="font-semibold">Reindirizzamento...</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                  
                  <div className="absolute inset-0 rounded-3xl border border-white/20" />
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}