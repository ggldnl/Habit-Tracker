import { useState, useEffect } from "react";
import { Moon, Sun, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SettingsProps {
  onUpdateHabitTrackerView?: (view: 'month view' | 'year view') => void;
}

export function Settings({ onUpdateHabitTrackerView }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [habitTrackerView, setHabitTrackerView] = useState<'month view' | 'year view'>(() => {
    return (localStorage.getItem("habitTrackerView") as 'month view' | 'year view') || "month view";
  });

  const { toast } = useToast();

  // Toggle dark/light mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Persist habitTrackerView and notify parent if needed
  useEffect(() => {
    localStorage.setItem("habitTrackerView", habitTrackerView);
    onUpdateHabitTrackerView?.(habitTrackerView);
  }, [habitTrackerView, onUpdateHabitTrackerView]);

  const handleSave = () => {
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="habit-view">Habit Tracker View</Label>
              <div className="text-sm text-muted-foreground capitalize">
                {habitTrackerView}
              </div>
            </div>

            <Select value={habitTrackerView} onValueChange={setHabitTrackerView}>
              <SelectTrigger className="w-[150px]" id="habit-view">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month view">Month view</SelectItem>
                <SelectItem value="year view">Year view</SelectItem>
              </SelectContent>
            </Select>
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
