# Deep Research with Mastra

This project implements an AI-powered research system using Mastra to enhance the research capabilities of the application. The implementation replaces the original recursive research function with a more maintainable agent-based approach.

## Implementation Approach

The deep research functionality is implemented using Mastra's agent-based architecture with custom tools. Here's how it works:

1. **Research Agent**: A specialized Mastra agent responsible for orchestrating the entire research process
2. **Custom Tools**: Three primary tools handle the core functionality:
   - `webSearchTool` - Searches the web using the Exa API to find relevant information
   - `evaluateResultTool` - Evaluates if search results are relevant to the research topic
   - `extractLearningsTool` - Extracts key learnings and follow-up questions from relevant content

3. **Execution Flow**:
   - The agent receives a research topic and parameters for depth/breadth
   - It generates specific search queries related to the topic
   - For each query, it searches the web and evaluates results for relevance
   - From relevant results, it extracts key learnings and follow-up questions
   - The agent follows up on promising leads and organizes the findings

## Key Benefits of Mastra Implementation

1. **Simplified Architecture**: The agent-based approach is more maintainable than the previous recursive implementation

2. **Error Handling**: Robust error handling at every step ensures the research process can recover from API failures

3. **Structured Output**: The agent returns a strongly typed response with consistent structure for reliable consumption

4. **Extensibility**: New capabilities (like using different search engines or evaluation strategies) can be added by updating tools

5. **Observability**: Mastra's built-in logging and telemetry provides visibility into the research process

## How to Use

```typescript
import { deepResearch } from './index';

// Run a deep research operation
const research = await deepResearch(
  "What do you need to be a D1 shotput athlete?",  // Research topic
  2,                                               // Depth (how deep to follow up questions)
  3                                                // Breadth (queries per level)
);

// Use the research results
console.log(research.queries);          // All search queries used
console.log(research.searchResults);    // Relevant sources found
console.log(research.learnings);        // Key learnings extracted
console.log(research.completedQueries); // All queries that were processed
```

## Required Dependencies

- `@mastra/core`: Core Mastra functionality
- `@ai-sdk/openai`: OpenAI models integration
- `exa-js`: Exa API client for web search
- `zod`: Schema definition and validation
