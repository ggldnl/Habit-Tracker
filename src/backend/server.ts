import { serve } from "bun";
import { colorsHandler } from "./handlers/colors";
import { listsHandler } from "./handlers/lists";
import { entriesHandler } from "./handlers/entries";
import { habitsHandler } from "./handlers/habits";
import { daysHandler } from "./handlers/days";

serve({
  
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/colors")) return colorsHandler(req);
    if (url.pathname.startsWith("/api/entries")) return entriesHandler(req);
    if (url.pathname.startsWith("/api/lists")) return listsHandler(req);
    if (url.pathname.startsWith("/api/habits")) return habitsHandler(req);
    if (url.pathname.startsWith("/api/days")) return daysHandler(req);

    return new Response(JSON.stringify({ success: false, error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
});
