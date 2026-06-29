import { useState, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {

  MessageCircle, Send, Mic, MicOff, Trash2, Phone, Mail,

  MapPin, MessageSquare, Moon, Sun, Minimize2, WifiOff, RefreshCw,

} from 'lucide-react';

import { Button } from '@/components/ui/button';

import { MessageBubble } from './MessageBubble';

import { TypingIndicator } from './TypingIndicator';

import { FormPanel } from './FormPanel';

import { useChatbot } from '@/hooks/useChatbot';

import { cn } from '@/lib/utils';

import { useTheme } from '@/context/ThemeContext';



export function ChatWidget() {

  const [isOpen, setIsOpen] = useState(false);

  const [input, setInput] = useState('');

  const [isListening, setIsListening] = useState(false);

  const [activeForm, setActiveForm] = useState<'reservation' | 'lead' | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);



  const {

    sessionId,

    config,

    messages,

    isLoading,

    isStreaming,

    error,

    apiConnected,

    initialized,

    sendMessage,

    clearChat,

    openWidget,

    retryConnection,

  } = useChatbot();



  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { theme, toggleTheme } = useTheme();



  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages, isLoading]);



  const handleOpen = () => {

    setIsOpen(true);

    openWidget();

    setTimeout(() => inputRef.current?.focus(), 300);

  };



  const handleQuickAction = (action: string) => {

    const prompts: Record<string, string> = {

      menu: 'Show me the menu',

      location: 'Where are you located?',

      contact: 'How can I contact you?',

    };



    if (action === 'reservation') {

      setActiveForm('reservation');

      return;

    }

    if (action === 'contact') {

      setActiveForm('lead');

      return;

    }

    sendMessage(prompts[action] || action);

  };



  const toggleVoice = () => {

    if (isListening) {

      recognitionRef.current?.stop();

      setIsListening(false);

      return;

    }



    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert('Voice input is not supported in this browser.');

      return;

    }



    const recognition = new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.lang = 'en-US';



    recognition.onresult = (event) => {

      const transcript = event.results[0][0].transcript;

      setInput(transcript);

      setIsListening(false);

    };

    recognition.onerror = () => setIsListening(false);

    recognition.onend = () => setIsListening(false);



    recognitionRef.current = recognition;

    recognition.start();

    setIsListening(true);

  };



  const business = config?.business;

  const chatbot = config?.chatbot;

  const showSuggestions = messages.length <= 1 && !isLoading;



  return (

    <>

      <AnimatePresence>

        {!isOpen && (

          <motion.button

            initial={{ scale: 0, opacity: 0 }}

            animate={{ scale: 1, opacity: 1 }}

            exit={{ scale: 0, opacity: 0 }}

            whileHover={{ scale: 1.05 }}

            whileTap={{ scale: 0.95 }}

            onClick={handleOpen}

            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl transition-shadow"

            aria-label="Open chat assistant"

          >

            <MessageCircle className="h-6 w-6" />

            {apiConnected && (

              <span className="absolute -top-1 -right-1 flex h-4 w-4">

                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />

                <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />

              </span>

            )}

          </motion.button>

        )}

      </AnimatePresence>



      <AnimatePresence>

        {isOpen && (

          <motion.div

            initial={{ opacity: 0, y: 20, scale: 0.95 }}

            animate={{ opacity: 1, y: 0, scale: 1 }}

            exit={{ opacity: 0, y: 20, scale: 0.95 }}

            transition={{ type: 'spring', damping: 25, stiffness: 300 }}

            className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] glass-card overflow-hidden"

            role="dialog"

            aria-label="Chat assistant"

          >

            {/* Header */}

            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
 
                  AL
 
                </div>
 
                <div>
 
                  <h2 className="font-semibold text-sm">Priya · Annalakshmi</h2>

                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">

                    <span className={cn(

                      'inline-block h-1.5 w-1.5 rounded-full',

                      apiConnected ? 'bg-green-500' : apiConnected === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse',

                    )} />

                    {apiConnected ? 'Connected to API' : apiConnected === false ? 'API offline' : 'Connecting...'}

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-1">

                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">

                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}

                </Button>

                <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Clear chat">

                  <Trash2 className="h-4 w-4" />

                </Button>

                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Minimize chat">

                  <Minimize2 className="h-4 w-4" />

                </Button>

              </div>

            </div>



            {/* API error banner */}

            {error && apiConnected === false && (

              <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-xs border-b border-destructive/20">

                <WifiOff className="h-3.5 w-3.5 shrink-0" />

                <span className="flex-1">{error}</span>

                <button onClick={retryConnection} className="flex items-center gap-1 underline hover:no-underline">

                  <RefreshCw className="h-3 w-3" /> Retry

                </button>

              </div>

            )}



            {/* Contact bar */}

            {business && (

              <div className="flex items-center justify-center gap-1 px-3 py-2 border-b border-border/30 bg-muted/30">

                <a href={`tel:${business.phone}`} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-muted transition-colors">

                  <Phone className="h-3 w-3" /> Call

                </a>

                <a href={`mailto:${business.email}`} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-muted transition-colors">

                  <Mail className="h-3 w-3" /> Email

                </a>

                <a href={`https://wa.me/${business.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-muted transition-colors">

                  <MessageSquare className="h-3 w-3" /> WhatsApp

                </a>

                <a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs hover:bg-muted transition-colors">

                  <MapPin className="h-3 w-3" /> Map

                </a>

              </div>

            )}



            {/* Messages */}

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 relative">

              {!initialized ? (

                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">

                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />

                  <p className="text-sm">Connecting to chat API...</p>

                </div>

              ) : (

                <>

                  {messages.map((msg, i) => (

                    <MessageBubble

                      key={msg.id || i}

                      message={msg}

                      isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}

                    />

                  ))}

                  {isLoading && !isStreaming && <TypingIndicator />}

                </>

              )}

              <div ref={messagesEndRef} />



              {activeForm && (

                <FormPanel

                  type={activeForm}

                  sessionId={sessionId}

                  onClose={() => setActiveForm(null)}

                  onSuccess={() => {

                    setShowSuccess(true);

                    setTimeout(() => setShowSuccess(false), 3000);

                  }}

                />

              )}

            </div>



            {showSuccess && (

              <div className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">

                ✓ Submitted successfully! We'll be in touch soon.

              </div>

            )}



            {showSuggestions && chatbot?.quick_actions && (

              <div className="flex flex-wrap gap-2 px-4 py-2">

                {chatbot.quick_actions.map(action => (

                  <button

                    key={action.action}

                    onClick={() => handleQuickAction(action.action)}

                    className="px-3 py-1.5 text-xs rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"

                  >

                    {action.label}

                  </button>

                ))}

              </div>

            )}



            {showSuggestions && chatbot?.suggested_prompts && (

              <div className="px-4 pb-2 space-y-1.5">

                {chatbot.suggested_prompts.slice(0, 3).map(prompt => (

                  <button

                    key={prompt}

                    onClick={() => sendMessage(prompt)}

                    disabled={isLoading || apiConnected === false}

                    className="block w-full text-left px-3 py-2 text-xs rounded-lg bg-muted/50 hover:bg-muted transition-colors truncate disabled:opacity-50"

                  >

                    {prompt}

                  </button>

                ))}

              </div>

            )}



            {/* Input */}

            <div className="border-t border-border/50 p-3">

              <form

                onSubmit={(e) => { e.preventDefault(); sendMessage(input); setInput(''); }}

                className="flex items-center gap-2"

              >

                <Button

                  type="button"

                  variant="ghost"

                  size="icon"

                  onClick={toggleVoice}

                  disabled={apiConnected === false}

                  className={cn(isListening && 'text-red-500 animate-pulse')}

                  aria-label={isListening ? 'Stop listening' : 'Voice input'}

                >

                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}

                </Button>

                <input

                  ref={inputRef}

                  type="text"

                  value={input}

                  onChange={(e) => setInput(e.target.value)}

                  placeholder={apiConnected === false ? 'API offline — start backend' : 'Ask me anything...'}

                  disabled={isLoading || apiConnected === false}

                  className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"

                  aria-label="Chat message input"

                />

                <Button

                  type="submit"

                  size="icon"

                  disabled={!input.trim() || isLoading || apiConnected === false}

                  aria-label="Send message"

                >

                  <Send className="h-4 w-4" />

                </Button>

              </form>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </>

  );

}



interface SpeechRecognition extends EventTarget {

  continuous: boolean;

  interimResults: boolean;

  lang: string;

  start(): void;

  stop(): void;

  onresult: ((event: SpeechRecognitionEvent) => void) | null;

  onerror: ((event: Event) => void) | null;

  onend: (() => void) | null;

}



interface SpeechRecognitionEvent {

  results: { [index: number]: { [index: number]: { transcript: string } } };

}



declare global {

  interface Window {

    SpeechRecognition: new () => SpeechRecognition;

    webkitSpeechRecognition: new () => SpeechRecognition;

  }

}


