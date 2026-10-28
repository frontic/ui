---
name: frontic-ui-review
description: >
  Review a page or a restyle in a project that uses Frontic UI as a fresh pair of eyes: run
  check, render the page at phone and desktop width, compare it with what it should look like,
  and report each problem with the token, recipe file or template that fixes it. Use it as the
  brief of a review subagent after a restyle, a new page or a design-system pass. It edits
  nothing; the agent that built the page fixes what it reports.
---

# Review a Frontic UI page

You review; you do not fix. The agent that built the page gives you three things:

- the route or routes, and the URL of the running dev server;
- what changed: tokens, recipe files, installed items, the page's own template;
- what it should look like: the brand's source (a storefront URL, Figma frames, screenshots) or the brief.

When one is missing, say so at the top of the report and review what you can. Don't guess the target look.

## 1. Check

Run `npx @frontic/ui check --json`. Every error is a finding as it stands. Quote its rule, where and message.

## 2. Render

Open each route at 390px and at 1280px wide with your browser tool (a Playwright or Chrome DevTools MCP, or the client's own). Take a full-page screenshot of each and keep the paths for the report. Without a dev server URL, start the project's dev script, and stop it when you are done.

With no browser tool, the report opens with `not rendered: no browser tool` and you review the code only. Never call a page fine that you have not seen.

## 3. Compare

- **Against the source or the brief**, screen by screen. For the components that carry the brand (button, badge, price, card, input), check fill, text colour, type, radius, edge and shadow. Then the page as a whole: density, how muted text reads at scale, whether sale and stock badges stand out as the source's do, whether the buy button is the loudest thing on a product page.
- **Against each item's example, for structure only.** `npx @frontic/ui docs <item>` prints its example, and `https://ui.frontic.com/components/<tier>/<name>` renders it. Look for the same parts, the same states reachable and the same behaviour at 390px. That site shows the default brand, so a different colour, font or radius there is the restyle, not a finding.
- **On the page itself:**
  - text clipped or overflowing;
  - a horizontal scrollbar at 390px;
  - an icon missing or at the wrong size;
  - an element that wears a `fui-*` class but renders unstyled (its recipe file is missing, or `build` was not run);
  - a focus ring you cannot see;
  - a long product name or an empty state that breaks the layout.

## 4. Report

One list, most severe first. Each finding says:

- what is wrong;
- where: the route, the width and the element;
- where it is fixed:
  - the whole system is off (every button too round, all muted text too light): a token in `library/brand.json`;
  - one component is off: its recipes in the component's manifest, `<name>.json` beside its files;
  - placement, layout or content: the page's own template.

Never send a fix to `frontic.css`, which `build` overwrites, or to an installed item's markup for a look. Attach the screenshot each finding comes from. End with what you could not check.

## Rules

- Edit nothing: no file, no token, no recipe.
- One finding per cause. Ten buttons with the same wrong radius are one finding about `action` or `button`.
- No finding you have not seen, in a screenshot or a `check` line.
- Values read off a screenshot are approximate; say so.
