import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import HumanFutures from './components/HumanFutures';
import NarrativeMode from './components/NarrativeMode';
import WhatIfMode from './components/WhatIfMode';
import AdminPanel from './components/AdminPanel';
import Icon from './components/Icon';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    return path.slice(1);
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'globe' },
    { id: 'human-futures', label: 'Human Futures', path: '/human-futures', icon: 'users' },
    { id: 'narrative', label: 'Narrative Mode', path: '/narrative', icon: 'file-text' },
    { id: 'what-if', label: 'What If Mode', path: '/what-if', icon: 'zap' },
    { id: 'admin', label: 'Admin Panel', path: '/admin', icon: 'settings' }
  ];

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient">
                  Climate Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                AI-Powered Climate Futures
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.path)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-climate-500 text-climate-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon name={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/human-futures" element={<HumanFutures />} />
          <Route path="/narrative" element={<NarrativeMode />} />
          <Route path="/what-if" element={<WhatIfMode />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Climate Dashboard - Exploring the intersection of climate science and human imagination</p>
            <p className="mt-2">Built with React, Node.js, and OpenAI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
