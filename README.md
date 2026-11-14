# React Workbench

A bench for the parts of React that do not exist in plain UI code: state snapshots, effects and class lifecycles, refs, memoization, context, reducers, controlled inputs, keys, the rules of hooks, Suspense, transitions, and error boundaries.

Each lesson puts a live widget next to three panels you can collapse. Code is the component the stage is running. How this runs explains that code. What if swaps in a different version of the widget. Reset stage mounts the first version again.

## Live

https://kittycatbytes.github.io/react-workbench/

Static files only. Vite builds the SPA; GitHub Pages serves `dist/` on every push to `main`. Feedback from the page posts to FormSubmit, which emails the note. There is no app server.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. `npm run build` typechecks and writes `dist/`.
