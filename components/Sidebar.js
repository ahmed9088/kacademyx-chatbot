'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MessageSquare, Pin, Pencil, Trash2,
  ChevronRight, Sparkles, ChevronDown, Settings, Database
} from 'lucide-react';

const Sidebar = ({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onNewChat,
  isOpen,
  toggleSidebar,
  onOpenSettings
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const handleRenameSubmit = (id) => {
    if (editValue.trim()) {
      onRenameChat(id, { title: editValue.trim() });
    }
    setEditingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') handleRenameSubmit(id);
    else if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
  };

  const startEditing = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditValue(chat.title);
  };

  const toggleGroup = (label) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(label)) {
      newCollapsed.delete(label);
    } else {
      newCollapsed.add(label);
    }
    setCollapsedGroups(newCollapsed);
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const unpinnedChats = filteredChats.filter(c => !c.isPinned);

  const getDayLabel = (updatedAt) => {
    if (!updatedAt) return 'Older';
    const d = new Date(updatedAt.seconds ? updatedAt.seconds * 1000 : updatedAt);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'Previous 7 Days';
    if (diffDays < 30) return 'Previous 30 Days';
    return 'Older';
  };

  const categories = unpinnedChats.reduce((acc, chat) => {
    const label = getDayLabel(chat.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  // Sort keys to ensure order: Today, Yesterday, etc.
  const sortedCategories = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older']
    .filter(k => categories[k] && categories[k].length > 0);

  const renderChatItem = (chat) => (
    <motion.div
      key={chat.id}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 border border-transparent mb-1
        ${chat.id === activeChatId
          ? 'bg-primary-500/10 border-primary-500/50'
          : 'hover:bg-dark-700/50 light-theme:hover:bg-dark-100'
        }`}
      onClick={() => onSelectChat(chat.id)}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200
          ${chat.id === activeChatId
            ? 'bg-primary-500/20 text-primary-400'
            : 'bg-dark-700/50 light-theme:bg-dark-200 text-dark-400 group-hover:text-primary-400'
          }`}>
          <MessageSquare size={14} strokeWidth={1.75} />
        </div>

        {editingId === chat.id ? (
          <input
            className="flex-1 px-2 py-1 text-sm bg-dark-900 light-theme:bg-white border border-primary-500 rounded text-dark-100 light-theme:text-dark-900 outline-none"
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleRenameSubmit(chat.id)}
            onKeyDown={(e) => handleKeyDown(e, chat.id)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`text-sm font-medium truncate transition-colors duration-200
            ${chat.id === activeChatId ? 'text-dark-100 light-theme:text-dark-900' : 'text-dark-300 light-theme:text-dark-700'}
          `}>
            {chat.title}
          </span>
        )}
      </div>

      <div className={`flex items-center gap-1 transition-opacity duration-200 ${isOpen ? 'opacity-0 group-hover:opacity-100' : 'hidden'}`}>
        <button
          className={`w-6 h-6 flex items-center justify-center rounded transition-all duration-200
            ${chat.isPinned
              ? 'text-primary-400 bg-primary-500/20'
              : 'text-dark-400 hover:text-dark-200 hover:bg-dark-600/50'
            }`}
          onClick={(e) => { e.stopPropagation(); onRenameChat(chat.id, { isPinned: !chat.isPinned }); }}
          title={chat.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={12} strokeWidth={chat.isPinned ? 2.5 : 1.75} />
        </button>
        <button
          className="w-6 h-6 flex items-center justify-center rounded text-dark-400 hover:text-dark-200 hover:bg-dark-600/50 transition-all duration-200"
          onClick={(e) => startEditing(chat, e)}
          title="Rename"
        >
          <Pencil size={12} strokeWidth={1.75} />
        </button>
        <button
          className="w-6 h-6 flex items-center justify-center rounded text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          onClick={(e) => onDeleteChat(chat.id, e)}
          title="Delete"
        >
          <Trash2 size={12} strokeWidth={1.75} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 h-full bg-dark-850 light-theme:bg-dark-50 border-r border-dark-700/50 light-theme:border-dark-200/50
        flex flex-col transition-transform duration-300 z-50
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0 w-80 lg:w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-dark-700/50 light-theme:border-dark-200/50 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 flex items-center justify-center text-primary-400 flex-shrink-0 bg-primary-500/10 rounded-lg">
              <Sparkles size={20} strokeWidth={2} />
            </div>
            <span className={`font-bold text-sm tracking-wide text-dark-100 light-theme:text-dark-900 whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0'}`}>
              KACADEMYX
            </span>
          </div>
          <button
            className={`icon-btn flex-shrink-0 w-8 h-8 ${isOpen ? '' : 'lg:hidden'}`}
            onClick={toggleSidebar}
          >
            <ChevronRight size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Actions */}
        <div className={`p-3 flex flex-col gap-2 ${isOpen ? '' : 'lg:items-center'}`}>
          <button
            className={`btn-primary shadow-lg shadow-primary-500/20 ${isOpen ? 'w-full py-2.5' : 'lg:w-10 lg:h-10 lg:p-0'}`}
            onClick={onNewChat}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className={isOpen ? '' : 'lg:hidden'}>New Chat</span>
          </button>

          <div className={`relative ${isOpen ? '' : 'lg:hidden'}`}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 text-xs py-2 bg-dark-800/50 light-theme:bg-white border-transparent focus:bg-dark-800 focus:border-primary-500/50"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className={`flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-4 ${isOpen ? '' : 'lg:items-center lg:px-2'}`}>
          {/* Pinned Section */}
          {pinnedChats.length > 0 && (
            <div className="flex flex-col gap-1 w-full">
              <div className={`flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-dark-500 ${isOpen ? '' : 'lg:hidden'}`}>
                <Pin size={10} />
                <span>Pinned</span>
              </div>
              {pinnedChats.map(renderChatItem)}
            </div>
          )}

          {/* Chronological Groups */}
          {sortedCategories.map(label => {
            const isCollapsed = collapsedGroups.has(label);
            const count = categories[label].length;

            return (
              <div key={label} className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => toggleGroup(label)}
                  className={`flex items-center justify-between px-2 py-1 w-full text-left group hover:bg-dark-800/50 rounded-md transition-colors ${isOpen ? '' : 'lg:hidden'}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dark-500 group-hover:text-dark-300 transition-colors">
                    {label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-dark-600">{count}</span>
                    <ChevronDown size={10} className={`text-dark-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {categories[label].map(renderChatItem)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredChats.length === 0 && (
            <div className={`flex flex-col items-center justify-center py-12 text-center ${isOpen ? '' : 'lg:hidden'}`}>
              <div className="w-16 h-16 bg-dark-800/50 light-theme:bg-dark-100 rounded-2xl flex items-center justify-center mb-4 border border-dark-700/50 border-dashed">
                <MessageSquare size={24} className="text-dark-500" />
              </div>
              <h4 className="text-sm font-semibold text-dark-300 light-theme:text-dark-600 mb-1">No chats found</h4>
              <p className="text-xs text-dark-500 max-w-[150px]">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create a new chat to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t border-dark-700/50 light-theme:border-dark-200/50 mt-auto ${isOpen ? '' : 'lg:items-center'}`}>
          <button
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-dark-700/50 light-theme:hover:bg-dark-100 transition-all duration-200 group ${isOpen ? '' : 'lg:justify-center lg:px-0 lg:w-10 lg:h-10'}`}
            onClick={onOpenSettings}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 text-dark-400 group-hover:text-primary-400 group-hover:border-primary-500/50 transition-colors">
              <Settings size={16} />
            </div>
            <div className={`flex flex-col items-start ${isOpen ? '' : 'lg:hidden'}`}>
              <span className="text-sm font-medium text-dark-200 light-theme:text-dark-800">Settings</span>
              <span className="text-[10px] text-dark-500">Theme & Data</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
