# Fold It

A sheet of paper is 0.1 mm thick. Fold it in half, then again, and again. How many folds until it reaches the Moon?

Fold It is an interactive web toy about exponential growth. Every fold doubles the stack. The camera keeps zooming out, so you watch the paper grow from microscope scale, past ants, people, skyscrapers, Everest and the edge of space, all the way to the Moon at fold 42. If you keep going, it reaches the edge of the observable universe at fold 102.

## Features

- A continuous zoom from 5,000× magnification out to billions of light years, built on a single log-scale camera
- A real fold animation in side view: the right half swings over the hinge and lands on top
- Around 30 hand-drawn SVG objects shown at true scale, plus altitude markers (jets, ISS, GPS, the Moon, Voyager, Andromeda…)
- A sky that darkens with altitude, a curved Earth, the Moon, the Sun, the Milky Way and the observable universe
- Every sound is synthesised live with the Web Audio API: paper whoosh, landing thump, milestone chimes, and a space ambience
- Guess the number of folds first, then see how far off you were
- Space or click to fold, hold to keep folding, ← to unfold, M to mute

## Run it

```bash
npm install
npm run dev      # http://127.0.0.1:5180
npm run build    # static site in dist/
```

Built with Vite + TypeScript, with no framework. Rendering uses two canvases plus a DOM layer for the crisp SVG illustrations.
