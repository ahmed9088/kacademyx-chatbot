'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, Brain, Zap, MessageSquare } from 'lucide-react';

const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    { icon: Brain, title: 'AI-Powered Learning', desc: 'Get intelligent answers tailored to your learning style' },
    { icon: BookOpen, title: 'Multi-Subject Support', desc: 'From science to humanities, explore any topic' },
    { icon: Zap, title: 'Instant Responses', desc: 'Quick, accurate answers when you need them' },
    { icon: MessageSquare, title: 'Natural Conversations', desc: 'Learn through intuitive dialogue' },
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
          className="bg-dark-800 border border-dark-700/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-dark-700/50">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 icon-btn"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl text-white shadow-glow">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-100">About Kacademyx</h2>
                <p className="text-sm text-dark-400">Your AI Learning Companion</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-dark-300 text-sm leading-relaxed mb-6">
              Kacademyx is an intelligent tutoring platform powered by advanced AI, designed to make learning
              accessible, engaging, and personalized for everyone.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-3 bg-dark-700/30 border border-dark-600/50 rounded-xl hover:border-primary-500/30 hover:bg-dark-700/50 transition-all duration-200"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-primary-500/10 rounded-lg text-primary-400 mb-2">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-dark-200 mb-1">{title}</h3>
                  <p className="text-xs text-dark-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-dark-700/50 flex justify-between items-center">
            <span className="text-xs text-dark-500">Version 2.5.0</span>
            <button
              onClick={onClose}
              className="btn-primary px-4 py-2 text-sm"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AboutModal;
