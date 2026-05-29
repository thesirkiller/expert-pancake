const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\marco\\OneDrive\\Documents\\PROJETOS\\expert-pancake\\appgestorcoop.bubble', 'utf8');
const data = JSON.parse(content);

const dataTypes = [];
// Traverse the JSON to find objects with keys starting with "custom."
// This is a simplified search based on typical Bubble JSON structure.
function findCustom(obj) {
    if (typeof obj !== 'object' || obj === null) return;
    for (let key in obj) {
        if (key.startsWith('custom.')) {
            dataTypes.push(key);
        }
        findCustom(obj[key]);
    }
}

// In Bubble JSON, types are usually under a specific path, but let's just search everywhere first.
findCustom(data);

console.log(JSON.stringify([...new Set(dataTypes)], null, 2));
