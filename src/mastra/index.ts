import { Mastra } from '@mastra/core';
import { researchAgent, reportAgent } from './agents';
import { mainWorkflow } from './workflows';

export const mastra = new Mastra({
  agents: { researchAgent, reportAgent },
	// TODO: problems when researchWorkflow is registered here
  vnext_workflows: { mainWorkflow }
});
