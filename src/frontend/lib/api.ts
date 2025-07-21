import { List, Entry, Color } from "./types"

// Adjust this to your Bun backend address
const BASE_URL = "http://localhost:3000/api";

// Backend response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Corrected functions
export async function fetchLists(): Promise<List[]> {
  const res = await fetch(`${BASE_URL}/lists`);
  if (!res.ok) throw new Error("Failed to fetch lists");
  
  const response: ApiResponse<List[]> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to fetch lists");
  }
  
  return response.data || [];
}

export async function fetchEntries(): Promise<Entry[]> {
  const res = await fetch(`${BASE_URL}/entries`);
  if (!res.ok) throw new Error("Failed to fetch entries");
  
  const response: ApiResponse<Entry[]> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to fetch entries");
  }
  
  return response.data || [];
}

export async function fetchColors(): Promise<Color[]> {
  const res = await fetch(`${BASE_URL}/colors`);
  if (!res.ok) throw new Error("Failed to fetch colors");
  
  const response: ApiResponse<Color[]> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to fetch colors");
  }
  
  return response.data || [];
}

export async function addList(name: string, color: number): Promise<List> {
  const res = await fetch(`${BASE_URL}/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      list_name: name,
      list_color: color
    }),
  });
  
  if (!res.ok) throw new Error("Failed to add list");
  
  const response: ApiResponse<List> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to add list");
  }
  
  return response.data!;
}

export async function updateListColor(list_id: number, new_color: number): Promise<List> {
  const res = await fetch(`${BASE_URL}/lists/${list_id}/color`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ list_color: new_color }),
  });
  
  if (!res.ok) throw new Error("Failed to update list color");
  
  const response: ApiResponse<List> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to update list color");
  }
  
  return response.data!;
}

export async function updateListName(list_id: number, new_name: string): Promise<List> {
  const res = await fetch(`${BASE_URL}/lists/${list_id}/name`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ list_name: new_name }),
  });
  
  if (!res.ok) throw new Error("Failed to update list name");
  
  const response: ApiResponse<List> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to update list name");
  }
  
  return response.data!;
}

export async function deleteList(id: number): Promise<List> {
  const res = await fetch(`${BASE_URL}/lists/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) throw new Error("Failed to delete list");
  
  const response: ApiResponse<List> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to delete list");
  }
  
  return response.data!;
}

export async function addEntry(listId: number, text: string, checked: boolean = false): Promise<Entry> {
  const res = await fetch(`${BASE_URL}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      list_id: listId,
      entry_text: text,
      entry_checked: checked
    }),
  });
  
  if (!res.ok) throw new Error("Failed to add entry");
  
  const response: ApiResponse<Entry> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to add entry");
  }
  
  return response.data!;
}

export async function updateEntryText(list_id: number, entry_id: number, new_text: string): Promise<List> {
  const res = await fetch(`${BASE_URL}/entries/${list_id}/text`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry_text: new_text }),
  });
  
  if (!res.ok) throw new Error("Failed to update entry text");
  
  const response: ApiResponse<List> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to update entry text");
  }
  
  return response.data!;
}

export async function toggleEntry(id: number): Promise<Entry> {
  const res = await fetch(`${BASE_URL}/entries/${id}/toggle`, {
    method: "PATCH",
  });
  
  if (!res.ok) throw new Error("Failed to toggle entry");
  
  const response: ApiResponse<Entry> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to toggle entry");
  }
  
  return response.data!;
}

export async function deleteEntry(id: number): Promise<Entry> {
  const res = await fetch(`${BASE_URL}/entries/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) throw new Error("Failed to delete entry");
  
  const response: ApiResponse<Entry> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to delete entry");
  }
  
  return response.data!;
}

export async function addColor(name: string, value: string): Promise<Color> {
  const res = await fetch(`${BASE_URL}/colors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      color_name: name,
      color_value: value
    }),
  });
  
  if (!res.ok) throw new Error("Failed to add color");
  
  const response: ApiResponse<Color> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to add color");
  }
  
  return response.data!;
}

export async function deleteColor(id: number): Promise<Color> {
  const res = await fetch(`${BASE_URL}/colors/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) throw new Error("Failed to delete color");
  
  const response: ApiResponse<Color> = await res.json();
  if (!response.success) {
    throw new Error(response.error || "Failed to delete color");
  }
  
  return response.data!;
}