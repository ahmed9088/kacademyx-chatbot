"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import useSWR, { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import InputArea from '@/components/InputArea';
import Sidebar from '@/components/Sidebar';
import SettingsModal from '@/components/SettingsModal';
import AboutModal from '@/components/AboutModal';
import LoginScreen from '@/components/LoginScreen';
import TopBar from '@/components/TopBar';

import {
  getUserChats,
  createChat,
  updateChatTitle,
  deleteChat as deleteChatApi,
  getMessages,
  sendUserMessage,
  sendAssistantMessage,
  generateChatTitle
} from '@/lib/dataService';

// ============================================================================
// CONSTANTS
// ============================================================================
const WELCOME_MESSAGE = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `👋 **Welcome to Kacademyx!**

I'm your AI learning assistant, here to help you explore any topic, answer your questions, and make learning easier and more engaging.

**Here are some things I can help you with:**
- 📚 Explain complex concepts in simple terms
- 🔬 Answer questions about science, math, history, and more
- 💡 Provide step-by-step solutions to problems
- 🎯 Create study plans and learning strategies

Feel free to ask me anything! What would you like to learn today?`
};

const STORAGE_KEYS = {
  ACTIVE_CHAT_ID: 'kacademyx_active_id',
  THEME: 'kacademyx_theme'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';

  // UI State
  const [localInput, setLocalInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [activeChatId, setActiveChatId] = useState(null);

  // Extract userId for all API calls
  const userId = user?.id;

  // Data Fetching (SWR)
  // 3. User Functions: getUserChats
  const { data: chats, mutate: mutateChats } = useSWR(
    userId ? 'user-chats' : null,
    () => getUserChats(userId),
    {
      fallbackData: [],
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // 4. Message Functions: getMessages
  const { data: serverMessages, mutate: mutateMessages, error: messagesError } = useSWR(
    userId && activeChatId ? `chat-messages-${activeChatId}` : null,
    () => getMessages(activeChatId, userId),
    {
      revalidateOnFocus: false,
      keepPreviousData: true // Optimize UX: Prevent loading flicker
    }
  );

  // Auto-recover from 403/404 errors (stale chat ID)
  useEffect(() => {
    if (messagesError) {
      const errMsg = messagesError.message || '';
      if (errMsg.includes('403') || errMsg.includes('404')) {
        console.warn("Access denied or chat missing. Resetting active chat.", errMsg);
        setActiveChatId(null);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
        setMessages([WELCOME_MESSAGE]); // Reset UI
      }
    }
  }, [messagesError]);

  // Refs for tracking
  const activeChatIdRef = useRef(null);
  const savedMessageIds = useRef(new Set());
  const isStreamingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // ============================================================================
  // MANUAL CHAT IMPLEMENTATION (Bypassing useChat v6 incompatibility)
  // ============================================================================
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Manual sendMessage function with Auto-Retry and AbortController
  const abortControllerRef = useRef(null);

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    // Reset abort controller
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    isStreamingRef.current = true;

    const systemInstruction = (() => {
      try {
        return localStorage.getItem('kacademyx_system_prompt') || '';
      } catch (e) {
        console.warn("LocalStorage access failed:", e);
        return '';
      }
    })();

    // sanitize messages
    const safeMessages = messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')
    }));

    // Create placeholder for AI response with a FIXED ID
    const aiMessageId = `ai-${Date.now()}`;
    const assistantMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: ''
    };
    setMessages(prev => [...prev, assistantMessage]);


    // RETRY LOGIC
    const MAX_RETRIES = 3;
    let attempt = 0;
    let success = false;

    while (attempt < MAX_RETRIES && !success) {
      try {
        if (signal.aborted) break;

        // Only show "Retrying..." on attempts > 0
        if (attempt > 0) {
          setMessages(prev => prev.map(m =>
            m.id === aiMessageId
              ? { ...m, content: m.content + ` \n\n*[Network hiccup, retrying (${attempt}/${MAX_RETRIES})...]*` }
              : m
          ));
        }

        const payload = {
          messages: [...safeMessages, userMessage],
          system: systemInstruction
        };

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal // Pass abort signal
        });

        if (!response.ok) {
          // If 503 or 504, it might be temporary
          if ([503, 504, 502].includes(response.status)) {
            throw new Error(`Server temporarily unavailable (${response.status})`);
          }
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        // Clear any retry messages if we start receiving real data
        if (attempt > 0) {
          setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: '' } : m));
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Parse Vercel AI SDK Data Stream Protocol
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const content = line.slice(2);
              if (content.startsWith('"') && content.endsWith('"')) {
                try {
                  accumulatedContent += JSON.parse(content);
                } catch {
                  accumulatedContent += content;
                }
              } else {
                accumulatedContent += content;
              }
            } else if (!line.trim()) {
              continue;
            } else {
              // Fallback for raw text: handles toTextStreamResponse fallback cases
              accumulatedContent += line;
            }
          }

          setMessages(prev => prev.map(m =>
            m.id === aiMessageId
              ? { ...m, content: accumulatedContent }
              : m
          ));
        }

        success = true;

        // Save complete assistant message
        isStreamingRef.current = false;
        if (activeChatId && userId) {
          savedMessageIds.current.add(aiMessageId);
          sendAssistantMessage(activeChatId, userId, accumulatedContent, aiMessageId).catch(saveErr => {
            console.error("Failed to save AI message to DB:", saveErr);
            savedMessageIds.current.delete(aiMessageId);
          });
        }
        mutateChats();

      } catch (err) {
        if (err.name === 'AbortError') {
          console.log("Generation stopped by user");
          // Stop the loop, don't retry
          attempt = MAX_RETRIES;
          setMessages(prev => prev.map(m => m.id === aiMessageId && !m.content ? { ...m, content: "*[Stopped]*" } : m));
        } else {
          console.error(`Attempt ${attempt + 1} failed:`, err);
          attempt++;
          if (attempt >= MAX_RETRIES) {
            setError(err.message || "Failed to connect after multiple attempts.");
            setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + "\n\n*[Connection Failed]*" } : m));
          } else {
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
          }
        }
      }
    }

    isStreamingRef.current = false;
    setIsLoading(false);
  };

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      isStreamingRef.current = false;
    }
  }, []);


  useEffect(() => {
    isStreamingRef.current = isLoading;
  }, [isLoading]);

  // Sync SWR messages to state (Restore Cached Messages logic)
  useEffect(() => {
    if (!serverMessages) {
      if (!activeChatId) {
        setMessages([WELCOME_MESSAGE]);
      }
      return;
    }

    // Only sync when NOT actively receiving a stream
    if (isStreamingRef.current) {
      return;
    }

    if (Array.isArray(serverMessages) && serverMessages.length > 0) {
      // Use setMessages functional update to access current state without adding to deps
      setMessages(prev => {
        const localMessageIds = new Set(prev.map(m => m.id));
        const hasNewMessages = serverMessages.some(sm => !localMessageIds.has(sm.id));

        if (hasNewMessages || prev.length === 0) {
          serverMessages.forEach(m => savedMessageIds.current.add(m.id));
          return serverMessages;
        } else {
          return prev;
        }
      });
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [serverMessages, activeChatId, setMessages]);


  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
    handleResize();
    window.addEventListener('resize', handleResize);

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme === 'light' ? 'light-theme' : '';

    // Restore active chat ID
    const cachedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
    if (cachedActiveId) setActiveChatId(cachedActiveId);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================================
  // 4. Message Functions: sendAssistantMessage (Auto-Save)
  // ============================================================================
  useEffect(() => {
    if (!userId || !activeChatId || isLoading) return;

    messages.forEach(async (msg) => {
      const isAssistant = msg.role === 'assistant';
      const hasContent = msg.content && msg.content.trim();
      const isWelcome = msg.id === 'welcome-msg';
      const alreadySaved = savedMessageIds.current.has(msg.id);

      // Don't save if it's currently being streamed (sendMessage handles the final save)
      // We know it's being streamed if it's the last message and isLoading is true,
      // but to be safe, we rely on savedMessageIds which sendMessage updates immediately upon completion.

      if (isAssistant && hasContent && !isWelcome && msg.id && !alreadySaved) {

        // Double check: if this is the message currently being streamed by sendMessage, it might not be in savedMessageIds YET, 
        // but sendMessage will handle it. 
        // We only want this effect to catch messages that somehow got missed or loaded from cache but not marked.
        // However, with the new logic, sendMessage handles the save explicitly.
        // So this effect is mostly for robustness.

        savedMessageIds.current.add(msg.id);

        try {
          console.log(">>> AUTO-SAVING AI MESSAGE TO DB:", msg.id);
          // For auto-save of existing messages (e.g. recovery), we don't pass a specific ID unless we want to force it
          // But here msg.id IS the one we want.
          await sendAssistantMessage(activeChatId, userId, msg.content.trim(), msg.id);
          mutateMessages(); // Revalidate SWR
        } catch (err) {
          console.error('Failed to save assistant message:', err);
          savedMessageIds.current.delete(msg.id);
        }
      }
    });
  }, [messages, userId, activeChatId, isLoading, mutateMessages]);


  // ============================================================================
  // HANDLERS
  // ============================================================================

  // 5. Locking & 3. Optimistic UI Logic
  const handleManualSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!localInput.trim() || isLoading || isStreamingRef.current) return;

    const content = localInput.trim();
    setLocalInput('');

    let currentChatId = activeChatId;

    const createNewChat = async () => {
      try {
        const newTitle = generateChatTitle(content);
        const newChat = await createChat(userId, newTitle);
        setActiveChatId(newChat.id);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, newChat.id);
        return newChat.id;
      } catch (err) {
        console.error("Failed to create chat:", err);
        return null;
      }
    };

    if (!currentChatId && userId) {
      currentChatId = await createNewChat();
      if (!currentChatId) return;
    }

    // Save user message to DB (fire and forget)
    if (userId && currentChatId) {
      sendUserMessage(currentChatId, userId, content).catch(err => {
        console.error("Message save failed:", err);
      });

      // Auto Rename check
      const currentChat = chats?.find(c => c.id === currentChatId);
      if (currentChat && ['New Chat', 'Chat'].includes(currentChat.title)) {
        const newTitle = generateChatTitle(content);
        updateChatTitle(currentChatId, userId, newTitle);
      }
    }

    // Send to AI (manually manages messages state internally)
    await sendMessage(content);

  }, [localInput, isLoading, activeChatId, chats, userId, sendMessage]);


  // 8. UI Behavior: clearActiveChat / New Chat
  const startNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([WELCOME_MESSAGE]); // 5. Welcome Message Logic (Reset)
    savedMessageIds.current.clear();
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
    if (window.innerWidth > 1024 && !isSidebarOpen) setIsSidebarOpen(true);
  }, [setMessages, isSidebarOpen]);

  // 8. UI Behavior: setActiveChat
  const selectChat = useCallback((id) => {
    if (id === activeChatId) return;
    setActiveChatId(id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, id);
    if (window.innerWidth <= 1024) setIsSidebarOpen(false);
  }, [activeChatId]);

  // 3. Chat Management: deleteChat
  const deleteChatHandler = useCallback(async (id, e) => {
    e?.stopPropagation();
    if (!userId) return;
    try {
      await deleteChat(id, userId);
      mutateChats();
      if (activeChatId === id) startNewChat();
    } catch (err) {
      console.error("Delete failed", err);
    }
  }, [user, activeChatId, startNewChat, mutateChats]);

  // 3. Chat Management: rename/pin chat
  const renameChatHandler = useCallback(async (id, data) => {
    if (!userId) return;
    try {
      // Data usually contains { title: ... } or { isPinned: ... }
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId })
      });

      if (!res.ok) throw new Error(`Failed to update chat: ${res.status}`);

      mutateChats();
    } catch (err) {
      console.error("Rename/Update failed", err);
    }
  }, [userId, mutateChats]);

  // Utility
  const handleManualInputChange = (e) => setLocalInput(e.target.value);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    document.body.className = newTheme === 'light' ? 'light-theme' : '';
  };
  // 6. Regenerate Response
  const handleRegenerate = useCallback(async () => {
    if (isLoading || messages.length === 0) return;

    // Find last user message index
    const lastUserIdx = messages.findLastIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;

    const lastUserMsg = messages[lastUserIdx];

    // Remove subsequent messages
    const newMessages = messages.slice(0, lastUserIdx + 1);
    setMessages(newMessages);

    // Re-send
    await sendMessage(lastUserMsg.content);
  }, [messages, isLoading, sendMessage]);

  // 7. Professional PDF Export
  const handleExportPDF = () => {
    if (!messages.length) return;
    const currentChat = chats?.find(c => c.id === activeChatId);
    const title = currentChat?.title || 'Study Notes';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const notesHtml = messages
      .filter(m => m.id !== 'welcome-msg')
      .map(m => `
        <div class="message ${m.role}">
          <div class="role">${m.role === 'user' ? 'Question' : 'Notes'}</div>
          <div class="content">${m.role === 'assistant' ?
          // Simple markdown-ish parser for print or just raw text. For print, keeping it clean text is safer unless we bring a renderer.
          // Using a simple replace for bolding to make it look decent.
          m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
          : m.content}</div>
        </div>
      `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - Kacademyx Notes</title>
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; font-family: 'Helvetica', sans-serif; }
          .message { margin-bottom: 30px; page-break-inside: avoid; }
          .role { font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 5px; font-family: 'Helvetica', sans-serif; font-weight: bold; }
          .content { background: #f9f9f9; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; }
          .user .content { background: transparent; padding: 0; border-left: none; font-weight: bold; font-size: 1.1em; margin-bottom: 10px; color: #111; }
          .user .role { color: #3b82f6; }
          @media print {
            body { padding: 0; }
            .content { border: 1px solid #eee; border-left: 4px solid #333; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${notesHtml}
        <script>
          window.onload = () => { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };
  const handleDeleteMessage = (msgIndex) => setMessages(prev => prev.filter((_, idx) => idx !== msgIndex));
  const clearStorage = () => {
    Object.keys(STORAGE_KEYS).forEach(k => localStorage.removeItem(STORAGE_KEYS[k]));
    startNewChat();
  };


  // ============================================================================
  // RENDER
  // ============================================================================
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />; // 1. requireAuth (handled via UI toggle)
  }

  return (
    <div className="flex h-screen bg-dark-900 light-theme:bg-dark-50 text-dark-100 light-theme:text-dark-900 overflow-hidden">
      <Sidebar
        chats={Array.isArray(chats) ? chats : []}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onDeleteChat={deleteChatHandler}
        onRenameChat={renameChatHandler}
        onNewChat={startNewChat}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          currentChatTitle={chats?.find(c => c.id === activeChatId)?.title}
          onExport={handleExportPDF}
          onRegenerate={handleRegenerate}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewChat={startNewChat}
          user={user}
          onLogout={() => signOut()}
        />

        {/* DEBUG: Log what ChatWindow receives */}
        {console.log(">>> FILTERED MESSAGES FOR CHATWINDOW:", messages.filter(m => m.id !== 'welcome-msg' && messages.length > 1 || messages.length === 1).length, "messages")}

        <ChatWindow
          messages={messages}
          status={isLoading ? 'submitted' : 'idle'}
          onDeleteMessage={handleDeleteMessage}
        />

        <InputArea
          input={localInput}
          onChange={handleManualInputChange}
          onSubmit={handleManualSubmit}
          isLoading={isLoading}
          onStop={handleStop}
        />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 flex items-center gap-3 text-red-400 text-sm max-w-md"
            >
              <AlertTriangle size={18} />
              <span>{error.message || 'An error occurred'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={() => signOut()}
        onClearStorage={clearStorage}
        user={user}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
