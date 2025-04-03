// Script to push schema changes automatically
import { spawn } from 'child_process';
import readline from 'readline';

function automateSchemaApply() {
  console.log('Starting schema push with automatic answers...');
  
  const drizzlePush = spawn('npx', ['drizzle-kit', 'push', '--verbose']);
  
  // Create interface to read from process stdout
  const rl = readline.createInterface({
    input: drizzlePush.stdout,
    terminal: false
  });
  
  // Handle prompts by automatically selecting the first option
  rl.on('line', (line) => {
    console.log(`Received: ${line}`);
    
    // If we detect an interactive question, answer with 'create table'
    if (line.includes('table created or renamed') || line.includes('create table')) {
      drizzlePush.stdin.write('\n'); // Press enter to select the first option
      console.log('Automatically selected "create table"');
    }
  });
  
  drizzlePush.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  drizzlePush.on('close', (code) => {
    console.log(`Schema push process exited with code ${code}`);
  });
}

automateSchemaApply();