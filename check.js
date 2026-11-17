const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log('HTML length:', html.length);
console.log('Has HUD:', html.includes('id="hud"'));
console.log('Has canvas:', html.includes('id="game-canvas"'));
console.log('Has UI overlay:', html.includes('id="ui-overlay"'));