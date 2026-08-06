---
name: Three.js / react-three-fiber in the frontend
description: Version pinning and screenshot-sandbox WebGL limitation for the 3D Digital Twin page
---

# react-three-fiber version pin
- The frontend is React 18. `@react-three/fiber` v9 requires React 19 and will fail `npm install` with ERESOLVE.
- Use `@react-three/fiber@^8` with `@react-three/drei@^9` (+ `three`) for React 18.
- **Why:** picking the latest fiber silently pulls a React-19 peer and breaks install.

# WebGL is unavailable in the screenshot/preview sandbox
- The headless environment behind the Screenshot tool cannot create a WebGL context ("Could not create a WebGL context" / "Context Lost"). An unguarded `<Canvas>` throws and blanks the whole React tree.
- Guard every 3D page with BOTH a preflight `webglAvailable()` check AND a React error boundary around `<Canvas>`, rendering a friendly fallback. Real desktop browsers render fine; do not treat sandbox WebGL failure as a real bug.
- **How to apply:** you cannot visually verify 3D scenes via Screenshot — verify the build succeeds and the fallback renders, then trust the geometry.
