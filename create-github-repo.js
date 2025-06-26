const fs = require('fs');
const { execSync } = require('child_process');

// Read environment variables
require('dotenv').config();

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'ales27pm';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'nativeAI';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

console.log('🚀 Creating GitHub Repository...');
console.log('Username:', GITHUB_USERNAME);
console.log('Repository:', GITHUB_REPOSITORY);
console.log('Token:', GITHUB_TOKEN ? `${GITHUB_TOKEN.substring(0, 8)}...` : 'Not found');

if (!GITHUB_TOKEN) {
  console.error('❌ GitHub token not found in environment variables');
  process.exit(1);
}

try {
  // Create repository using GitHub API
  const repoData = {
    name: GITHUB_REPOSITORY,
    description: "ARIA - Advanced Reasoning Intelligence Assistant: Autonomous AI with native iOS integration, multi-LLM reasoning, computer vision, voice processing, and contextual awareness using React Native Turbo Modules",
    private: false,
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    auto_init: false
  };

  const createCommand = `curl -H "Authorization: token ${GITHUB_TOKEN}" -H "Accept: application/vnd.github.v3+json" -H "Content-Type: application/json" -d '${JSON.stringify(repoData)}' https://api.github.com/user/repos`;
  
  console.log('📡 Creating repository...');
  const result = execSync(createCommand, { encoding: 'utf8' });
  console.log('✅ Repository creation response:', result);

  // Add GitHub remote
  console.log('🔗 Adding GitHub remote...');
  try {
    execSync(`git remote remove github`, { encoding: 'utf8' });
  } catch (e) {
    // Remote doesn't exist, that's fine
  }
  
  execSync(`git remote add github https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}.git`, { encoding: 'utf8' });
  
  // Push to GitHub
  console.log('📤 Pushing to GitHub...');
  execSync(`git push -u github main`, { encoding: 'utf8' });
  
  console.log('🎉 Successfully created and pushed to GitHub repository!');
  console.log(`🌐 Repository URL: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  
  // If repository already exists, just add remote and push
  if (error.message.includes('already exists')) {
    console.log('📝 Repository already exists, setting up remote and pushing...');
    try {
      execSync(`git remote remove github`, { encoding: 'utf8' });
    } catch (e) {
      // Remote doesn't exist, that's fine
    }
    
    execSync(`git remote add github https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}.git`, { encoding: 'utf8' });
    execSync(`git push -u github main`, { encoding: 'utf8' });
    
    console.log('🎉 Successfully pushed to existing GitHub repository!');
    console.log(`🌐 Repository URL: https://github.com/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}`);
  }
}