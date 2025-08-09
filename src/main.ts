import { getCLIProgram } from '@/cli.js';

async function handleMainError(error: any) {
  const err = error as any;
  // Commander throws on help/version when exitOverride is enabled.
  if (err && (err.code === 'commander.helpDisplayed' || err.code === 'commander.version')) {
    const errorCode = 0;
    process.exit(errorCode);
  }

  if (error instanceof Error) {
    const errorCode = typeof err?.exitCode === 'number' ? err.exitCode : 1;
    console.error(`Error: ${error.message}. Refuse to proceed. (${errorCode}).`);
    process.exit(errorCode);
  } else {
    console.error('Error: Unknown error. Refuse to proceed. (1).');
    process.exit(1);
  }
}

async function main() {
  try {
    const program = getCLIProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    await handleMainError(error);
  }
}

main();
