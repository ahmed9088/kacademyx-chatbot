/**
 * Kacademyx Data Service
 * Implements the functional requirements for Chat and Message management.
 * 
 * UPGRADE: Added robust error handling and retry logic (Exponential Backoff).
 */

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const TIMEOUT_MS = 30000;

/**
 * Robust fetch wrapper with retries and timeout.
 */
const robustFetch = async (url, options = {}, retries = MAX_RETRIES) => {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(id);

        // If 404 (Not Found), do NOT retry, just throw immediately so caller handles it (e.g. auto-healing)
        if (response.status === 404) {
            const errText = await response.text();
            throw new Error(`404 Not Found: ${errText}`);
        }

        // If other error (5xx or network), retry
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        if (retries > 0 && error.name !== 'AbortError' && !error.message.includes('404')) {
            console.warn(`Fetch failed for ${url}, retrying... (${retries} left). Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, BASE_DELAY * (MAX_RETRIES - retries + 1)));
            return robustFetch(url, options, retries - 1);
        }
        console.error(`Fetch permanently failed for ${url}:`, error);
        throw error;
    }
};

// ============================================================================
// 3. Chat Management Functions
// ============================================================================

export const getUserChats = async (userId) => {
    if (!userId) throw new Error('userId required');
    return robustFetch(`/api/chats?userId=${encodeURIComponent(userId)}`);
};

export const createChat = async (userId, title = 'New Chat') => {
    if (!userId) throw new Error('userId required');
    return robustFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title })
    });
};

export const getChatById = async (chatId) => {
    return robustFetch(`/api/chats/${chatId}`);
};

export const updateChatTitle = async (chatId, userId, title) => {
    if (!userId) throw new Error('userId required');
    return robustFetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title })
    });
};

export const deleteChat = async (chatId, userId) => {
    if (!userId) throw new Error('userId required');
    return robustFetch(`/api/chats/${chatId}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
    });
};

export const deleteAllChats = async (userId) => {
    if (!userId) throw new Error('userId required');
    return robustFetch('/api/chats', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
}


// ============================================================================
// 4. Message Functions
// ============================================================================

export const getMessages = async (chatId, userId) => {
    if (!userId) throw new Error('userId required');
    return robustFetch(`/api/chats/${chatId}/messages?userId=${encodeURIComponent(userId)}`);
};

export const sendUserMessage = async (chatId, userId, content) => {
    if (!isValidMessage(content)) return null;
    if (!userId) throw new Error('userId required');

    return robustFetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: 'user', content })
    });
};

export const sendAssistantMessage = async (chatId, userId, content, messageId = null) => {
    if (!isValidMessage(content)) return null;
    if (!userId) throw new Error('userId required');

    const body = { userId, role: 'assistant', content };
    if (messageId) {
        body.id = messageId;
    }

    return robustFetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
};




// ============================================================================
// 7. Auto-Rename Chat Logic
// ============================================================================

export const generateChatTitle = (firstMessage) => {
    if (!firstMessage) return 'New Chat';
    return firstMessage.length > 30 ? firstMessage.slice(0, 30) + '...' : firstMessage;
};


// ============================================================================
// 12. Utility & Validation Functions
// ============================================================================

export const isValidMessage = (content) => {
    return content && typeof content === 'string' && content.trim().length > 0;
};

export const formatMessageTimestamp = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
