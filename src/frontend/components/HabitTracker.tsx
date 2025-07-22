import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchHabits, 
  fetchDays, 
  fetchColors,
  addHabit, 
  updateHabitName, 
  updateHabitColor, 
  deleteHabit as deleteHabitApi,
  addDay,
  deleteDay
} from "../lib/api";
import { Habit, Day, Color } from "../lib/types";

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
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(0);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [habitsData, daysData, colorsData] = await Promise.all([
          fetchHabits(),
          fetchDays(),
          fetchColors()
        ]);
        
        setHabits(habitsData);
        setDays(daysData);
        setColors(colorsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Error",
          description: "Failed to load habit data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    try {
      const [month, day, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    } catch {
      return null;
    }
  };

  const getDayCompletion = (habitId: number, date: Date): boolean => {
    const dateString = formatDate(date);
    return days.some(day => day.habit_id === habitId && day.day_value === dateString);
  };

  const getColorById = (colorId: number): Color | undefined => {
    return colors.find(color => color.color_id === colorId);
  };

  const addHabitHandler = async () => {
    try {
      // Use the first available color, or fallback to ID 1
      const defaultColorId = colors.length > 0 ? colors[0].color_id : 1;
      const newHabit = await addHabit('New Habit', defaultColorId);
      setHabits([...habits, newHabit]);
      toast({
        title: "Habit added",
        description: "New habit has been created.",
      });
    } catch (error) {
      console.error('Failed to add habit:', error);
      toast({
        title: "Error",
        description: "Failed to add habit.",
        variant: "destructive"
      });
    }
  };

  const deleteHabitHandler = async (habitId: number) => {
    try {
      await deleteHabitApi(habitId);
      setHabits(habits.filter(habit => habit.habit_id !== habitId));
      // Also remove associated days
      setDays(days.filter(day => day.habit_id !== habitId));
      toast({
        title: "Habit deleted",
        description: "The habit has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete habit:', error);
      toast({
        title: "Error",
        description: "Failed to delete habit.",
        variant: "destructive"
      });
    }
  };

  const toggleCompletion = async (habitId: number, date: Date) => {
    const today = new Date();
    
    // Don't allow future dates
    if (date > today) return;
    
    const dateString = formatDate(date);
    const existingDay = days.find(day => day.habit_id === habitId && day.day_value === dateString);
    
    try {
      if (existingDay) {
        // Remove completion
        await deleteDay(existingDay.day_id);
        setDays(days.filter(day => day.day_id !== existingDay.day_id));
      } else {
        // Add completion
        const newDay = await addDay(habitId, dateString, 1.0);
        setDays([...days, newDay]);
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      toast({
        title: "Error",
        description: "Failed to update habit completion.",
        variant: "destructive"
      });
    }
  };

  const updateHabitHandler = async (habitId: number, name: string, colorId: number) => {
    try {
      await Promise.all([
        updateHabitName(habitId, name),
        updateHabitColor(habitId, colorId)
      ]);
      
      setHabits(habits.map(habit => 
        habit.habit_id === habitId 
          ? { ...habit, habit_name: name, habit_color: colorId } 
          : habit
      ));
      setEditingHabit(null);
      toast({
        title: "Habit updated",
        description: "Changes have been saved.",
      });
    } catch (error) {
      console.error('Failed to update habit:', error);
      toast({
        title: "Error",
        description: "Failed to update habit.",
        variant: "destructive"
      });
    }
  };

  const startEditing = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.habit_name);
    setEditColor(habit.habit_color);
  };

  const generateDateRange = (view: 'monthly' | 'yearly'): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    
    if (view === 'monthly') {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day));
      }
    } else {
      // Yearly view - generate all days of the year
      const year = today.getFullYear();
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          dates.push(new Date(year, month, day));
        }
      }
    }
    
    return dates;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading habits...</div>
      </div>
    );
  }

  const dateRange = generateDateRange(view);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Habit Tracker</h2>
        <Button
          onClick={addHabitHandler}
          variant="ghost"
          className="hover:bg-sidebar-hover"
        >
          <Plus size={16} className="mr-2" />
          Add Habit
        </Button>
      </div>

      <div className="space-y-4">
        {habits.map((habit) => {
          const habitColor = getColorById(habit.habit_color);
          
          return (
            <div key={habit.habit_id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-foreground">{habit.habit_name}</span>
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
                            {colors.map((color) => (
                              <button
                                key={color.color_id}
                                onClick={() => setEditColor(color.color_id)}
                                style={{ backgroundColor: color.color_value }}
                                className={`
                                  w-6 h-6 rounded-full border-2
                                  ${editColor === color.color_id ? 'border-foreground' : 'border-transparent'}
                                  hover:scale-110 transition-transform
                                `}
                                title={color.color_name}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between space-x-4">
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setEditingHabit(null);
                              deleteHabitHandler(habit.habit_id);
                            }}
                          >
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                          <Button
                            onClick={() => editingHabit && updateHabitHandler(editingHabit.habit_id, editName, editColor)}
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
                          {index % 2 === 1 ? day : ''}
                        </div>
                      ))}
                    </div>
                    
                    {/* Habit grid */}
                    <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto pb-2" style={{maxHeight: '200px'}}>
                      {dateRange.map((date, index) => {
                        const completed = getDayCompletion(habit.habit_id, date);
                        const isFuture = date > currentDate;
                        const dayOfWeek = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
                        
                        return (
                          <button
                            key={index}
                            onClick={() => toggleCompletion(habit.habit_id, date)}
                            disabled={isFuture}
                            style={{
                              backgroundColor: completed 
                                ? habitColor?.color_value || '#gray' 
                                : isFuture 
                                  ? 'hsl(var(--muted) / 0.3)'
                                  : `${habitColor?.color_value || '#gray'}20`,
                              borderColor: `${habitColor?.color_value || '#gray'}50`,
                              gridRow: dayOfWeek + 1
                            }}
                            className={`w-3 h-3 border rounded-sm transition-colors ${
                              isFuture ? 'cursor-not-allowed' : 'hover:opacity-80'
                            }`}
                            title={`${formatDate(date)}${isFuture ? ' (Future)' : ''}`}
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
                    <div className="flex gap-1">
                      {dateRange.map((date, dayIndex) => (
                        <div key={dayIndex} className="w-4 text-xs text-muted-foreground text-center">
                          {date.getDate()}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-1">
                      {dateRange.map((date, index) => {
                        const completed = getDayCompletion(habit.habit_id, date);
                        const isFuture = date > currentDate;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => toggleCompletion(habit.habit_id, date)}
                            disabled={isFuture}
                            style={{
                              backgroundColor: completed 
                                ? habitColor?.color_value || '#gray' 
                                : isFuture 
                                  ? 'hsl(var(--muted) / 0.3)'
                                  : `${habitColor?.color_value || '#gray'}20`,
                              borderColor: `${habitColor?.color_value || '#gray'}50`
                            }}
                            className={`w-4 h-4 border rounded-sm transition-colors ${
                              isFuture ? 'cursor-not-allowed' : 'hover:opacity-80'
                            }`}
                            title={`${formatDate(date)}${isFuture ? ' (Future)' : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}