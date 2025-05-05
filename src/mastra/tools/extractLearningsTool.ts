import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Initialize model
const mainModel = openai("gpt-4o");

export const extractLearningsTool = createTool({
  id: "extract-learnings",
  description: "Extract key learnings and follow-up questions from a search result",
  inputSchema: z.object({
    query: z.string().describe("The original research query"),
    result: z.object({
      title: z.string(),
      url: z.string(),
      content: z.string(),
    }).describe("The search result to process"),
  }),
  execute: async ({ context }) => {
    try {
      const { query, result } = context;

      const { object } = await generateObject({
        model: mainModel,
        prompt: `The user is researching "${query}".
        Extract a key learning and generate follow-up questions from this search result:

        Title: ${result.title}
        URL: ${result.url}
        Content: ${result.content.substring(0, 1500)}...`,
        schema: z.object({
          learning: z.string(),
          followUpQuestions: z.array(z.string()).max(3),
        }),
      });

      return object;
    } catch (error) {
      console.error("Error extracting learnings:", error);
      return {
        learning: "Error extracting information",
        followUpQuestions: [],
      };
    }
  },
});
