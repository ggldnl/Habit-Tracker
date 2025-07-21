import { useState, useEffect } from "react";
import { Moon, Sun, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";


interface SettingsProps {
  // onUpdateUserName: (name: string) => void;
  // userName: string;
  habitTrackerView: 'monthly' | 'yearly';
  onUpdateHabitTrackerView: (view: 'monthly' | 'yearly') => void;
}

// export function Settings({ onUpdateUserName, userName, habitTrackerView, onUpdateHabitTrackerView }: SettingsProps) {
export function Settings({ habitTrackerView, onUpdateHabitTrackerView }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(false);
  // const [name, setName] = useState(userName);
  // const [welcomeMessage, setWelcomeMessage] = useState("Track your habits, organize your lists, and stay productive.");
  const { toast } = useToast();

  // Toggle dark/light mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSave = () => {
    
    // onUpdateUserName(name);
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Settings</h2>
          <p className="text-muted-foreground mb-8">
            Customize your workspace to suit your preferences.
          </p>
        </div>

        <div className="space-y-6">

          {/*
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input 
              id="username" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your name"
            />
          </div>
          */}

          {/*
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea 
              id="welcome-message" 
              value={welcomeMessage} 
              onChange={(e) => setWelcomeMessage(e.target.value)} 
              placeholder="Customize your welcome message"
              className="min-h-[80px]"
            />
          </div>
          */}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="habit-view">Habit Tracker View</Label>
              <div className="text-sm text-muted-foreground">
                {habitTrackerView === 'monthly' ? "Monthly view" : "Yearly view"}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${habitTrackerView === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Monthly</span>
              <Switch 
                id="habit-view" 
                checked={habitTrackerView === 'yearly'} 
                onCheckedChange={(checked) => onUpdateHabitTrackerView(checked ? 'yearly' : 'monthly')} 
              />
              <span className={`text-sm ${habitTrackerView === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Yearly</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Appearance</Label>
              <div className="text-sm text-muted-foreground">
                {darkMode ? "Dark mode" : "Light mode"}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Sun size={18} className={darkMode ? "text-muted-foreground" : "text-foreground"} />
              <Switch 
                id="dark-mode" 
                checked={darkMode} 
                onCheckedChange={setDarkMode} 
              />
              <Moon size={18} className={darkMode ? "text-foreground" : "text-muted-foreground"} />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save size={16} className="mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}