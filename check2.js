const fs = require('fs');
const game = fs.readFileSync('js/game.js', 'utf8');
console.log('game.js imports Snake:', game.includes("import { Snake } from './snake.js'"));
console.log('game.js imports FoodManager:', game.includes("import { FoodManager } from './food.js'"));
console.log('game.js imports EvolutionManager:', game.includes("import { EvolutionManager } from './evolution.js'"));
console.log('game.js imports ParticleSystem:', game.includes("import { ParticleSystem"));
console.log('game.js has canvasOffsetX:', game.includes('canvasOffsetX'));
console.log('game.js has hudHeight:', game.includes('hudHeight'));