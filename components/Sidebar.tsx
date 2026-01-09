import React from 'react';
import { TabView } from '../types';
import { LayoutDashboard, Sliders, Settings, Zap, Bot, Database } from 'lucide-react';

interface SidebarProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: TabView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: TabView.STRATEGY, label: 'Strategy Lab', icon: Zap },
    { id: TabView.BOTS, label: 'Live Bots', icon: Bot },
    { id: TabView.DATA, label: 'Data Explorer', icon: Database },
    { id: TabView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 lg:w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
          TF
        </div>
        <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight text-white">
          TradeForge
        </span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className={`hidden lg:block ml-3 font-medium ${isActive ? 'text-blue-400' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-3 cursor-pointer hover:bg-gray-800 transition">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
            <div className="hidden lg:block">
              <div className="text-sm font-medium text-white">Pro Trader</div>
              <div className="text-xs text-gray-500">Premium Plan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;