import {
  getAllDays,
  addDay,
  updateDayValue,
  updateDayCompletion,
  deleteDay,
} from "../db";
import { createResponse } from "../utils";
import { handleOptions } from "../utils";

/*
API Routes Reference

| Method | Route                    | Description                   | Body                                      |
|--------|--------------------------|-------------------------------|-------------------------------------------|
| GET    | /api/days                | Get all days                  | —                                         |
| POST   | /api/days                | Add a new day                 | { habit_id, day_value, day_completion }   |
| PATCH  | /api/days/:id/value      | Update day value              | { day_value }                             |
| PATCH  | /api/days/:id/completion | Update day completion         | { day_completion }                        |
| DELETE | /api/days/:id            | Delete a day                  | —                                         |
*/


export async function daysHandler(req: Request): Promise<Response> {
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash
  const pathParts = pathname.split("/").filter(Boolean); // e.g., ['api', 'days', '1', 'completion']

  // GET /api/days
  if (method === "GET" && pathParts.length === 2) {
    const days = getAllDays();
    return createResponse({ success: true, data: days });
  }

  // POST /api/days
  // body { habit_id, day_value, day_completion }
  if (method === "POST" && pathParts.length === 2) {
    try {
      const body = await req.json();
      const { habit_id, day_value, day_completion } = body;

      if (typeof habit_id !== "number" || typeof day_value !== "string" || typeof day_completion != "number") {
        console.log("All good.")
        return createResponse({ success: false, error: "Missing or invalid habit_id, day_value or day_completion" }, 400);
      }

      const entry = addDay(habit_id, day_value, day_completion);
      return entry
        ? createResponse({ success: true, data: entry })
        : createResponse({ success: false, error: "Failed to create entry" }, 500);
    } catch {
      return createResponse({ success: false, error: "Invalid JSON body" }, 400);
    }
  }

  // PATCH /api/days/:id/value or /api/days/:id/completion
  // patch value -> body { new_value } 
  if (method === "PATCH" && pathParts.length === 4) {
    
    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;
    const action = pathParts[3]; // 'value' or 'completion', if any

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }

    if (action === "value") {
      try {
        const body = await req.json();
        const { day_value } = body;

        if (typeof day_value !== "string") {
          return createResponse({ success: false, error: "Missing or invalid day_value" }, 400);
        }

        const updated = updateDayValue(id, day_value);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update day" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }

    if (action === "completion") {
      try {
        const body = await req.json();
        const { day_completion } = body;

        if (typeof day_completion !== "number") {
          return createResponse({ success: false, error: "Missing or invalid day_completion" }, 400);
        }

        const updated = updateDayCompletion(id, day_completion);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update day" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }
  }

  // DELETE /api/days/:id
  if (method === "DELETE" && pathParts.length === 3) {

    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }

    const deleted = deleteDay(id);
    return deleted
      ? createResponse({ success: true, data: deleted })
      : createResponse({ success: false, error: "Entry not found" }, 404);
  }

  return createResponse({ success: false, error: "Method not allowed or invalid path" }, 405);
}