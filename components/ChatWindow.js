'use client';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Trash2, ArrowDown, ArrowRight, Sparkles, Check, ChevronDown, ChevronUp, RotateCcw, BrainCircuit } from 'lucide-react';
import 'katex/dist/katex.min.css';

const ThinkingProcess = React.memo(({ content }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!content) return null;

    return (
        <div className="mb-3 rounded-xl border border-warning-500/30 bg-warning-500/5 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-warning-500 hover:bg-warning-500/10 transition-colors"
                type="button"
            >
                <BrainCircuit size={14} />
                <span>Thinking Process</span>
                <ChevronDown size={12} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 pt-0 text-sm text-dark-300 light-theme:text-dark-600 font-mono leading-relaxed whitespace-pre-wrap">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

const parseThinking = (text) => {
    const match = /<thinking>([\s\S]*?)<\/thinking>/.exec(text);
    if (match) {
        return {
            thought: match[1].trim(),
            cleanContent: text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()
        };
    }
    return { thought: null, cleanContent: text };
};

const CodeBlock = ({ language, children }) => {
    const [copied, setCopied] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const code = String(children).replace(/\n$/, '');
    const lineCount = code.split('\n').length;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 rounded-xl overflow-hidden border border-dark-700/50 bg-[#1e1e1e] shadow-lg">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/10 bg-dark-800/50">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/5 px-2 py-1 rounded">
                        {language || 'code'}
                    </span>
                    <span className="text-[10px] text-white/30">{lineCount} lines</span>
                </div>
                <div className="flex items-center gap-2">
                    {lineCount > 15 && (
                        <button
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-white/50 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                            {isCollapsed ? 'Expand' : 'Collapse'}
                        </button>
                    )}
                    <button
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200"
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
            <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-40 overflow-hidden' : ''}`}>
                <SyntaxHighlighter
                    style={oneDark}
                    language={language || 'text'}
                    PreTag="div"
                    className="!m-0 !bg-transparent text-[13px]"
                    showLineNumbers
                    lineNumberStyle={{
                        minWidth: '2.5em',
                        paddingRight: '1em',
                        color: 'rgba(255,255,255,0.2)',
                        userSelect: 'none'
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
            {isCollapsed && (
                <div className="h-8 bg-gradient-to-t from-[#1e1e1e] to-transparent absolute bottom-0 left-0 right-0 pointer-events-none" />
            )}
        </div>
    );
};

const TypewriterText = React.memo(({ content, speed = 4, isNew }) => {
    const [displayedContent, setDisplayedContent] = useState(isNew ? '' : content);

    useEffect(() => {
        if (!isNew) { setDisplayedContent(content); return; }
        let i = displayedContent.length;
        const interval = setInterval(() => {
            setDisplayedContent(content.slice(0, i));
            i++;
            if (i > content.length) clearInterval(interval);
        }, speed);
        return () => clearInterval(interval);
    }, [content, speed, isNew]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    return !inline ? (
                        <CodeBlock language={language}>{children}</CodeBlock>
                    ) : (
                        <code className="px-1.5 py-0.5 bg-dark-700 light-theme:bg-dark-200 rounded text-[0.85em] font-mono text-primary-300 light-theme:text-primary-600" {...props}>
                            {children}
                        </code>
                    );
                },
                h1: (p) => <h3 className="text-lg font-bold text-dark-100 light-theme:text-dark-900 mt-5 mb-3 border-b border-dark-700/30 pb-2" {...p} />,
                h2: (p) => <h4 className="text-base font-bold text-dark-100 light-theme:text-dark-900 mt-4 mb-2" {...p} />,
                h3: (p) => <h5 className="text-sm font-semibold text-dark-100 light-theme:text-dark-900 mt-3 mb-2" {...p} />,
                strong: (p) => <strong className="font-bold text-dark-50 light-theme:text-dark-900" {...p} />,
                em: (p) => <em className="italic text-dark-200 light-theme:text-dark-700" {...p} />,
                p: (p) => <div className="my-2 leading-relaxed" {...p} />,
                pre: (p) => <div className="my-3" {...p} />,
                ul: (p) => <ul className="my-2 pl-5 space-y-1 list-disc marker:text-primary-400" {...p} />,
                ol: (p) => <ol className="my-2 pl-5 space-y-1 list-decimal marker:text-primary-400 marker:font-semibold" {...p} />,
                li: (p) => <li className="my-1 pl-2" {...p} />,
                a: (p) => (
                    <a
                        className="text-primary-400 hover:text-primary-300 hover:underline underline-offset-2 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...p}
                    />
                ),
                blockquote: (p) => (
                    <blockquote
                        className="my-3 pl-4 border-l-4 border-primary-500/50 italic text-dark-300 light-theme:text-dark-600 bg-dark-800/30 light-theme:bg-dark-100/50 py-2 pr-4 rounded-r-lg"
                        {...p}
                    />
                ),
                table: (p) => (
                    <div className="my-3 overflow-x-auto rounded-lg border border-dark-700/50">
                        <table className="min-w-full divide-y divide-dark-700/50" {...p} />
                    </div>
                ),
                thead: (p) => <thead className="bg-dark-800/50" {...p} />,
                tbody: (p) => <tbody className="divide-y divide-dark-700/30" {...p} />,
                tr: (p) => <tr className="hover:bg-dark-800/30 transition-colors" {...p} />,
                th: (p) => <th className="px-4 py-2 text-left text-xs font-semibold text-dark-200 uppercase tracking-wider" {...p} />,
                td: (p) => <td className="px-4 py-2 text-sm text-dark-300" {...p} />,
            }}
        >
            {displayedContent}
        </ReactMarkdown>
    );
});

const ThinkingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex py-2"
    >
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 shadow-lg">
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gradient-to-br from-primary-400 to-primary-500"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
            <span className="text-xs text-dark-400 ml-1">Thinking...</span>
        </div>
    </motion.div>
);

