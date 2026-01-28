'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, Paperclip, Mic, MicOff, Square } from 'lucide-react';

const InputArea = ({ input, onChange, onSubmit, isLoading, onStop }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence for faster interaction
    recognition.interimResults = true; // Show results immediately
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const syntheticEvent = { target: { value: (input ? input + ' ' : '') + finalTranscript } };
        onChange(syntheticEvent);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [input, onChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div className="w-full px-2 sm:px-4 pb-4 sm:pb-8 pt-2 bg-gradient-to-t from-dark-900 via-dark-900 to-transparent light-theme:from-dark-50 light-theme:via-dark-50 relative z-30">
      <div className="max-w-4xl mx-auto relative px-1 sm:px-0">
        <motion.div
          className={`
            relative rounded-2xl border transition-all duration-300 overflow-hidden
            ${isFocused
              ? 'bg-dark-800 light-theme:bg-white border-primary-500/50 shadow-glow shadow-primary-500/20'
              : 'bg-dark-800/80 light-theme:bg-white/80 border-dark-700/50 light-theme:border-dark-200 shadow-lg backdrop-blur-xl hover:border-dark-600/50'
            }
          `}
          animate={{
            y: isFocused ? -2 : 0,
            scale: isFocused ? 1.005 : 1
          }}
        >
          <form onSubmit={onSubmit} className="flex items-end gap-2 p-3">
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-dark-400 hover:bg-dark-700/50 hover:text-dark-200 transition-colors flex-shrink-0"
              title="Attach file (Coming soon)"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isLoading ? "Thinking..." : (isListening ? "Listening..." : "Message Kacademyx...")}
              disabled={isLoading}
              rows={1}
              enterKeyHint="send"
              className={`flex-1 py-3 px-1 bg-transparent text-base sm:text-sm text-dark-100 light-theme:text-dark-900 placeholder-dark-500 resize-none outline-none max-h-48 scrollbar-hide
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 relative
                  ${isListening
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-dark-400 hover:bg-dark-700/50 hover:text-dark-200'}
                `}
                title="Voice Input"
              >
                {isListening ? (
                  <>
                    <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping"></span>
                    <MicOff size={18} />
                  </>
                ) : (
                  <Mic size={18} />
                )}
              </button>

              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <button
                      type="button"
                      onClick={onStop}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-dark-700 hover:bg-red-500/10 hover:text-red-500 text-dark-400 transition-colors"
                      title="Stop Generating"
                    >
                      <Square size={14} fill="currentColor" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="send"
                    type="submit"
                    disabled={!input.trim()}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    whileHover={input.trim() ? { scale: 1.05 } : {}}
                    whileTap={input.trim() ? { scale: 0.95 } : {}}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200
                      ${input.trim()
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-dark-700/50 text-dark-500 cursor-not-allowed'
                      }`}
                  >
                    <Send size={16} className={input.trim() ? 'ml-0.5' : ''} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Bottom highlight line */}
          {isFocused && (
            <motion.div
              layoutId="active-line"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"
            />
          )}
        </motion.div>

        <div className="text-center mt-3">
          <p className="text-[10px] text-dark-500 flex items-center justify-center gap-1.5 opacity-60">
            <Sparkles size={10} className="text-primary-400" />
            <span>Kacademyx excels at science, math, and coding tasks.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
