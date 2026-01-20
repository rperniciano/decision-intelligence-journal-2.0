const fs = require('fs');

const featuresFile = 'D:\\ClaudeData\\projects\\D--Programmi-PORTFOLIO-decision-intelligence-journal-2-0\\.features\\features.json';
const features = JSON.parse(fs.readFileSync(featuresFile, 'utf8'));
const feature78 = features.find(f => f.id === 78);

console.log(JSON.stringify(feature78, null, 2));
