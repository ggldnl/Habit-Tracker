import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  name: string;
  color: string;
  completions: boolean[];
}

const COLORS = [
  { name: 'red', value: 'task-red' },
  { name: 'orange', value: 'task-orange' },
  { name: 'yellow', value: 'task-yellow' },
  { name: 'yellow2', value: 'task-yellow2' },
  { name: 'lime', value: 'task-lime' },
  { name: 'green', value: 'task-green' },
  { name: 'green2', value: 'task-green2' },
  { name: 'teal', value: 'task-teal' },
  { name: 'cyan', value: 'task-cyan' },
  { name: 'blue', value: 'task-blue' },
  { name: 'blue2', value: 'task-blue2' },
  { name: 'indigo', value: 'task-indigo' },
  { name: 'purple', value: 'task-purple' },
  { name: 'purple2', value: 'task-purple2' },
];

// Generate a full year of boxes (7 rows, ~52 columns)
const generateYearOfBoxes = () => new Array(7 * 52).fill(false);

const generateMonthOfBoxes = () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Array(daysInMonth).fill(false);
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface HabitTrackerProps {
  view: 'monthly' | 'yearly';
}

export function HabitTracker({ view }: HabitTrackerProps) {
  const { toast } = useToast();
  const currentDate = new Date();
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: '1',
      name: 'Exercise 🏃‍♂️',
      color: 'task-green',
      completions: generateYearOfBoxes().map((_, i) => i < 50 ? Math.random() > 0.5 : false)
    },
    {
      id: '2',
      name: 'Read 📚',
      color: 'task-blue',
      completions: generateYearOfBoxes().map((_, i) => i < 50 ? Math.random() > 0.3 : false)
    }
  ]);

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const addHabit = () => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: 'New Habit',
      color: 'task-red',
      completions: view === 'monthly' ? generateMonthOfBoxes() : generateYearOfBoxes()
    };
    setHabits([...habits, newHabit]);
  };

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter(habit => habit.id !== habitId));
    toast({
      title: "Habit deleted",
      description: "The habit has been removed.",
    });
  };

  const toggleCompletion = (habitId: string, dayIndex: number) => {
    const today = new Date();
    
    if (view === 'monthly') {
      // For monthly view, don't allow clicking on future dates within the month
      if (dayIndex >= today.getDate()) {
        return;
      }
    } else {
      // For yearly view, don't allow clicking on future dates
      if (dayIndex > daysSinceStart) return;
    }
    
    setHabits(habits.map(habit => 
      habit.id === habitId 
        ? { ...habit, completions: habit.completions.map((completed, i) => 
            i === dayIndex ? !completed : completed
          )}
        : habit
    ));
  };

  const updateHabit = (habitId: string, name: string, color: string) => {
    setHabits(habits.map(habit => 
      habit.id === habitId ? { ...habit, name, color } : habit
    ));
    setEditingHabit(null);
    toast({
      title: "Habit updated",
      description: "Changes have been saved.",
    });
  };

  const startEditing = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditColor(habit.color);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Habit Tracker</h2>
        <Button
          onClick={addHabit}
          variant="ghost"
          className="hover:bg-sidebar-hover"
        >
          <Plus size={16} className="mr-2" />
          Add Habit
        </Button>
      </div>

      <div className="space-y-4">
        {habits.map((habit) => (
          <div key={habit.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-foreground">{habit.name}</span>
              </div>
              
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(habit)}
                      className="hover:bg-sidebar-hover"
                    >
                      <Edit2 size={14} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Habit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Name</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Color</label>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {COLORS.map((color) => (
                            <button
                              key={color.name}
                              onClick={() => setEditColor(color.value)}
                              style={{ backgroundColor: `hsl(var(--color-${color.name}))` }}
                              className={`
                                w-6 h-6 rounded-full border-2
                                ${editColor === color.value ? 'border-foreground' : 'border-transparent'}
                                hover:scale-110 transition-transform
                              `}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setEditingHabit(null);
                            deleteHabit(habit.id);
                          }}
                        >
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                        <Button
                          onClick={() => editingHabit && updateHabit(editingHabit.id, editName, editColor)}
                          className="flex-1"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {view === 'yearly' ? (
              <>
                {/* Month labels */}
                <div className="flex mb-1 ml-8">
                  {Array.from({ length: 52 }, (_, weekIndex) => {
                    const weekDate = new Date(startOfYear);
                    weekDate.setDate(weekDate.getDate() + weekIndex * 7);
                    const month = weekDate.getMonth();
                    const isFirstWeekOfMonth = weekDate.getDate() <= 7;
                    
                    return (
                      <div key={weekIndex} className="w-3 text-xs text-muted-foreground text-center">
                        {isFirstWeekOfMonth ? MONTHS[month] : ''}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 mr-2">
                    {DAYS.map((day, index) => (
                      <div key={day} className="h-3 text-xs text-muted-foreground flex items-center">
                        {index % 2 === 1 ? day : ''} {/* Show every other day to avoid crowding */}
                      </div>
                    ))}
                  </div>
                  
                  {/* Habit grid */}
                  <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2" style={{maxHeight: '200px'}}>
                    {habit.completions.map((completed, index) => {
                      const colorName = habit.color.replace('task-', '');
                      const isFuture = index > daysSinceStart;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => toggleCompletion(habit.id, index)}
                          disabled={isFuture}
                          style={{
                            backgroundColor: completed 
                              ? `hsl(var(--color-${colorName}))` 
                              : isFuture 
                                ? 'hsl(var(--muted) / 0.3)'
                                : `hsl(var(--color-${colorName}) / 0.15)`,
                            borderColor: `hsl(var(--color-${colorName}) / 0.3)`
                          }}
                          className={`w-3 h-3 border rounded-sm transition-colors ${
                            isFuture ? 'cursor-not-allowed' : 'hover:opacity-80'
                          }`}
                          title={`Day ${index + 1}${isFuture ? ' (Future)' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Monthly view */}
                <div className="space-y-2">
                  {(() => {
                    const today = new Date();
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    const monthlyCompletions = habit.completions.slice(0, daysInMonth);
                    
                    return (
                      <>
                        {/* Day numbers */}
                        <div className="flex gap-1">
                          {monthlyCompletions.map((_, dayIndex) => (
                            <div key={dayIndex} className="w-4 text-xs text-muted-foreground text-center">
                              {dayIndex + 1}
                            </div>
                          ))}
                        </div>
                        
                        {/* Habit boxes */}
                        <div className="flex gap-1">
                          {monthlyCompletions.map((completed, index) => {
                            const colorName = habit.color.replace('task-', '');
                            const isFuture = index >= today.getDate();
                            
                            return (
                              <button
                                key={index}
                                onClick={() => toggleCompletion(habit.id, index)}
                                disabled={isFuture}
                                style={{
                                  backgroundColor: completed 
                                    ? `hsl(var(--color-${colorName}))` 
                                    : isFuture 
                                      ? 'hsl(var(--muted) / 0.3)'
                                      : `hsl(var(--color-${colorName}) / 0.15)`,
                                  borderColor: `hsl(var(--color-${colorName}) / 0.3)`
                                }}
                                className={`w-4 h-4 border rounded-sm transition-colors ${
                                  isFuture ? 'cursor-not-allowed' : 'hover:opacity-80'
                                }`}
                                title={`Day ${index + 1}${isFuture ? ' (Future)' : ''}`}
                              />
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}