import { getAllColors, addColor, deleteColor } from "../db";
import { createResponse } from "../utils";
import { handleOptions } from "../utils";

/*
API Routes Reference

| Method | Route                    | Description                   | Body                        |
|--------|--------------------------|-------------------------------|-----------------------------|
| GET    | /api/colors              | Get all colors                | —                           |
| POST   | /api/colors              | Add a new color               | { color_name, color_value } |
| DELETE | /api/colors/:id          | Delete an color               | —                           |
*/


export async function colorsHandler(req: Request): Promise<Response> {
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }
  
  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash
  const pathParts = pathname.split("/").filter(Boolean); // e.g., ['api', 'colors', '1']

  if (method === "GET" && pathParts.length == 2) {
    const colors = getAllColors();
    return createResponse({success: true, data: colors});
  }

  if (method === "POST" && pathParts.length == 2) {
    try {
      const body = await req.json();
      const { color_name, color_value } = body;

      if (typeof color_name !== "string" || typeof color_value !== "string") {
        return createResponse({ success: false, error: "Invalid input" }, 400);
      }

      const color = addColor(color_name, color_value);
      if (!color) return createResponse({ success: false, error: "Failed to add color" }, 500);

      return createResponse({ success: true, data: color });
    } catch {
      return createResponse({ success: false, error: "Invalid JSON" }, 400);
    }
  }

  if (method === "DELETE" && pathParts.length == 3) {

    const idParam = pathParts[2]
    const id = idParam ? parseInt(idParam, 10) : NaN;

    if (isNaN(id)) {
      return createResponse({ success: false, error: "Missing or invalid id" }, 400);
    }

    const deleted = deleteColor(id);
    if (!deleted) return createResponse({ success: false, error: "Color not found" }, 404);

    return createResponse({ success: true, data: deleted });
  }

  return createResponse({ success: false, error: "Method not allowed" }, 405);
}
