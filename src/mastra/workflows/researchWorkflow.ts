import { createWorkflow, createStep } from "@mastra/core/workflows/vNext";
import { z } from "zod";


// Step 1: Get user query
const getUserQueryStep = createStep({
  id: "get-user-query",
  inputSchema: z.object({}),
  outputSchema: z.object({
    query: z.string(),
    depth: z.number(),
    breadth: z.number(),
  }),
  resumeSchema: z.object({
    query: z.string(),
    depth: z.number(),
    breadth: z.number(),
  }),
  suspendSchema: z.object({
    message: z.object({
      query: z.string(),
      depth: z.string(),
      breadth: z.string(),
    }),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        query: resumeData.query || "",
        depth: resumeData.depth || 2,
        breadth: resumeData.breadth || 2,
      };
    }

    await suspend({
      message: {
        query: "What would you like to research?",
        depth: "Please provide the depth of the research [1-5]: ",
        breadth: "Please provide the breadth of the research [1-5]: ",
      },
    });

    // Unreachable but needed
    return {
      query: "",
      depth: 2,
      breadth: 2
    };
  }
});

// Step 2: Research
const researchStep = createStep({
  id: "research",
  inputSchema: z.object({
    query: z.string(),
    depth: z.number(),
    breadth: z.number(),
  }),
  outputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { query, depth, breadth } = inputData;

    try {
      const agent = mastra.getAgent("researchAgent");
      const researchPrompt = `Research the following topic thoroughly: "${query}" with depth ${depth} and breadth ${breadth}.
      Return findings in JSON format with queries, searchResults, learnings, and completedQueries.`;

      const result = await agent.generate(
        [
          {
            role: "user",
            content: researchPrompt,
          },
        ],
        {
          output: z.object({
            queries: z.array(z.string()),
            searchResults: z.array(z.object({
              title: z.string(),
              url: z.string(),
              relevance: z.string(),
            })),
            learnings: z.array(z.object({
              learning: z.string(),
              followUpQuestions: z.array(z.string()),
              source: z.string(),
            })),
            completedQueries: z.array(z.string()),
          }),
        }
      );

      // Create a summary
      const summary = `Research completed on "${query}:" \n\n ${JSON.stringify(result.object, null, 2)}\n\n`;

      return {
        researchData: result.object,
        summary,
      };
    } catch (error) {
      console.log({ error });
      return {
        researchData: { error: error.message },
        summary: `Error: ${error.message}`,
      };
    }
  }
});

// Step 3: Get user approval
const approvalStep = createStep({
  id: "approval",
  inputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        researchData: inputData.researchData,
      };
    }

    await suspend({
      summary: inputData.summary,
      message: `Is this research sufficient? [y/n] `,
    });

    return {
      approved: false,
      researchData: inputData.researchData,
    };
  }
});

// Define the workflow
export const researchWorkflow = createWorkflow({
  id: "research-workflow",
  inputSchema: z.object({}),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  steps: [getUserQueryStep, researchStep, approvalStep],
});

researchWorkflow
  .then(getUserQueryStep)
  .then(researchStep)
  .then(approvalStep)
  .commit();
