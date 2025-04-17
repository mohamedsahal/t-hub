import fs from 'fs';
import path from 'path';
import { log } from './vite';

/**
 * Loads environment variables from .env file
 * This is a custom implementation to ensure environment variables are properly loaded
 */
export function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      log('Loading environment variables from .env file', 'env');
      
      for (const line of envLines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;
        
        // Parse variable assignment
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          
          // Remove comments at the end of the line
          const commentIndex = value.indexOf('#');
          if (commentIndex > 0) {
            value = value.substring(0, commentIndex).trim();
          }
          
          // Set environment variable if not already set
          if (!process.env[key]) {
            process.env[key] = value;
            log(`Set environment variable: ${key}`, 'env');
          }
        }
      }
    } else {
      log('No .env file found', 'env');
    }
  } catch (error) {
    log(`Error loading .env file: ${error}`, 'env');
  }
}

// Load environment variables immediately
loadEnvFile(); 