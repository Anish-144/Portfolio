# Anish Patel — Portfolio

A single-page portfolio for an AI engineer working across agentic AI, RAG systems, and cybersecurity. A real-time procedural 3D sculpture (React Three Fiber) opens the page, travels behind every section as you scroll, and reassembles in the closing contact section. The sections are choreographed with GSAP.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script              | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload                      |
| `npm run typecheck` | Strict TypeScript check (app + Vite config)          |
| `npm run build`     | Type check, then production build into `dist/`       |
| `npm run preview`   | Serve the production build at http://localhost:4173 |

The project has no linter configured. The strict `tsc` check acts as the gate.

While testing, these are useful:

- `?nowebgl` forces the CSS fallback sculpture, e.g. `http://localhost:5173/?nowebgl`.
- `#projects/<id>` deep-links to a case study (`auditai`, `cyberguard`, `cloudguard`, `safedrive-ai`).
- Turning on your OS "reduce motion" setting shows the static variant.
- Development builds show dashed amber **DEV** notes beside content that still needs confirmation. Production builds never render them.

## Deploy on Render

The repository includes a Render Blueprint (`render.yaml`) and pins Node 22 (`.node-version`).

1. In Render, choose **New → Blueprint** and select this repository.
2. Accept the defaults. The build command is `npm ci && npm run build` and the publish directory is `dist`.
3. Every push to `main` redeploys automatically.

If you create a plain **Static Site** instead of a Blueprint, enter that build command and publish directory yourself. No rewrite rules are needed: in-page links and case-study links use `#` URLs.

## Editing content

All personal information lives in `src/content/`:

| File              | Contents                                                        |
| ----------------- | --------------------------------------------------------------- |
| `profile.ts`      | Name, email, social links, education, hero/about/contact copy   |
| `experience.ts`   | Roles; set `period.confirmed` once a date range is verified     |
| `projects.ts`     | Project cards and full case studies (one entry drives both)     |
| `skills.ts`       | Skill groups, each optionally linked to where it was applied    |
| `achievements.ts` | Awards and credentials                                          |

Section ids and navigation are defined in `src/config/site.ts`.

## Architecture

```
src/
  config/site.ts           Section ids + navigation
  content/                 All editable content (see above)
  animation/               GSAP hooks: intro, hero scroll-out, reveals, layout refresh
  hooks/                   Scroll-spy, stage and section measurement, media queries
  components/
    nav/                   Fixed header, mobile menu (<dialog>), scroll-progress rail
    hero/                  Headline, CTAs, annotations, scroll cue
    about/ experience/ skills/ achievements/ contact/
    projects/              Cards, SVG illustrations, case-study dialog, hash routing
    scene/                 3D scene (lazy chunk), journey stations, CSS fallback
    ui/                    Section heading, CTA, tags, icons
```

**A teardown that travels with the reader.** The WebGL canvas sits fixed behind transparent sections. Every section has a *station* in `src/components/scene/journey.ts`. A station sets:

- which components are on stage, and where they sit;
- the camera framing (`fit`) and viewpoint;
- how far apart the parts are pulled;
- lighting, opacity, tempo, iris aperture, data-stream density, and data-bus activity.

Between stations, departing components shrink back into depth along the assembly axis, and the arriving one grows out of it, like a product breakdown video:

| Section | Component isolated |
|---|---|
| Hero | Full assembly |
| About | Part 01: core unit, shell parted |
| Experience | Part 02: indexing ring, stepping like a timeline |
| Projects | Part 03: full exploded view |
| Skills | Part 04: turbine stage with data bus |
| Achievements | Part 05: instrument gimbals |
| Contact | Reassembled |

On wide screens, a callout (dimension ring, leader line, part label from `src/content/breakdown.ts`) appears as each section arrives and fades as you read on. Phones get the same teardown without callouts.

The sculpture is built entirely in code:

- **Core:** split shell with chrome meridian ribs, knurled pole crowns with amber pins, an inner gyroscope, and a 10-blade iris;
- **Indexing ring:** machined segments with vent slots and end bolts, riding on a 22-ball bearing whose cage turns at half speed;
- **Turbine:** a rotor with bolt circles, a counter-rotating stator row on a spoked frame, and coolant loops;
- **Data bus:** memory blocks on a machined mounting race;
- **Gear gimbal:** pivot bearings, three pinions meshing at the true gear ratio, and an engraved inscription;
- **Dial gimbal, scanner orbit and network lattice;**
- **Effects:** a GPU particle stream and an amber pulse at each station arrival.

Metal surfaces carry a turned-metal roughness grain.

**360° rotation.** In the hero and contact sections the sculpture can be turned freely:

- **Mouse or pen:** drag on any axis, with momentum.
- **Touch:** sideways swipes spin it, and vertical swipes still scroll the page.
- **Keyboard:** focus the sculpture and use the arrow keys (Shift for bigger steps).

After about 5 seconds without input it eases back to its composed pose. Input lives in `src/animation/useDragRotate.ts`, and `Sculpture.tsx` applies it. Elsewhere the sculpture is a non-interactive background.

The hero and contact stages are empty layout cells. A camera lens shift (`setViewOffset`) projects the sculpture into them, so it never covers their text. In content sections it stays dimmed behind the copy, and a page-coloured halo keeps text legible. Narrow screens use a quieter station set that keeps to the edges. Rendering pauses while a case study or the menu is open. With reduced motion, the sculpture only appears, static, in the hero and contact sections.

**Motion ownership.** GSAP owns timing: it tweens plain numbers (`motion.intro`, `motion.scroll`, `motion.finale`), and the scene reads them inside React Three Fiber's single render loop.

- **Cleanup:** all GSAP work runs inside `gsap.matchMedia`, which reverts cleanly on unmount (including StrictMode) and switches live to reduced motion.
- **Reveals:** below-the-fold reveals use an IntersectionObserver plus a scroll sweep, so content scrolled or jumped past (deep links, restored scroll, find-in-page) is shown immediately. Hidden states are only ever applied by script. Section labels decode into place (GSAP ScrambleText).
- **Refresh:** ScrollTrigger refreshes when fonts load and whenever the page height changes.

**Project diagrams** are SVG schematics with two compositions each: a wide one, and a portrait one for narrow containers, so labels stay legible on phones. Lines draw in, bars grow, and nodes fade in the first time a diagram is in view. Numeric metrics count up when revealed.

**Case studies** live in a lazy-loaded `<dialog>`, addressed as `#projects/<id>`:

- They can be shared and survive a reload.
- Browser Back closes them, and ← / → move between projects.
- Escape or the backdrop closes them, and focus returns to the opener.

**Performance.**

- **Lazy chunks:** the three.js chunk loads after first paint, and the project illustrations and case-study code are separate lazy chunks.
- **Phones and low-core devices** get lighter geometry and materials and a lower DPR cap.
- **Animations** run only while on screen and are disabled under reduced motion.

**Fallback.** WebGL 2 is required by three.js. If it is unavailable, if the renderer or its chunk fails, or if the context is lost, a CSS rendition of the sculpture takes the hero stage, and an inline copy fills the contact stage.
