import { 
  getAllLists, 
  addList, 
  updateListName, 
  updateListColor, 
  clearList, 
  deleteList 
} from "../db";
import { createResponse } from "../utils"
import { handleOptions } from "../utils";

/*
API Routes Reference

| Method | Route                    | Description                   | Body                        |
|--------|--------------------------|-------------------------------|-----------------------------|
| GET    | /api/lists               | Get all lists                 | —                           |
| POST   | /api/lists               | Add a new list                | { list_name, list_color }   |
| PATCH  | /api/lists/:id/name      | Update entry name             | { new_name }                |
| PATCH  | /api/lists/:id/color     | Update entry color            | { new_color }               |
| PATCH  | /api/lists/:id/clear     | Clear the list                | —                           |
| DELETE | /api/lists/:id           | Delete a list                 | —                           |
*/


export async function listsHandler(req: Request): Promise<Response> {

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash
  const pathParts = pathname.split("/").filter(Boolean); // e.g., ['api', 'entries', '1', 'toggle']

  // GET /api/lists
  if (method === "GET" && pathParts.length == 2) {
    const lists = getAllLists();
    return createResponse({ success: true, data: lists});
  }

  // POST /api/lists
  // body { list_name, list_color }
  if (method === "POST" && pathParts.length == 2) {
    try {
      const body = await req.json();
      const {list_name, list_color } = body;

      if (typeof list_name !== "string" || typeof list_color !== "number") {
        return createResponse({ success: false, error: "Missing or invalid list_name or list_color" }, 400);
      }

      const list = addList(list_name, list_color);
      return list
        ? createResponse({ success: true, data: list })
        : createResponse({ success: false, error: "Failed to create list"}, 500);
    } catch {
      return createResponse({ success: false, error: "Invalid JSON body"}, 400);
    }
  }

  // PATCH /api/lists/:id/name or /api/lists/:id/color or /api/lists/:id/clear 
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
        const { list_name } = body;

        if (typeof list_name !== "string") {
          return createResponse({ success: false, error: "Missing or invalid list_name" }, 400);
        }

        const updated = updateListName(id, list_name);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update list" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }

    if (action === "color") {
      try {
        const body = await req.json();
        const { list_color } = body;

        if (typeof list_color !== "number") {
          return createResponse({ success: false, error: "Missing or invalid list_color" }, 400);
        }

        const updated = updateListColor(id, list_color);
        return updated
          ? createResponse({ success: true, data: updated })
          : createResponse({ success: false, error: "Failed to update list" }, 500);
      } catch {
        return createResponse({ success: false, error: "Invalid JSON body" }, 400);
      }
    }
  }

  // DELETE /api/lists/:id
  if (method === "DELETE" && pathParts.length === 3) {

    const id = pathParts[2] ? parseInt(pathParts[2], 10) : null;

    if (!id) {
      return createResponse({ success: false, error: "Missing or invalid id"}, 400);
    }

    const deleted = deleteList(id);
    return deleted
      ? createResponse({ success: true, data: deleted })
      : createResponse({ success: false, error: "List not found" }, 404);
  }

  return createResponse({ success: false, error: "Method not allowed or invalid path" }, 405);  
}
