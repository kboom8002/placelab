import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const PRIVATE_DIR = path.join(process.cwd(), 'private', 'raw_responses');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function processFile(filePath: string) {
  if (!filePath.endsWith('.json')) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    let modified = false;

    // Helper to sanitize an array of items
    const sanitizeItems = (items: any[]) => {
      items.forEach((item, index) => {
        const text = item.response || item.raw_response || item.ai_text || item.raw_text;
        if (text) {
          modified = true;
          const hash = crypto.randomBytes(8).toString('hex');
          
          // Save the raw text to private storage
          const privateFile = path.join(PRIVATE_DIR, `${path.basename(filePath, '.json')}_item_${index}_${hash}.txt`);
          fs.writeFileSync(privateFile, text);

          // Strip from object
          delete item.response;
          delete item.raw_response;
          delete item.ai_text;
          delete item.raw_text;
          
          item.raw_hash = hash;
        }
      });
    };

    if (Array.isArray(data)) {
      sanitizeItems(data);
    } else if (data.results && Array.isArray(data.results)) {
      sanitizeItems(data.results);
    } else if (data.observations && Array.isArray(data.observations)) {
      sanitizeItems(data.observations);
    }

    if (modified) {
      console.log(`Sanitized ${filePath}`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

ensureDir(PRIVATE_DIR);
walk(DOCS_DIR);
console.log('Sanitization complete.');