const ChatWindow = ({ messages, status, onDeleteMessage, onRegenerate }) => {
    console.log(">>> CHATWINDOW RENDER - messages.length:", messages?.length, "messages:", messages);

    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const scrollRef = useRef(null);
    const viewportRef = useRef(null);
    const [animatedMessageIds, setAnimatedMessageIds] = useState(new Set());
    const prevMessagesCount = useRef(messages.length);

    useEffect(() => {
        if (messages.length > prevMessagesCount.current) {
            const newMsg = messages[messages.length - 1];
            if (newMsg.role === 'assistant' && newMsg.id) {
                setAnimatedMessageIds(prev => new Set(prev).add(newMsg.id));
            }
        }
        prevMessagesCount.current = messages.length;
    }, [messages]);

    const scrollToBottom = (instant = false) => {
        scrollRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    };

    useEffect(() => {
        if (status === 'streaming') scrollToBottom(true);
        else if (messages.length > 0) scrollToBottom();
    }, [messages, status]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150 && messages.length > 0);
    };

    const getMessageContent = (m) => {
        if (!m) return '';
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.content)) return m.content.map(p => typeof p === 'string' ? p : p?.text || '').join('');
        if (m.parts) return m.parts.map(p => p.type === 'text' ? p.text : '').join('');
        return '';
    };

    const isThinking = status === 'submitted' || (status === 'streaming' && messages[messages.length - 1]?.role === 'user');

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-5 relative bg-dark-900 light-theme:bg-dark-50" onScroll={handleScroll} ref={viewportRef}>
            <div className="max-w-3xl w-full mx-auto px-4 flex flex-col gap-5 pb-4">
                <AnimatePresence initial={false}>
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-6 py-10"
                        >
                            <div className="relative w-14 h-14 flex items-center justify-center">
                                <motion.div
                                    className="absolute w-24 h-24 bg-primary-500/20 rounded-full blur-xl"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <Sparkles size={32} className="text-primary-400 relative z-10" />
                            </div>

                            <div className="max-w-md">
                                <h1 className="text-2xl font-bold text-dark-100 light-theme:text-dark-900 mb-2">
                                    How can I help you <span className="gradient-text">learn</span> today?
                                </h1>
                                <p className="text-dark-400 light-theme:text-dark-600">
                                    Ask questions, explore concepts, and discover insights with Kacademyx.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full max-w-md">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-dark-500">Try asking</span>
                                {['Explain quantum entanglement simply', 'How do neural networks learn?', 'The history of the Roman Empire'].map((text, i) => (
                                    <motion.button
                                        key={text}
                                        className="group flex items-center justify-between px-4 py-3 bg-dark-800/50 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 rounded-xl text-sm text-dark-300 light-theme:text-dark-600 hover:border-primary-500/50 hover:bg-dark-800 light-theme:hover:bg-dark-50 hover:text-dark-100 light-theme:hover:text-dark-900 transition-all duration-200"
                                        onClick={() => window.simulateInput?.(text)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                    >
                                        <span>{text}</span>
                                        <ArrowRight size={14} className="text-primary-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {messages.map((m, idx) => {
                                const isAssistant = m.role === 'assistant';
                                const content = getMessageContent(m);
                                const isNew = isAssistant && animatedMessageIds.has(m.id);
                                const isLast = idx === messages.length - 1;

                                return (
                                    <motion.div
                                        key={m.id || idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className={`flex ${isAssistant ? '' : 'justify-end'}`}
                                        onMouseEnter={() => setHoveredIdx(idx)}
                                        onMouseLeave={() => setHoveredIdx(null)}
                                    >
                                        <div className={`flex flex-col gap-2 ${isAssistant ? 'max-w-full' : 'max-w-[85%]'}`}>
                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                        ${isAssistant
                                                    ? 'bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 rounded-tl-sm text-dark-200 light-theme:text-dark-700 shadow-md'
                                                    : 'bg-gradient-to-br from-primary-500 to-primary-600 rounded-br-sm text-white shadow-lg shadow-primary-500/20'
                                                }`}
                                            >
                                                {isAssistant ? (
                                                    (() => {
                                                        const { thought, cleanContent } = parseThinking(content);
                                                        return (
                                                            <>
                                                                {thought && <ThinkingProcess content={thought} />}
                                                                <TypewriterText content={cleanContent || content} isNew={isNew} />
                                                            </>
                                                        );
                                                    })()
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{content}</p>
                                                )}
                                            </div>

                                            <div className={`flex items-center gap-2 transition-opacity duration-200 
                                                ${hoveredIdx === idx ? 'opacity-100' : 'opacity-0'} 
                                                ${isAssistant ? '' : 'justify-end'}
                                                ${(isLast && status === 'streaming') ? 'invisible' : 'visible'}
                                            `}>
                                                <button
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-dark-800 light-theme:bg-dark-100 border border-dark-700/50 light-theme:border-dark-200 text-dark-400 hover:text-dark-200 light-theme:hover:text-dark-700 hover:border-primary-500/30 transition-all duration-200"
                                                    onClick={() => navigator.clipboard.writeText(content)}
                                                    title="Copy"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                                {isAssistant && isLast && onRegenerate && (
                                                    <button
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-dark-800 light-theme:bg-dark-100 border border-dark-700/50 light-theme:border-dark-200 text-dark-400 hover:text-primary-400 hover:border-primary-500/30 transition-all duration-200"
                                                        onClick={onRegenerate}
                                                        title="Regenerate"
                                                    >
                                                        <RotateCcw size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-dark-800 light-theme:bg-dark-100 border border-dark-700/50 light-theme:border-dark-200 text-dark-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
                                                    onClick={() => onDeleteMessage(idx)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {isThinking && <ThinkingIndicator />}
                        </>
                    )}
                </AnimatePresence>
                <div ref={scrollRef} className="h-20" />
            </div>

            <AnimatePresence>
                {showScrollBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute bottom-6 right-6 w-11 h-11 flex items-center justify-center bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 rounded-full text-dark-400 hover:text-primary-400 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200"
                        onClick={() => scrollToBottom()}
                    >
                        <ArrowDown size={18} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWindow;
