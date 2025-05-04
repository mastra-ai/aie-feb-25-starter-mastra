import { createStep, createWorkflow } from "@mastra/core/workflows/vNext";
import { researchWorkflow } from "./researchWorkflow";
import fs from 'fs';
import { z } from "zod";

// Map research output to report input and handle conditional logic
const processResearchResultStep = createStep({
  id: "process-research-result",
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  outputSchema: z.object({
    reportPath: z.string().optional(),
    completed: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    // First determine if research was approved/successful
    const approved = inputData.approved && !!inputData.researchData;

    if (!approved) {
      console.log("Research not approved or incomplete, ending workflow");
      return { completed: false };
    }

    // If approved, generate report
    try {
      console.log("Generating report...");
      const agent = mastra.getAgent("reportAgent");
      const response = await agent.generate([
        {
          role: "user",
          content: `Generate a report based on this research: ${JSON.stringify(inputData.researchData)}`,
        }
      ]);

      const reportPath = "report.md";
      fs.writeFileSync(reportPath, response.text);

      console.log("Report generated successfully!");
      return { reportPath, completed: true };
    } catch (error) {
      console.error("Error generating report:", error);
      return { completed: false };
    }
  }
});

// Create the main workflow
export const mainWorkflow = createWorkflow({
  id: "main-workflow",
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({}),
  outputSchema: z.object({
    reportPath: z.string().optional(),
    completed: z.boolean(),
  }),
});

// The workflow logic:
// 1. Run researchWorkflow once
// 2. Process results and generate report if approved
mainWorkflow
  .dowhile(researchWorkflow, async ({ inputData }) => {
    const isCompleted = inputData.approved;
    return isCompleted !== true;
  })
  .then(processResearchResultStep)
  .commit();
