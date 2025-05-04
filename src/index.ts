import 'dotenv/config';
import readline from 'readline';
import { mastra } from './mastra';

// Create readline interface for CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline.question
const question = (prompt: string) => {
  return new Promise<string>((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Main function with human-in-the-loop workflow
const main = async () => {
  try {
    console.log('=== AI Research Assistant ===');
    console.log(
      'This tool helps you research topics and generates comprehensive reports'
    );

    const mainWorkflow = mastra.vnext_getWorkflow('mainWorkflow');

    const run = mainWorkflow.createRun();
    let result = await run.start({});

    console.log(JSON.stringify(result, null, 2));

    if (result.status === 'success') {
      console.log('Thank you for using the research assistant!');
      return;
    }

    while (
      result.status === 'suspended' &&
      result.steps['research-workflow']?.status === 'suspended'
    ) {
      const isGetUserQuerySuspended =
        result.suspended[0].includes('get-user-query');
      const isApprovalSuspended = result.suspended[0].includes('approval');

      if (isGetUserQuerySuspended) {
        console.log('Suspended fooo get-user-query');
        // TODO: fix: payload is typed by outputSchema but it should be suspendSchema
        //@ts-ignore
        const searchQuery = result.steps['research-workflow'].payload?.message.query;
        //@ts-ignore
        const depthQuery = result.steps['research-workflow'].payload?.message.depth;
        //@ts-ignore
        const breadthQuery = result.steps['research-workflow'].payload?.message.breadth;

        console.log({ searchQuery, depthQuery, breadthQuery });

        const userQuery = await question(searchQuery);
        const depth = await question(depthQuery);
        const breadth = await question(breadthQuery);

        result = await run.resume({
          step: ['research-workflow', 'get-user-query'],
          resumeData: {
            query: userQuery,
            depth: parseInt(depth),
            breadth: parseInt(breadth),
          },
        });
      } else if (isApprovalSuspended) {
        console.log('Suspended fooo approval');
        //@ts-ignore
        const suspendMessage = result.steps['research-workflow'].payload.message;
        //@ts-ignore
        const summary = result.steps['research-workflow'].payload.summary;
        console.log({ suspendMessage, summary });

        const approval = await question(suspendMessage);
        result = await run.resume({
          step: ['research-workflow', 'approval'],
          resumeData: {
            approved: approval === 'y',
          },
        });
      } else {
        break;
      }
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
};

main();
