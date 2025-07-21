import { useState } from "react";
import { Calendar, Settings, Menu } from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; name: string; emoji?: string }>;
  userName: string;
}

export function Sidebar({activeTab, onTabChange, tabs, userName }: SidebarProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      {/* Mobile backdrop */}
      {
        
      }
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen bg-sidebar z-50 lg:relative lg:z-auto`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-semibold text-foreground">Welcome {userName}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{currentDate}</p>
                </div>
            </div>
          </div>

          {/* Navigation */}
          {
            <div className="flex-1 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      hover:bg-sidebar-hover
                      ${activeTab === tab.id ? 'bg-sidebar-active' : ''}
                    `}
                  >
                    {tab.emoji && <span className="mr-2">{tab.emoji}</span>}
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          }

          {/* Settings */}
          <div className="p-4 border-t border-border">
            {
              <button 
                className={`
                  flex items-center w-full px-3 py-2 text-sm rounded-md 
                  hover:bg-sidebar-hover transition-colors
                  ${activeTab === 'settings' ? 'bg-sidebar-active' : ''}
                `}
                onClick={() => onTabChange('settings')}
              >
                <Settings size={16} className="mr-2" />
                Settings
              </button>
            }
          </div>
        </div>
      </div>
    </>
  );
}