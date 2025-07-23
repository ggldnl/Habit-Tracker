// HabitTracker.tsx

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, RotateCcw, GripVertical } from "lucide-react";
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
  deleteDay,
  clearHabit
} from "../lib/api";
import { Habit, Day, Color } from "../lib/types";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface HabitTrackerProps {
  view: 'month view' | 'year view';
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
  
  // For drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // For auto-scrolling
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Cleanup scroll interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Auto-scroll functionality
  const startAutoScroll = (clientY: number) => {
    const scrollZone = 100; // pixels from edge to trigger scroll
    const scrollSpeed = 10; // pixels per interval
    const intervalDelay = 16; // ~60fps
    
    const scroll = () => {
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (clientY < scrollZone && scrollTop > 0) {
        // Scroll up
        window.scrollBy(0, -scrollSpeed);
      } else if (clientY > viewportHeight - scrollZone && scrollTop + viewportHeight < documentHeight) {
        // Scroll down
        window.scrollBy(0, scrollSpeed);
      }
    };
    
    // Clear any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    
    // Start new interval
    scrollIntervalRef.current = setInterval(scroll, intervalDelay);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    
    // Start auto-scroll based on mouse position
    startAutoScroll(e.clientY);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    stopAutoScroll();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newHabits = [...habits];
    const draggedItem = newHabits[draggedIndex];
    
    // Remove the dragged item
    newHabits.splice(draggedIndex, 1);
    
    // Insert at new position
    newHabits.splice(dropIndex, 0, draggedItem);
    
    setHabits(newHabits);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Add mouse move handler for when dragging outside of drop zones
  const handleDragMove = (e: React.DragEvent) => {
    if (draggedIndex !== null) {
      startAutoScroll(e.clientY);
    }
  };

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

  const clearHabitHandler = async (habitId: number) => {
    try {
      await clearHabit(habitId);
      // Remove all days associated with this habit from local state
      setDays(days.filter(day => day.habit_id !== habitId));
      toast({
        title: "Habit cleared",
        description: "All completions for this habit have been removed.",
      });
    } catch (error) {
      console.error('Failed to clear habit:', error);
      toast({
        title: "Error",
        description: "Failed to clear habit completions.",
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

  const generateDateRange = (view: 'month view' | 'year view'): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    
    if (view === 'month view') {
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

  // Helper function to calculate month label positions for yearly view with improved spacing
  const getMonthLabelPositions = (dateRange: Date[]) => {
    const boxSize = 12; // w-3 h-3 = 12px
    const gapSize = 4; // gap-1 = 4px
    const dayLabelsWidth = 32; // Approximate width of day labels column (mr-2)
    
    // Calculate total grid width: number of columns * (box + gap) - final gap
    const totalDays = dateRange.length;
    const totalColumns = Math.ceil(totalDays / 7);
    const totalGridWidth = totalColumns * (boxSize + gapSize) - gapSize;
    
    // Divide equally among 12 months
    const monthWidth = totalGridWidth / 12;
    
    const monthPositions: { month: string; position: number }[] = [];
    
    for (let i = 0; i < 12; i++) {
      monthPositions.push({
        month: MONTHS[i],
        position: dayLabelsWidth + (i * monthWidth)
      });
    }
    
    return monthPositions;
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
    <div className="p-6 space-y-6" onDragOver={handleDragMove}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Habit Tracker - {view === 'year view' ? 'Year View' : 'Month View'}</h2>
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
        {habits.map((habit, habitIndex) => {
          const habitColor = getColorById(habit.habit_color);
          const isDragging = draggedIndex === habitIndex;
          const isDropTarget = dragOverIndex === habitIndex;
          
          return (
            <div 
              key={habit.habit_id}
              draggable
              onDragStart={(e) => handleDragStart(e, habitIndex)}
              onDragOver={(e) => handleDragOver(e, habitIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, habitIndex)}
              onDragEnd={handleDragEnd}
              className={`
                border border-border rounded-lg p-4 transition-all duration-200 cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-50 scale-95' : ''}
                ${isDropTarget && !isDragging ? 'border-blue-400 border-2 border-dashed' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    title="Drag to reorder"
                  >
                    <GripVertical size={20} />
                  </div>
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
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingHabit(null);
                              deleteHabitHandler(habit.habit_id);
                            }}
                            className="border border-border hover:bg-muted/50"
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingHabit(null);
                              clearHabitHandler(habit.habit_id);
                            }}
                            className="border border-border hover:bg-muted/50"
                          >
                            <RotateCcw size={14} />
                          </Button>
                          <Button
                            onClick={() => editingHabit && updateHabitHandler(editingHabit.habit_id, editName, editColor)}
                            className="flex-1 border border-border"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {view === 'year view' ? (
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Month labels - positioned with equal spacing */}
                    <div className="relative mb-1 h-4">
                      {getMonthLabelPositions(dateRange).map(({ month, position }) => (
                        <div 
                          key={month}
                          className="absolute text-xs text-muted-foreground"
                          style={{ left: `${position}px` }}
                        >
                          {month}
                        </div>
                      ))}
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
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}