# Fold It

A sheet of paper is 0.1 mm thick. Fold it in half, then again, and again. How far does it go?

Fold It is a scroll-driven web piece about exponential growth. Each scroll step folds the paper once. The camera zooms out with each fold: from the paper's fibres at 5,000× magnification, past fleas and elephants, the pyramids and the Matterhorn, into space, past the Moon (fold 42), the planets, the stars, and finally the edge of the observable universe (fold 102). Scrolling back up unfolds the paper. Every milestone on the folding ruler at the right can be clicked to jump straight there.

## Art

Every illustration is a public-domain or CC0 work from Wikimedia Commons:

- Robert Hooke's *Micrographia* (1665): the flea and the ant
- Ernst Haeckel's *Kunstformen der Natur* (1904): a radiolarian
- USDA Pomological Watercolors: blueberries
- Jacques de Sève's drawings for Buffon (1755–62): the cat and the elephant
- Leonardo da Vinci: the Vitruvian Man
- *Description de l'Égypte* (1809): the pyramids
- Edward Whymper, *Scrambles Amongst the Alps* (1871): the Matterhorn
- Étienne Léopold Trouvelot's astronomical drawings (1881): the Moon, Sun, planets, aurora, Milky Way, Orion Nebula and comet
- Isaac Roberts' photograph of Andromeda (1899)
- Lord Rosse's 1845 sketch of the Whirlpool Galaxy, the first spiral ever seen

The stars (Proxima, Sirius, Vega, the Pleiades) are drawn in code.

The scans are cropped and normalised so that paper becomes white and sky becomes black. They're then drawn with `multiply` or `screen` blending, which lets them sit directly on the page. The site's info panel lists the source pages.

## Run it

```bash
npm install
npm run dev      # http://127.0.0.1:5180
npm run build    # static site in dist/
```

Built with Vite + TypeScript, with no framework. Two canvases draw the sky, the Earth and the folding paper, and a DOM layer holds the plates and labels.
