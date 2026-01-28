'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Trash2, Download, HardDrive,
    Moon, Sun, Check, AlertTriangle, Database, LogOut
} from 'lucide-react';
import { deleteAllChats } from '@/lib/dataService';
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const SettingsModal = ({ isOpen, onClose, theme, toggleTheme, onLogout, onClearStorage, user }) => {
    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN (Rules of Hooks)
    const [activeTab, setActiveTab] = useState('general');
    const [isClearing, setIsClearing] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [showThinking, setShowThinking] = useState(true);

    // Fetch stats via SWR
    const { data: chats } = useSWR(isOpen && user ? '/api/chats' : null, fetcher);

    // Derived stats
    const [storageStats, setStorageStats] = useState({ count: 0, size: '0 KB' });

    useEffect(() => {
        if (isOpen) {
            const savedPrompt = localStorage.getItem('kacademyx_system_prompt') || '';
            const savedThinking = localStorage.getItem('kacademyx_show_thinking') !== 'false';
            setSystemPrompt(savedPrompt);
            setShowThinking(savedThinking);
        }
    }, [isOpen]);

    const handleSaveAISettings = () => {
        localStorage.setItem('kacademyx_system_prompt', systemPrompt);
        localStorage.setItem('kacademyx_show_thinking', showThinking);
    };

    useEffect(() => {
        if (chats) {
            const count = chats.length;
            setStorageStats({ count, size: 'Unknown' });
        }
    }, [chats]);

    // Early return AFTER all hooks are called
    if (!isOpen) return null;

    const handleClearAll = async () => {
        setIsClearing(true);
        try {
            if (onClearStorage) onClearStorage();

            await deleteAllChats();

            onClose();
        } catch (error) {
            console.error("Failed to clear chats:", error);
        } finally {
            setIsClearing(false);
            setClearConfirm(false);
        }
    };

    const handleExportAll = () => {
        const cachedChats = localStorage.getItem('kacademyx_chats_cache');
        const chats = cachedChats ? JSON.parse(cachedChats) : [];
        const dataStr = JSON.stringify(chats, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kacademyx_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'ai', label: 'AI Customization', icon: Database }, // Reusing Database icon for now or we can use Sparkles if imported
        { id: 'data', label: 'Data & Storage', icon: HardDrive },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 rounded-2xl w-full max-w-2xl h-[500px] overflow-hidden shadow-2xl flex"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Sidebar */}
                    <div className="w-48 bg-dark-850 light-theme:bg-dark-50 border-r border-dark-700/50 light-theme:border-dark-200 p-4 flex flex-col gap-2">
                        <h2 className="text-sm font-bold text-dark-400 uppercase tracking-wider mb-2 px-3">Settings</h2>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-dark-400 hover:bg-dark-800 light-theme:hover:bg-dark-100 hover:text-dark-200'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col relative">
                        <div className="flex items-center justify-between p-6 border-b border-dark-700/50 light-theme:border-dark-200">
                            <h3 className="text-lg font-bold text-dark-100 light-theme:text-dark-900">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h3>
                            <button onClick={onClose} className="icon-btn">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'general' && (
                                <div className="flex flex-col gap-6">
                                    {/* Appearance */}
                                    <section>
                                        <h4 className="text-sm font-medium text-dark-400 mb-3">Appearance</h4>
                                        <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-dark-800 light-theme:bg-white flex items-center justify-center border border-dark-700/50 light-theme:border-dark-200 text-primary-400">
                                                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-dark-200 light-theme:text-dark-800">Theme Mode</p>
                                                    <p className="text-xs text-dark-400">Toggle between dark and light themes</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className="px-4 py-2 rounded-lg bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 text-sm font-medium text-dark-200 light-theme:text-dark-700 hover:border-primary-500/50 transition-all duration-200"
                                            >
                                                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                                            </button>
                                        </div>
                                    </section>

                                    {/* Logout */}
                                    <section>
                                        <h4 className="text-sm font-medium text-dark-400 mb-3">Session</h4>
                                        <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-dark-800 light-theme:bg-white flex items-center justify-center border border-dark-700/50 light-theme:border-dark-200 text-dark-400">
                                                    <LogOut size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-dark-200 light-theme:text-dark-800">Sign Out</p>
                                                    <p className="text-xs text-dark-400">Log out of your account</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { onLogout?.(); onClose(); }}
                                                className="px-4 py-2 rounded-lg bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 text-sm font-medium text-dark-200 light-theme:text-dark-700 hover:border-red-500/50 hover:text-red-400 transition-all duration-200"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </section>

                                    {/* Account */}
                                    <section>
                                        <h4 className="text-sm font-medium text-dark-400 mb-3">Account</h4>
                                        <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                                                {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-dark-200 light-theme:text-dark-800">{user?.displayName || 'User'}</p>
                                                <p className="text-xs text-dark-400">{user?.email}</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'ai' && (
                                <div className="flex flex-col gap-6">
                                    <section>
                                        <h4 className="text-sm font-medium text-dark-400 mb-3">System Instructions</h4>
                                        <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200">
                                            <p className="text-xs text-dark-400 mb-2">
                                                Define how Kacademyx should behave. (e.g., "You are a physics expert", "Be concise").
                                                <br />
                                                <span className="text-warning-500">Note: To see the "Thinking Process", ask it to "Show your thinking".</span>
                                            </p>
                                            <textarea
                                                className="w-full h-32 bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 rounded-lg p-3 text-sm text-dark-100 light-theme:text-dark-900 outline-none focus:border-primary-500/50 transition-colors"
                                                placeholder="e.g. Always answer in rhyme..."
                                                value={systemPrompt}
                                                onChange={(e) => setSystemPrompt(e.target.value)}
                                                onBlur={handleSaveAISettings}
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'data' && (
                                <div className="flex flex-col gap-6">
                                    {/* Specs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200">
                                            <div className="text-dark-400 text-xs font-medium mb-1">Total Chats</div>
                                            <div className="text-2xl font-bold text-dark-100 light-theme:text-dark-900 flex items-baseline gap-2">
                                                {storageStats.count}
                                                <span className="text-xs font-normal text-dark-500">conversations</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200">
                                            <div className="text-dark-400 text-xs font-medium mb-1">Estimated Size</div>
                                            <div className="text-2xl font-bold text-dark-100 light-theme:text-dark-900 flex items-baseline gap-2">
                                                {storageStats.size}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <section>
                                        <h4 className="text-sm font-medium text-dark-400 mb-3">Data Management</h4>

                                        <div className="flex flex-col gap-3">
                                            <div className="p-4 bg-dark-700/30 light-theme:bg-dark-100 rounded-xl border border-dark-700/50 light-theme:border-dark-200 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-dark-800 light-theme:bg-white flex items-center justify-center border border-dark-700/50 light-theme:border-dark-200 text-primary-400">
                                                        <Download size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-dark-200 light-theme:text-dark-800">Export All Data</p>
                                                        <p className="text-xs text-dark-400">Download all your chats as JSON</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleExportAll}
                                                    className="px-4 py-2 rounded-lg bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 text-sm font-medium text-dark-200 light-theme:text-dark-700 hover:border-primary-500/50 transition-all duration-200"
                                                >
                                                    Export
                                                </button>
                                            </div>

                                            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                        <Trash2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-red-400">Clear All History</p>
                                                        <p className="text-xs text-red-400/70">Permanently delete all conversations</p>
                                                    </div>
                                                </div>

                                                {!clearConfirm ? (
                                                    <button
                                                        onClick={() => setClearConfirm(true)}
                                                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all duration-200"
                                                    >
                                                        Clear All
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setClearConfirm(false)}
                                                            className="px-3 py-2 rounded-lg bg-transparent text-dark-400 text-xs font-medium hover:text-dark-200"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleClearAll}
                                                            disabled={isClearing}
                                                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                                                        >
                                                            {isClearing && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                            Confirm Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SettingsModal;
