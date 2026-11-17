# Snake Evolution

A modern, polished take on the classic Snake game with evolution mechanics, premium UI, and responsive design.

## Features

### Core Gameplay
- **Classic Snake Mechanics** - Smooth grid-based movement with responsive controls
- **Evolution System** - Grow and evolve through 10 unique stages (Hatchling → Leviathan)
- **Multiple Food Types** - Normal, Speed, Shield, Shrink, and rare Golden food
- **Power-ups** - Magnet, Slow Motion, Ghost Mode, and Double Points
- **Boost/Dash Ability** - Unlock at Evolution 2, consume boost meter for speed burst
- **Combo System** - Chain food eating for score multipliers

### Visual & Audio
- **Cyberpunk Aesthetic** - Dark theme with neon accent colors
- **Particle Effects** - Food bursts, evolution explosions, boost trails, death explosions
- **Procedural Audio** - Web Audio API generated sounds (no external files needed)
- **Smooth Animations** - 60fps rendering with interpolation
- **Screen Shake** - Impact feedback on evolution and death

### UI/UX
- **Premium Menu System** - Start screen, controls, stats, pause, game over
- **Real-time HUD** - Score, length, evolution progress, boost meter, high score
- **Mobile Touch Controls** - Virtual D-pad with swipe gestures and double-tap boost
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Statistics Tracking** - Games played, total score, best length, evolutions, play time
- **High Score Persistence** - Saved to localStorage

### Technical
- **ES Modules** - Modern JavaScript architecture
- **Object Pooling** - Efficient particle system (1000+ particles)
- **Event-Driven** - Clean separation of concerns
- **No Dependencies** - Pure vanilla JavaScript
- **Accessibility** - Keyboard navigation, reduced motion support, high contrast mode

## Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move Up | ↑ / W | Swipe Up |
| Move Down | ↓ / S | Swipe Down |
| Move Left | ← / A | Swipe Left |
| Move Right | → / D | Swipe Right |
| Boost/Dash | Space | Double Tap |
| Pause | P / Esc | Pause Button |

## Evolution Stages

| Level | Name | Color | Ability |
|-------|------|-------|---------|
| 1 | Hatchling | Green | - |
| 2 | Serpent | Cyan | Dash |
| 3 | Viper | Mint | Dash |
| 4 | Cobra | Lime | Dash |
| 5 | Python | Yellow-Green | Shield |
| 6 | Anaconda | Yellow | Shield |
| 7 | Basilisk | Bright Yellow | Ghost |
| 8 | Hydra | Orange | Ghost |
| 9 | Dragon | Red-Orange | Magnet |
| 10 | LEVIATHAN | Red-Pink | All |

## Food Types

| Type | Color | Points | Effect |
|------|-------|--------|--------|
| Normal | Green | 10 | +1 length |
| Speed | Cyan | 15 | Temporary speed boost |
| Shield | Gold | 20 | One-hit protection |
| Shrink | Red | 25 | -2 length |
| Golden | Gold | 100 | +3 length, score multiplier |

## Power-ups

| Type | Icon | Duration | Effect |
|------|------|----------|--------|
| Magnet | 🧲 | 5s | Attracts nearby food |
| Slow Motion | ⏱ | 5s | 50% game speed |
| Ghost | 👻 | 5s | Pass through walls |
| Double Points | 2× | 10s | 2x all scores |

## Installation

Simply open `index.html` in a modern browser. No build step required.

```bash
# Or serve with a local server
npx serve .
# or
python -m http.server 8000
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Requires: ES Modules, Web Audio API, Canvas API, localStorage

## Project Structure

```
snake-evolution/
├── index.html          # Main entry point
├── css/
│   ├── main.css        # Core styles
│   └── responsive.css  # Responsive breakpoints
├── js/
│   ├── constants.js    # Game configuration
│   ├── utils.js        # Utility functions
│   ├── audio.js        # Web Audio API sound system
│   ├── particles.js    # Particle effects
│   ├── snake.js        # Snake entity
│   ├── food.js         # Food & power-up system
│   ├── evolution.js    # Evolution manager
│   ├── game.js         # Main game engine
│   ├── ui.js           # UI controller
│   └── main.js         # Application entry
├── assets/
│   ├── icons/          # SVG icons
│   └── sounds/         # (Procedural - empty placeholders)
└── screenshots/        # Placeholder screenshots
```

## Development

### Adding New Food Types
Edit `js/constants.js` - add to `FOOD_TYPES` object and `FOOD_TYPE_ARRAY`.

### Adding New Evolution Stages
Edit `js/constants.js` - add to `EVOLUTION_STAGES` array and `COLOR_PALETTE.snakeColors`.

### Modifying Game Balance
Edit `js/constants.js` - `GAME_CONFIG` object contains all tunable parameters.

## Performance

- **60 FPS** on modern devices
- **< 50KB** gzipped (excluding fonts)
- **Zero dependencies**
- **Object pooling** for particles (no GC pressure during gameplay)
- **Efficient rendering** - only dirty rects, layered canvases

## License

MIT License - feel free to use, modify, and distribute.

## Credits

- Fonts: [Orbitron](https://fonts.google.com/specimen/Orbitron) & [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) via Google Fonts
- Built with vanilla HTML5, CSS3, and ES6+