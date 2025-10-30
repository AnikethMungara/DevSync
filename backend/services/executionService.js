import { spawn } from 'child_process';
import logger from '../utils/logger.js';
import config from '../config/config.js';

export async function executeCode(filePath, language) {
  return new Promise((resolve, reject) => {
    let command, args;
    
    switch(language) {
      case 'javascript':
        command = 'node';
        args = [filePath];
        break;
      case 'python':
        command = 'python';
        args = [filePath];
        break;
      default:
        reject(new Error(`Unsupported language: ${language}`));
        return;
    }
    
    const process = spawn(command, args, {
      cwd: config.workspaceDir,
      timeout: 30000 // 30 second timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr,
        success: code === 0
      });
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}
