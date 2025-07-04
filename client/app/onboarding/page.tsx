"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useRequireAuth } from "@/contexts/AuthContext";
import { smartMatchUserInput, getSmartConfirmation, getCategoryDisplayText } from "@/utils/preferenceCategories";
import { Mic, MicOff, Send } from "lucide-react";

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

  // Remove text-to-speech state - bot doesn't speak

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
    // Bot messages remain text-only, no speech
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-amber-800">Caricamento...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-amber-900">
              ☕ Benvenuto in Caffis!
            </h1>
          </div>
          
          <p className="text-amber-700">
            Conosciamoci meglio per trovarti i compagni di caffè perfetti
          </p>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-amber-200 rounded-full h-2">
            <div 
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <p className="text-amber-600 mt-2">
            {chatPhase === 'questions' && currentQuestionIndex >= 0 
              ? `Domanda ${currentQuestionIndex + 1}/${QUESTIONS.length}` 
              : chatPhase === 'complete' 
                ? 'Completato! 🎉'
                : 'Inizializzazione...'}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    message.sender === 'bot' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    {message.sender === 'bot' ? '☕' : user?.firstName?.[0] || 'U'}
                  </div>
                  
                  <div className={`px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Real-time transcription bubble */}
            {(interimTranscript || isListening) && (
              <div className="flex justify-end">
                <div className="flex items-end space-x-2 flex-row-reverse space-x-reverse max-w-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    🎤
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-blue-100 text-blue-800 rounded-br-md border-2 border-blue-300">
                    <p className="text-sm leading-relaxed">
                      {interimTranscript || (isListening ? "🎤 Sto ascoltando..." : "")}
                    </p>
                    {confidence > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Confidenza: {Math.round(confidence * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
          {!isComplete && chatPhase === 'questions' && (
            <div className="border-t border-gray-200 p-4">
              {/* Voice Error Display */}
              {voiceError && (
                <div className="mb-3 p-2 bg-red-100 text-red-600 rounded-md text-sm">
                  {voiceError}
                </div>
              )}
              
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentMessage || finalTranscript}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi o parla la tua risposta..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  disabled={isTyping}
                />
                
                {/* Voice Button */}
                {isRecordingSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isTyping}
                    className={`p-3 rounded-full transition-all duration-200 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? 'Ferma registrazione' : 'Inizia registrazione vocale'}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                )}
                
                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!currentMessage.trim() && !finalTranscript.trim()) || isTyping}
                  className="px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={20} />
                  Invia
                </button>
              </div>
              
              {/* Voice Status */}
              {isRecordingSupported && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    {isListening 
                      ? "🎤 Registrazione in corso... Parla ora!" 
                      : "Clicca il microfono per parlare"}
                  </p>
                </div>
              )}
              
              {!isRecordingSupported && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-yellow-600">
                    ⚠️ Riconoscimento vocale non supportato dal browser
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Status Messages */}
          {chatPhase !== 'questions' && !isComplete && (
            <div className="border-t border-gray-200 p-6 text-center">
              <div className="text-amber-600">
                {chatPhase === 'greeting' && "👋 Salutando..."}
                {chatPhase === 'intro' && "💬 Spiegando il processo..."}
              </div>
            </div>
          )}
          
          {/* Completion Message */}
          {isComplete && (
            <div className="border-t border-gray-200 p-6 text-center">
              <div className="animate-pulse">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-amber-800 font-semibold">
                  Profilo completato! Ti stiamo portando alla dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}