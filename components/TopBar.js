'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Info, Download, RefreshCw, LogOut, ChevronDown } from 'lucide-react';

const TopBar = ({ title, onToggleSidebar, onToggleAbout, onExport, onRegenerate, onLogout, user }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-dark-800/80 light-theme:bg-white/80 backdrop-blur-xl border-b border-dark-700/50 light-theme:border-dark-200/50 sticky top-0 z-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="lg:hidden icon-btn flex-shrink-0"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">AI Tutor</span>
          <h2 className="text-sm font-semibold text-dark-100 light-theme:text-dark-900 truncate pr-2">
            {title || 'New Conversation'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <button className="icon-btn" onClick={onToggleAbout} title="About">
            <Info size={18} strokeWidth={1.75} />
          </button>
          <button className="icon-btn" onClick={onExport} title="Export chat">
            <Download size={18} strokeWidth={1.75} />
          </button>
          <button className="icon-btn" onClick={onRegenerate} title="Regenerate response">
            <RefreshCw size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="w-px h-6 bg-dark-700/50 light-theme:bg-dark-200/50 mx-1" />

        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-dark-700/50 light-theme:hover:bg-dark-100 transition-all duration-200"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full text-white font-bold text-xs">
              {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-dark-100 light-theme:text-dark-900">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-dark-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-dark-800 light-theme:bg-white border border-dark-700/50 light-theme:border-dark-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in">
              <div className="flex items-center gap-3 p-3 border-b border-dark-700/50 light-theme:border-dark-200">
                <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full text-white font-bold text-sm">
                  {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-semibold text-dark-100 light-theme:text-dark-900 truncate">
                    {user?.displayName || 'User'}
                  </span>
                  <span className="text-xs text-dark-400 truncate">{user?.email}</span>
                </div>
              </div>
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-dark-400 hover:bg-dark-700/50 light-theme:hover:bg-dark-100 hover:text-red-400 transition-all duration-200"
                onClick={handleLogout}
              >
                <LogOut size={16} strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
