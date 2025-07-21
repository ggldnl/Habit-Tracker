import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Welcome } from "@/components/Welcome";
import { HabitTracker } from "@/components/HabitTracker";
import { Lists } from "@/components/Lists";
import { Settings } from "@/components/Settings";
import { Toaster } from "@/components/ui/toaster";

const tabs = [
  { id: 'welcome', name: 'Welcome', emoji: '🏠' },
  { id: 'habits', name: 'Habit Tracker', emoji: '📊' },
  { id: 'lists', name: 'Lists', emoji: '📝' }
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('welcome');
  const [userName, setUserName] = useState('User');
  const [habitTrackerView, setHabitTrackerView] = useState<'monthly' | 'yearly'>('yearly');

  // Set light mode by default
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'welcome':
        return <Welcome />;
      case 'habits':
        return <HabitTracker view={habitTrackerView} />;
      case 'lists':
        return <Lists />;
      case 'settings':
        return <Settings 
          onUpdateUserName={setUserName} 
          userName={userName}
          habitTrackerView={habitTrackerView}
          onUpdateHabitTrackerView={setHabitTrackerView}
        />;
      default:
        return <Welcome />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
        userName={userName}
      />
      
      <main className={`flex-1 transition-all duration-200 ease-in-out`}>
        {renderActiveTab()}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
