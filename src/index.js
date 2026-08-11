import { handleApply } from "./handlers/apply.js";
import { handleQuote } from "./handlers/quote.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/apply") {
      return handleApply(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/quote") {
      return handleQuote(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
