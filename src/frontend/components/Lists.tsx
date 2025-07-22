import { useState, useEffect, useRef } from "react";
import { Plus, X, Edit2, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchLists, 
  fetchEntries, 
  fetchColors, 
  addList, 
  deleteList, 
  addEntry, 
  toggleEntry, 
  deleteEntry, 
  updateListColor,
  updateListName,
  updateEntryText,
} from "../lib/api";
import { List, Entry, Color } from "../lib/types";

interface ListWithItems extends List {
  items: Entry[];
}

export function Lists() {
  const { toast } = useToast();
  const [lists, setLists] = useState<ListWithItems[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingList, setEditingList] = useState<ListWithItems | null>(null);
  const [editColor, setEditColor] = useState('');
  const [editName, setEditName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // For drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // For auto-scrolling
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // For managing input focus
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Cleanup scroll interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listsData, entriesData, colorsData] = await Promise.all([
        fetchLists(),
        fetchEntries(),
        fetchColors()
      ]);

      // Combine lists with their entries
      const listsWithItems: ListWithItems[] = listsData.map(list => ({
        ...list,
        items: entriesData.filter(entry => entry.list_id === list.list_id)
      }));

      setLists(listsWithItems);
      setColors(colorsData);

    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load data from server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

    const newLists = [...lists];
    const draggedItem = newLists[draggedIndex];
    
    // Remove the dragged item
    newLists.splice(draggedIndex, 1);
    
    // Insert at new position
    newLists.splice(dropIndex, 0, draggedItem);
    
    setLists(newLists);
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

  const handleAddList = async () => {
    try {
      // Use a random color from available colors, or default color ID
      const randomColorId = colors.length > 0 
        ? colors[Math.floor(Math.random() * colors.length)].color_id 
        : 1;
      
      const newList = await addList(`New List`, randomColorId);
      
      setLists(prev => [...prev, { ...newList, items: [] }]);
      
      /*
      toast({
        title: "Success",
        description: "New list created.",
      });
      */
      
    } catch (error) {
      console.error('Failed to add list:', error);
      toast({
        title: "Error",
        description: "Failed to create list.",
        variant: "destructive"
      });
    }
  };

  const handleAddItem = async (listId: number) => {
    try {
      const newEntry = await addEntry(listId, '', false);
      
      setLists(prev => prev.map(list => 
        list.list_id === listId 
          ? { ...list, items: [...list.items, newEntry] }
          : list
      ));

      // Focus on the new item after a brief delay
      setTimeout(() => {
        const inputKey = `${listId}-${newEntry.entry_id}`;
        inputRefs.current[inputKey]?.focus();
      }, 100);

    } catch (error) {
      console.error('Failed to add item:', error);
      toast({
        title: "Error",
        description: "Failed to add item.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateItem = async (listId: number, itemId: number, text: string) => {
    try {
      // Update locally first for better UX
      setLists(prev => prev.map(list => 
        list.list_id === listId 
          ? {
              ...list,
              items: list.items.map(item => 
                item.entry_id === itemId ? { ...item, entry_text: text } : item
              )
            }
          : list
      ));

      await updateEntryText(itemId, text);

    } catch (error) {
      console.error('Failed to update item:', error);
      toast({
        title: "Error",
        description: "Failed to update item.",
        variant: "destructive"
      });
    }
  };

  const handleItemKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    listId: number, 
    itemId: number, 
    currentText: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Update the item text
      handleUpdateItem(listId, itemId, currentText);
      
      // Unfocus the input
      e.currentTarget.blur();
    }
  };

  const handleItemBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    listId: number, 
    itemId: number
  ) => {
    const currentText = e.currentTarget.value;
    handleUpdateItem(listId, itemId, currentText);
  };

  const handleToggleItem = async (listId: number, itemId: number) => {
    try {
      const updatedEntry = await toggleEntry(itemId);
      
      setLists(prev => prev.map(list => 
        list.list_id === listId 
          ? {
              ...list,
              items: list.items.map(item => 
                item.entry_id === itemId ? updatedEntry : item
              )
            }
          : list
      ));

    } catch (error) {
      console.error('Failed to toggle item:', error);
      toast({
        title: "Error",
        description: "Failed to update item.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveItem = async (listId: number, itemId: number) => {
    try {
      
      setLists(prev => prev.map(list => 
        list.list_id === listId 
          ? { ...list, items: list.items.filter(item => item.entry_id !== itemId) }
          : list
      ));
      
      await deleteEntry(itemId);

      /*
      toast({
        title: "Success",
        description: "Item deleted.",
      });
      */

    } catch (error) {
      console.error('Failed to remove item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateListColor = async (listId: number, colorId: number) => {
    try {
      // Update locally first for better UX
      setLists(prev => prev.map(list => 
        list.list_id === listId ? { ...list, list_color: colorId } : list
      ));
      
      setIsEditDialogOpen(false);
      setEditingList(null);

      await updateListColor(listId, colorId);
      
      /*
      toast({
        title: "Success",
        description: "List color updated.",
      });
      */
      
    } catch (error) {
      console.error('Failed to update list color:', error);
      toast({
        title: "Error",
        description: "Failed to update list color.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateListName = async (listId: number, newName: string) => {
    try {
      // Update locally first for better UX
      setLists(prev => prev.map(list => 
        list.list_id === listId ? { ...list, list_name: newName } : list
      ));

      await updateListName(listId, newName);
      
      /*
      toast({
        title: "Success",
        description: "List name updated.",
      });
      */
      
    } catch (error) {
      console.error('Failed to update list name:', error);
      toast({
        title: "Error",
        description: "Failed to update list name.",
        variant: "destructive"
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!editingList) return;
    
    // Update both name and color
    await Promise.all([
      handleUpdateListName(editingList.list_id, editName),
      handleUpdateListColor(editingList.list_id, parseInt(editColor))
    ]);
    
    setIsEditDialogOpen(false);
    setEditingList(null);
  };

  const handleRemoveList = async (listId: number) => {
    try {
      await deleteList(listId);
      
      setLists(prev => prev.filter(list => list.list_id !== listId));
      setIsEditDialogOpen(false);
      setEditingList(null);
      
      /*
      toast({
        title: "List deleted",
        description: "The list has been removed.",
      });
      */
    
    } catch (error) {
      console.error('Failed to remove list:', error);
      toast({
        title: "Error",
        description: "Failed to delete list.",
        variant: "destructive"
      });
    }
  };

  const startEditing = (list: ListWithItems) => {
    setEditingList(list);
    setEditColor(list.list_color.toString());
    setEditName(list.list_name);
    setIsEditDialogOpen(true);
  };

  const getColorValue = (colorId: number): string => {
    const color = colors.find(c => c.color_id === colorId);
    return color?.color_value || '#FF0000';
  };

  const getColorName = (colorId: number): string => {
    const color = colors.find(c => c.color_id === colorId);
    return color?.color_name || '';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" onDragOver={handleDragMove}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Lists</h2>
        <Button
          onClick={handleAddList}
          variant="ghost"
          className="hover:bg-sidebar-hover"
        >
          <Plus size={16} className="mr-2" />
          Add List
        </Button>
      </div>

      <div className="space-y-6">
        {lists.map((list, index) => {
          const colorValue = getColorValue(list.list_color);
          const isDragging = draggedIndex === index;
          const isDropTarget = dragOverIndex === index;
          
          return (
            <div 
              key={list.list_id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{ backgroundColor: `${colorValue}20` }} // 20% opacity
              className={`
                border border-border rounded-lg p-4 transition-all duration-200 cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-50 scale-95' : ''}
                ${isDropTarget && !isDragging ? 'border-blue-400 border-2 border-dashed' : ''}
              `}
            >
              <div className="flex items-center mb-4">
                {/* Drag handle */}
                <div className="flex items-center mr-3 text-muted-foreground hover:text-foreground transition-colors">
                  <GripVertical size={20} />
                </div>
                
                <div className="flex items-center justify-between flex-1">
                  <h3 className="font-medium">{list.list_name}</h3>
                  <div className="flex items-center space-x-2">
                    <Dialog open={isEditDialogOpen && editingList?.list_id === list.list_id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) {
                        setEditingList(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(list)}
                          className="hover:bg-sidebar-hover"
                        >
                          <Edit2 size={14} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit List</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground">Name</label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="mt-2 focus:bg-sidebar-hover hover:bg-sidebar-hover focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-150"
                              placeholder="Enter list name..."
                            />
                          </div>
                          <div>
                            <div className="grid grid-cols-5 gap-2">
                              {colors.map((color) => (
                                <button
                                  key={color.color_id}
                                  onClick={() => setEditColor(color.color_id.toString())}
                                  style={{ backgroundColor: color.color_value }}
                                  className={`
                                    w-6 h-6 rounded-full border-2
                                    ${editColor === color.color_id.toString() ? 'border-foreground' : 'border-transparent'}
                                    hover:scale-110 transition-transform
                                  `}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between space-x-4">
                            <Button
                              variant="destructive"
                              onClick={() => handleRemoveList(list.list_id)}
                            >
                              <X size={14} className="mr-1" /> Delete List
                            </Button>
                            <Button
                              onClick={handleSaveChanges}
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
              </div>

              <div className="space-y-0.5 ml-8">
                {list.items.map((item) => {
                  const inputKey = `${list.list_id}-${item.entry_id}`;
                  return (
                    <div key={item.entry_id} className="flex items-center space-x-2 group">
                      <Checkbox
                        checked={item.entry_checked}
                        onCheckedChange={() => handleToggleItem(list.list_id, item.entry_id)}
                        style={{ 
                          borderColor: colorValue,
                          backgroundColor: item.entry_checked ? colorValue : 'transparent'
                        }}
                        className="mt-0.5 rounded-sm data-[state=checked]:text-white data-[state=checked]:border-0"
                      />
                      <Input
                        ref={(el) => {
                          inputRefs.current[inputKey] = el;
                        }}
                        defaultValue={item.entry_text}
                        onKeyDown={(e) => handleItemKeyPress(e, list.list_id, item.entry_id, e.currentTarget.value)}
                        onBlur={(e) => handleItemBlur(e, list.list_id, item.entry_id)}
                        placeholder="Enter item..."
                        className={`
                          flex-1 border-none bg-transparent hover:bg-sidebar-hover focus:bg-sidebar-hover 
                          focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0
                          transition-colors duration-150
                          ${item.entry_checked ? 'line-through text-muted-foreground' : ''}
                        `}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(list.list_id, item.entry_id)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-sidebar-hover p-1"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  );
                })}
                
                <Button
                  onClick={() => handleAddItem(list.list_id)}
                  variant="ghost"
                  className="w-full justify-start hover:bg-sidebar-hover text-muted-foreground"
                >
                  <Plus size={14} className="mr-2" />
                  Add item
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}