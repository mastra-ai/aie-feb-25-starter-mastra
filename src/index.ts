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

// Helper function to safely get suspend data
const getSuspendData = (result: any, stepId: string) => {
  if (result.steps && result.steps[stepId]) {
    return result.steps[stepId].payload || {};
  }
  return {};
};

// Main function with human-in-the-loop workflow
const main = async () => {
  try {
    console.log('\n=== AI Research Assistant ===');
    console.log('This tool helps you research topics and generates comprehensive reports\n');

    const mainWorkflow = mastra.vnext_getWorkflow('mainWorkflow');
    const run = mainWorkflow.createRun();

    console.log('Starting research workflow...\n');
    let result = await run.start({});

    if (result.status === 'success') {
      console.log('Research process completed successfully!');
      console.log('Thank you for using the research assistant!');
      rl.close();
      return;
    }

    // Handle workflow suspension
    while (result.status === 'suspended') {
      // Handle user query step
      if (result.suspended[0].includes('get-user-query')) {
        const suspendData = getSuspendData(result, 'research-workflow');

        const message = suspendData.message?.query || 'What would you like to research?';
        const depthPrompt = suspendData.message?.depth || 'Research depth (1-3, default: 2):';
        const breadthPrompt = suspendData.message?.breadth || 'Research breadth (1-5, default: 2):';

        const userQuery = await question(message + ' ');
        const depth = await question(depthPrompt + ' ');
        const breadth = await question(breadthPrompt + ' ');

        console.log('\nStarting research process. This may take a minute or two...\n');

        result = await run.resume({
          step: ['research-workflow', 'get-user-query'],
          resumeData: {
            query: userQuery,
            depth: parseInt(depth) || 2,
            breadth: parseInt(breadth) || 2,
          },
        });
      }
      // Handle approval step
      else if (result.suspended[0].includes('approval')) {
        const suspendData = getSuspendData(result, 'research-workflow');

        const summary = suspendData.summary || 'Research has been completed.';
        const message = suspendData.message || 'Is this research sufficient? (y/n):';

        console.log('\n=== RESEARCH SUMMARY ===');
        console.log(summary);

        const approval = await question(message + ' ');

        result = await run.resume({
          step: ['research-workflow', 'approval'],
          resumeData: {
            approved: approval.toLowerCase() === 'y',
            action: approval.toLowerCase() === 'y' ? 'generate' : 'restart',
          },
        });

        if (approval.toLowerCase() !== 'y') {
          console.log('\nRestarting research process...\n');
        }
      }
      // Unknown suspension point
      else {
        console.log('Workflow is waiting for an unknown reason. Exiting...');
        break;
      }
    }

    // Handle workflow completion
    if (result.status === 'success') {
      const reportPath = result.result?.reportPath;
      if (reportPath) {
        console.log(`\nResearch complete! Report saved to: ${reportPath}`);
      } else {
        console.log('\nResearch process completed successfully!');
      }
    } else if (result.status === 'failed') {
      console.error('\nResearch process failed:', result.error?.message);
    }

    console.log('\nThank you for using the research assistant!');
    rl.close();
  } catch (error) {
    console.error('\nAn unexpected error occurred:', error instanceof Error ? error.message : String(error));
    console.log('\nPlease try running the research assistant again.');
    rl.close();
  }
};

main();
