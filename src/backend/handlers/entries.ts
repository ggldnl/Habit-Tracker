import {
  getAllEntries,
  addEntry,
  updateEntryText,
  toggleEntry,
  deleteEntry,
} from "../db";
import { createResponse } from "../utils";
import { handleOptions } from "../utils";

/*
API Routes Reference

| Method | Route                   | Description                   | Body                        |
|--------|-------------------------|-------------------------------|-----------------------------|
| GET    | /api/entries            | Get all entries               | —                           |
| POST   | /api/entries            | Add a new entry               | { list_id, entry_text }     |
| PATCH  | /api/entries/:id/text   | Update entry text             | { entry_text }              |
| PATCH  | /api/entries/:id/toggle | Toggle entry checked state    | —                           |
| DELETE | /api/entries/:id        | Delete an entry               | —                           |
*/


export async function entriesHandler(req: Request): Promise<Response> {
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash
  const pathParts = pathname.split("/").filter(Boolean); // e.g., ['api', 'entries', '1', 'toggle']

  // GET /api/entries
  if (method === "GET" && pathParts.length === 2) {
    const entries = getAllEntries();
    return createResponse({ success: true, data: entries });
  }

  // POST /api/entries
  // body { list_id, entry_text }
  if (method === "POST" && pathParts.length === 2) {
    try {
      const body = await req.json();
      const { list_id, entry_text, entry_checked = false } = body;

      if (typeof list_id !== "number" || typeof entry_text !== "string") {
        return createResponse({ success: false, error: "Missing or invalid list_id or entry_text" }, 400);
      }

      const entry = addEntry(list_id, entry_text, entry_checked);
      return entry
        ? createResponse({ success: true, data: entry })
        : createResponse({ success: false, error: "Failed to create entry" }, 500);
    } catch {
      return createResponse({ success: false, error: "Invalid JSON body" }, 400);
    }
  }

  // PATCH /api/entries/:id/text or /api/entries/:id/toggle
  // patch text -> body { entry_text } 
  if (method === "PATCH" && pathParts.length === 4) {
    
    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;
    const action = pathParts[3]; // 'text' or 'toggle', if any

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }

    if (action === "text") {
      try {
        const body = await req.json();
        const { entry_text } = body;

        if (typeof entry_text !== "string") {
          return createResponse({ success: false, error: "Missing or invalid entry_text" }, 400);
        }

        const updated = updateEntryText(id, entry_text);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update entry" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }

    if (action === "toggle") {
      const entry = toggleEntry(id);
      return entry
        ? createResponse({ success: true, data: entry })
        : createResponse({ success: false, error: "Entry not found" }, 404);
    }
  }

  // DELETE /api/entries/:id
  if (method === "DELETE" && pathParts.length === 3) {

    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }

    const deleted = deleteEntry(id);
    return deleted
      ? createResponse({ success: true, data: deleted })
      : createResponse({ success: false, error: "Entry not found" }, 404);
  }

  return createResponse({ success: false, error: "Method not allowed or invalid path" }, 405);
}