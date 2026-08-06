# Colorectal Cancer Colleague

An AI-powered web app for colorectal histology tissue classification. Users upload
histology images and get instant CNN-based tissue-type predictions (8 classes) with
confidence bars, clinical guidance, an AI companion chat ("Dr. Alex"), and a
guessing game.

## Stack
- **Backend:** FastAPI (Python 3.11) — serves the model inference API and the built React app.
- **Frontend:** React + Vite (in `frontend/`), built to `frontend/dist/` and served as static files by FastAPI.
- **Model:** ResNet50 transfer-learning Keras model (`model_precision_medicine.keras`), TensorFlow.

## Key files
- `app.py` — FastAPI server (API + static hosting). Loads the model at startup.
- `helpers.py` — model preprocessing + prediction (provided by import bundle; do not change the preprocessing — the model expects 224×224 padded images on a 0–255 scale, NO normalization).
- `model_setup.py` — resolves file paths (local or HF Hub); load all bundle files via `model_setup.paths["<filename>"]`.
- `class_names.json` — the 8 tissue class labels.
- `sample_images/` — real histology samples from the model's data, used as built-in examples.
- `frontend/src/` — React app (pages: Diagnosis, Guessing Game, Dr. Alex, About).

## How to run (development)
The "Start application" workflow runs `python3 app.py`, binding to `0.0.0.0:5000`.
- After changing frontend code: `cd frontend && npm run build`, then restart the workflow.
- After changing backend code: restart the "Start application" workflow.

## API endpoints
- `POST /api/predict` — multipart image upload → `{prediction, scores, info}`
- `POST /api/chat` — `{message, context}` → `{response}` (rule-based AI companion)
- `GET /api/samples` — list built-in sample images
- `GET /api/samples/{filename}` — serve a sample image
- `GET /api/classes` — class list + tissue info

## Deployment
- Target: **VM** (always-running, keeps the 94MB model warm in memory to avoid cold-start reloads).
- Build: `cd frontend && npm install && npm run build`
- Run: `python3 app.py`

## Notes
- The AI chat ("Dr. Alex") is a rule-based responder (no external LLM key required).
- Educational use only — not a medical device.
