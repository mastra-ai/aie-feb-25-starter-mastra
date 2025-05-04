import "dotenv/config";
import fs from "fs";
import { z } from "zod";
import { mastra } from "./mastra";

// Define basic types
type SearchResult = {
  title: string;
  url: string;
  content: string;
};

type Learning = {
  learning: string;
  followUpQuestions: string[];
};

type Research = {
  query: string | undefined;
  queries: string[];
  searchResults: SearchResult[];
  learnings: Learning[];
  completedQueries: string[];
};

// Implementation of the research function
const deepResearch = async (
  prompt: string,
  depth: number = 2,
  breadth: number = 2,
) => {
  console.log(`Starting deep research on: ${prompt} (depth: ${depth}, breadth: ${breadth})`);

  // Initialize research object
  const research: Research = {
    query: prompt,
    queries: [],
    searchResults: [],
    learnings: [],
    completedQueries: [],
  };

  try {
    const researchAgent = mastra.getAgent("researchAgent");
    // Generate a structured research plan and execute it using the agent
    const result = await researchAgent.generate(
      [
        {
          role: "user",
          content: `Research the following topic thoroughly: "${prompt}"

          Use a depth of ${depth} (how deeply to follow up on questions) and breadth of ${breadth} (how many queries to explore at each level).

          Return your findings in this JSON format:
          {
            "queries": ["query1", "query2", ...],
            "searchResults": [{"title": "...", "url": "...", "relevance": "..."}],
            "learnings": [{"learning": "...", "followUpQuestions": ["q1", "q2"], "source": "url"}],
            "completedQueries": ["query1", "query2", ...]
          }`,
        },
      ],
      {
        maxSteps: 25, // Allow multiple tool calls
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

    // Transfer the agent's structured output to our research object
    if (result.object) {
      research.queries = result.object.queries;
      research.completedQueries = result.object.completedQueries;

      // Convert search results to the expected format
      research.searchResults = result.object.searchResults.map(item => ({
        title: item.title,
        url: item.url,
        content: item.relevance, // Using relevance as content summary
      }));

      // Convert learnings to the expected format
      research.learnings = result.object.learnings.map(item => ({
        learning: item.learning,
        followUpQuestions: item.followUpQuestions,
      }));
    }

    console.log("Research completed successfully!");
  } catch (error) {
    console.error("Error during research:", error);
  }

  return research;
};

// Report generation
const generateReport = async (research: Research) => {
  console.log("Generating report with report agent...");

  const reportAgent = mastra.getAgent("reportAgent");
  const response = await reportAgent.generate([
    {
      role: "user",
      content: `Generate a comprehensive report based on the following research data:

      ${JSON.stringify(research, null, 2)}`,
    },
  ]);

  return response.text;
};

// Entry point
const main = async () => {
  const research = await deepResearch(
    "What do you need to be a D1 shotput athelete?",
  );
  console.log("Research completed!");
  console.log("Generating report...");
  const report = await generateReport(research);
  console.log("Report generated! report.md");
  fs.writeFileSync("report.md", report);
};

main();
