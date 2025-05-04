import { Mastra } from '@mastra/core';
import { researchAgent, reportAgent } from './agents';

export const mastra = new Mastra({
  agents: { researchAgent, reportAgent },
});
