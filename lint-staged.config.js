const path = require('node:path');

const quote = value => JSON.stringify(value);

const relativeFiles = (projectDir, files) =>
  files.map(file => quote(path.relative(path.join(__dirname, projectDir), file))).join(' ');

const projectCommands = (projectDir, files) => {
  const args = relativeFiles(projectDir, files);

  return [`pnpm --dir ${projectDir} exec eslint --fix ${args}`];
};

module.exports = {
  'services/api/app/**/*.{js,ts}': files => projectCommands('services/api/app', files),
  'mobile/**/*.{js,jsx,ts,tsx}': files => projectCommands('mobile', files),
};
