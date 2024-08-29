require('dotenv').config();
const { execSync } = require('child_process');
// script to run nextjs with env variables and custom variables



const command = process.argv[2];

if (!command) {
  console.error('Please specify a command: start or dev');
  process.exit(1);
}

const port = process.env.BOOKMARKS_PORT || 3000; // Default to 3000 if PORT is not defined

const fullCommand = `next ${command} -p ${port}`;

execSync(fullCommand, { stdio: 'inherit' });