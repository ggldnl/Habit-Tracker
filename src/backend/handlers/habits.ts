import { 
  getAllHabits, 
  addHabit, 
  updateHabitName, 
  updateHabitColor, 
  clearHabit,
  deleteHabit 
} from "../db";
import { createResponse } from "../utils"
import { handleOptions } from "../utils";

/*
API Routes Reference

| Method | Route                    | Description                   | Body                        |
|--------|--------------------------|-------------------------------|-----------------------------|
| GET    | /api/habits              | Get all habits                | —                           |
| POST   | /api/habits              | Add a new habit               | { habit_name, habit_color }   |
| PATCH  | /api/habits/:id/name     | Update day name               | { new_name }                |
| PATCH  | /api/habits/:id/color    | Update day color              | { new_color }               |
| PATCH  | /api/habits/:id/clear    | Clear the habit               | —                           |
| DELETE | /api/habits/:id          | Delete a habit                | —                           |
*/


export async function habitsHandler(req: Request): Promise<Response> {

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash
  const pathParts = pathname.split("/").filter(Boolean); // e.g., ['api', 'habits', '1', 'clear']

  // GET /api/habits
  if (method === "GET" && pathParts.length == 2) {
    const habits = getAllHabits();
    return createResponse({ success: true, data: habits});
  }

  // POST /api/habits
  // body { habit_name, habit_color }
  if (method === "POST" && pathParts.length == 2) {
    try {
      const body = await req.json();
      const {habit_name, habit_color } = body;

      if (typeof habit_name !== "string" || typeof habit_color !== "number") {
        return createResponse({ success: false, error: "Missing or invalid habit_name or habit_color" }, 400);
      }

      const habit = addHabit(habit_name, habit_color);
      return habit
        ? createResponse({ success: true, data: habit })
        : createResponse({ success: false, error: "Failed to create habit"}, 500);
    } catch {
      return createResponse({ success: false, error: "Invalid JSON body"}, 400);
    }
  }

  // PATCH /api/habits/:id/name or /api/habits/:id/color or /api/habits/:id/clear 
  // patch name -> body { new_name }
  // patch color -> body { new_color } 
  if (method === "PATCH" && pathParts.length === 4) {
    
    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;
    const action = pathParts[3]; // 'name', 'color', 'clear', if any

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }
    
    if (action === "name") {
      try {
        const body = await req.json();
        const { habit_name } = body;

        if (typeof habit_name !== "string") {
          return createResponse({ success: false, error: "Missing or invalid habit_name" }, 400);
        }

        const updated = updateHabitName(id, habit_name);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update habit" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }

    if (action === "clear") {
      try {
        const updated = clearHabit(id);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update habit" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }

    if (action === "color") {
      try {
        const body = await req.json();
        const { habit_color } = body;

        if (typeof habit_color !== "number") {
          return createResponse({ success: false, error: "Missing or invalid habit_color" }, 400);
        }

        const updated = updateHabitColor(id, habit_color);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update habit" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }
  }

  // DELETE /api/habits/:id
  if (method === "DELETE" && pathParts.length === 3) {

    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }

    const deleted = deleteHabit(id);
    return deleted
      ? createResponse({ success: true, data: deleted })
      : createResponse({ success: false, error: "Habit not found" }, 404);
  }

  return createResponse({ success: false, error: "Method not allowed or invalid path" }, 405);  
}
