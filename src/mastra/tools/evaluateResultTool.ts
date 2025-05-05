import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Initialize model
const mainModel = openai("gpt-4o");

export const evaluateResultTool = createTool({
  id: "evaluate-result",
  description: "Evaluate if a search result is relevant to the research query",
  inputSchema: z.object({
    query: z.string().describe("The original research query"),
    result: z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    }).describe("The search result to evaluate"),
    existingUrls: z.array(z.string()).describe("URLs that have already been processed").optional(),
  }),
  execute: async ({ context }) => {
    try {
      const { query, result, existingUrls = [] } = context;
      console.log("Evaluating result", { context });

      // Check if URL already exists (only if existingUrls was provided)
      if (existingUrls && existingUrls.includes(result.url)) {
        return {
          isRelevant: false,
          reason: "URL already processed"
        };
      }

      const { object } = await generateObject({
        model: mainModel,
        prompt: `Evaluate whether this search result is relevant and will help answer the query: "${query}".

        Search result:
        Title: ${result.title}
        URL: ${result.url}
        Content snippet: ${result.content.substring(0, 500)}...

        Respond with "relevant" or "irrelevant" and provide a brief reason.`,
        schema: z.object({
          isRelevant: z.boolean(),
          reason: z.string(),
        }),
      });

      return object;
    } catch (error) {
      console.error("Error evaluating result:", error);
      return {
        isRelevant: false,
        reason: "Error in evaluation"
      };
    }
  },
});
