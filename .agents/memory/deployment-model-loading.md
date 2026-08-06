---
name: Heavy model load must not block port binding
description: Why the Keras/TF model loads lazily in a background thread instead of at import time
---

Load the ~94MB Keras/TensorFlow model lazily (background thread on startup + on-demand
`get_model()` under a lock), never at module import time.

**Why:** Loading TF + the model at import took 20+ seconds, so uvicorn only bound port
5000 after that. VM deployment healthchecks hit `/` immediately, kept failing with
"port never opened, expected port 5000", killed the container, and it looped forever.
Also never pass `"app:app"` (import string) to `uvicorn.run` here — it re-imports the
module and loads the model twice (double memory). Pass the `app` object directly.

**How to apply:** Any expensive one-time init (model load, large asset warm-up) must
happen after the port is open. Keep the healthcheck path `/` cheap (it serves the React
index.html and needs no model). If you add a readiness endpoint, don't gate `/` on it.
