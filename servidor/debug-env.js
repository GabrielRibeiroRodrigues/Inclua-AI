const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
 
const envPath = path.join(__dirname, '.env');
console.log('Checking .env at:', envPath);
 
if (fs.existsSync(envPath)) {
    console.log('File exists.');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('Raw content length:', content.length);
    console.log('First 20 chars:', JSON.stringify(content.substring(0, 20)));
    
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('Dotenv error:', result.error);
    } else {
        console.log('Dotenv parsed:', Object.keys(result.parsed));
    }
} else {
    console.log('File does NOT exist.');
}

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'FOUND' : 'NOT FOUND');
