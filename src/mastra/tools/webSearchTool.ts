import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import Exa from "exa-js";
import "dotenv/config";

// Initialize Exa client
const exa = new Exa(process.env.EXA_API_KEY);

export const webSearchTool = createTool({
  id: "web-search",
  description: "Search the web for information on a specific query",
  inputSchema: z.object({
    query: z.string().describe("The search query to run"),
  }),
  execute: async ({ context }) => {
    const { query } = context;

    try {
      const { results } = await exa.searchAndContents(query, {
        livecrawl: "always",
        numResults: 1,
      });

      return {
        results: results.map((r) => ({
          title: r.title || "",
          url: r.url,
          content: r.text,
        })),
      };
    } catch (error) {
      console.error("Error searching the web:", error);
      return { results: [] };
    }
  },
});
