"""
Colorectal Cancer Colleague — FastAPI backend
Serves the React build as static files and exposes /api/* endpoints.
"""
import os, json, base64, io, random
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from PIL import Image
import uvicorn

# ── model loading (lazy + background) ─────────────────────────────────────────
# The Keras/TensorFlow model is ~94MB and takes 20+ seconds to import + load.
# Loading it at import time delays the port from opening, which makes the
# deployment healthcheck time out ("port never opened"). Instead we load
# CLASS_NAMES cheaply at import and load the model in a background thread once
# the server is up, so port 5000 binds immediately and healthchecks pass.
import threading
import model_setup, helpers

CLASS_NAMES: list[str] = json.load(open(model_setup.paths["class_names.json"]))

MODEL = None
_MODEL_LOCK = threading.Lock()


def get_model():
    """Return the loaded model, loading it (once) on first use if needed."""
    global MODEL
    if MODEL is not None:
        return MODEL
    with _MODEL_LOCK:
        if MODEL is None:
            print("Loading Keras model …")
            import tensorflow as tf
            MODEL = tf.keras.models.load_model(
                model_setup.paths["model_precision_medicine.keras"]
            )
            print("Model loaded. Classes:", CLASS_NAMES)
    return MODEL

# ── app ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Colorectal Cancer Colleague")


@app.on_event("startup")
def _preload_model():
    # Warm the model in a background thread so the port opens immediately and
    # the first real prediction isn't slow. Prediction still works before this
    # finishes because get_model() loads on demand under a lock.
    threading.Thread(target=get_model, daemon=True).start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024   # 15 MB
MAX_PIXELS = 25_000_000               # ~25 megapixels (guards against decompression bombs)


class BodySizeLimitMiddleware:
    """ASGI middleware that caps the request body BEFORE it is parsed.

    Rejects with 413 on an oversized Content-Length header, and otherwise counts
    incoming body chunks and aborts as soon as the limit is exceeded — so an
    unbounded (e.g. chunked) upload is never fully spooled or parsed.
    """
    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST":
            return await self.app(scope, receive, send)

        # Early rejection via Content-Length when provided.
        headers = dict(scope.get("headers") or [])
        cl = headers.get(b"content-length")
        if cl is not None:
            try:
                if int(cl) > self.max_bytes:
                    return await self._reject(send)
            except ValueError:
                pass

        # Drain the body ourselves, bounded by max_bytes, BEFORE the app parses it.
        # This aborts oversized (incl. chunked / no-Content-Length) uploads without
        # ever fully spooling them, and lets us return a clean 413.
        received = 0
        messages = []
        while True:
            message = await receive()
            if message["type"] != "http.request":
                messages.append(message)
                break
            received += len(message.get("body", b""))
            if received > self.max_bytes:
                return await self._reject(send)
            messages.append(message)
            if not message.get("more_body", False):
                break

        # Replay the buffered body to the downstream app.
        iterator = iter(messages)

        async def replay_receive():
            try:
                return next(iterator)
            except StopIteration:
                return await receive()

        await self.app(scope, replay_receive, send)

    @staticmethod
    async def _reject(send):
        await send({
            "type": "http.response.start",
            "status": 413,
            "headers": [(b"content-type", b"application/json")],
        })
        await send({
            "type": "http.response.body",
            "body": b'{"detail":"Request body too large (max 15 MB)."}',
        })


app.add_middleware(BodySizeLimitMiddleware, max_bytes=MAX_UPLOAD_BYTES)

# ── tissue knowledge base ─────────────────────────────────────────────────────
TISSUE_INFO = {
    "tumor": {
        "title": "Tumor Tissue",
        "emoji": "🔴",
        "severity": "high",
        "description": (
            "The image shows tumor (cancer) tissue — abnormal cells that have lost "
            "their normal structure and are growing uncontrollably. In colorectal "
            "histology this typically indicates adenocarcinoma."
        ),
        "next_steps": [
            "Urgent referral to an oncologist for staging workup",
            "CT/PET scan to assess local and distant spread",
            "Discussion of surgical options (resection) with a colorectal surgeon",
            "Multidisciplinary tumor board review",
            "Genetic testing (KRAS, NRAS, BRAF, MSI/MMR) to guide treatment",
        ],
        "prognosis": "Prognosis depends on stage. Early-stage colorectal cancer has >90% 5-year survival; later stages require aggressive treatment but advances in targeted therapy are improving outcomes.",
    },
    "stroma": {
        "title": "Stromal Tissue",
        "emoji": "🟡",
        "severity": "moderate",
        "description": (
            "The image shows stromal tissue — the supportive connective tissue "
            "surrounding the colon glands. Dense stroma can indicate desmoplastic "
            "reaction, which is often associated with invasive cancer nearby."
        ),
        "next_steps": [
            "Correlate with adjacent tissue sections for tumor presence",
            "Discuss findings with your gastroenterologist",
            "Consider repeat biopsy if clinical suspicion remains high",
            "Regular colonoscopy follow-up",
        ],
        "prognosis": "Stromal tissue alone is not cancerous but its pattern (especially desmoplastic stroma) warrants careful clinical correlation.",
    },
    "lympho": {
        "title": "Lymphocyte-Rich Tissue",
        "emoji": "🟠",
        "severity": "moderate",
        "description": (
            "This image shows a lymphocyte-rich region. Dense lymphocytic infiltration "
            "can be a sign of an immune response to cancer (peritumoral lymphocytes) "
            "or an inflammatory condition such as Crohn's disease or lymphoma."
        ),
        "next_steps": [
            "Immunohistochemistry panel to characterise lymphocyte subtype",
            "Rule out primary lymphoma of the colon",
            "Inflammatory bowel disease workup if not already done",
            "Discuss with gastroenterologist or oncologist",
        ],
        "prognosis": "Strong lymphocytic infiltration in colorectal cancer is actually a positive prognostic sign (MSI-H tumours). Standalone lymphocytic tissue requires further typing.",
    },
    "mucosa": {
        "title": "Normal Mucosa",
        "emoji": "🟢",
        "severity": "low",
        "description": (
            "The image shows normal colonic mucosa — healthy glandular epithelium "
            "with regular crypts. This is what healthy colon tissue looks like."
        ),
        "next_steps": [
            "Continue routine colorectal cancer screening per age/risk guidelines",
            "No immediate action needed based on this tissue alone",
            "Maintain a high-fibre diet and active lifestyle",
            "Schedule next colonoscopy as recommended by your doctor",
        ],
        "prognosis": "Normal mucosa is an excellent finding. Routine surveillance is still important, especially if other risk factors are present.",
    },
    "adipose": {
        "title": "Adipose (Fat) Tissue",
        "emoji": "🟤",
        "severity": "low",
        "description": (
            "The image shows adipose (fatty) tissue — the fat surrounding the colon "
            "wall. This is typically seen at the resection margins or pericolic fat "
            "and is normal tissue."
        ),
        "next_steps": [
            "No specific action needed for adipose tissue alone",
            "Ensure adequate sampling of the tumour margin in surgical specimens",
            "Discuss overall biopsy context with your pathologist",
        ],
        "prognosis": "Adipose tissue by itself is benign. Its presence in a specimen provides information about surgical margins.",
    },
    "debris": {
        "title": "Cellular Debris / Necrosis",
        "emoji": "⚫",
        "severity": "moderate",
        "description": (
            "The image shows cellular debris or necrotic tissue — dead or dying cells. "
            "Necrosis within a tumour is common in rapidly growing cancers that outpace "
            "their blood supply. It can also result from treatment response."
        ),
        "next_steps": [
            "Evaluate in context of surrounding tumour tissue",
            "May indicate tumour necrosis — discuss with oncologist",
            "If post-treatment, necrosis can indicate therapy response (good sign)",
            "Ensure representative viable tumour is available for molecular testing",
        ],
        "prognosis": "Significant tumour necrosis in untreated specimens can indicate aggressive disease. Post-treatment necrosis often signals a good response.",
    },
    "complex": {
        "title": "Complex Glandular Pattern",
        "emoji": "🔵",
        "severity": "moderate",
        "description": (
            "The image shows complex glandular structures — irregularly shaped crypts "
            "that deviate from normal architecture. This pattern is characteristic of "
            "dysplasia or well-to-moderately differentiated adenocarcinoma."
        ),
        "next_steps": [
            "Full pathological grading by a GI pathologist",
            "Determine if dysplasia or invasive carcinoma via deeper sections",
            "Staging workup if adenocarcinoma is confirmed",
            "Multidisciplinary colorectal team review",
        ],
        "prognosis": "Complex glandular patterns require careful pathological assessment. Well-differentiated tumours generally have a better prognosis than poorly differentiated ones.",
    },
    "empty": {
        "title": "Empty / Acellular Region",
        "emoji": "⬜",
        "severity": "low",
        "description": (
            "The image shows an empty or largely acellular region — this could be "
            "a lumen, a tissue processing artefact, or a truly acellular area such "
            "as a cyst or mucin pool."
        ),
        "next_steps": [
            "Review adjacent tissue sections for context",
            "Check for mucin-producing tumour if mucin pools are present",
            "Discuss tissue processing quality with the pathology lab",
            "No urgent clinical action based on this region alone",
        ],
        "prognosis": "Acellular regions are typically benign but must be interpreted alongside the full biopsy specimen.",
    },
}

CHAT_KNOWLEDGE = """
You are Dr. Alex, a friendly, empathetic AI medical assistant specialising in colorectal cancer.
You explain things simply but accurately. You never give definitive diagnoses — you help
patients understand what their pathology report might mean and guide them toward talking
to their real medical team.

Key facts you know:
- The 8 colorectal tissue types: tumor, stroma, lympho, mucosa, adipose, debris, complex, empty
- Colorectal cancer stages (I–IV) and their survival rates
- Common treatments: surgery, chemotherapy (FOLFOX, FOLFIRI), targeted therapy (bevacizumab, cetuximab), immunotherapy (pembrolizumab for MSI-H)
- Screening guidelines: colonoscopy every 10 years from age 45 (average risk)
- Risk factors: age, family history, IBD, diet, obesity, smoking
- Symptoms: rectal bleeding, change in bowel habits, unexplained weight loss, abdominal pain
"""

# Simple rule-based AI responses (no external LLM required)
def generate_chat_response(message: str, context: dict) -> str:
    msg = message.lower()
    tissue = context.get("last_prediction", "")
    info = TISSUE_INFO.get(tissue, {}) if tissue else {}

    # Greeting
    if any(w in msg for w in ["hello", "hi", "hey", "good morning", "good evening"]):
        return ("Hey there! I'm Dr. Alex, your AI companion on this journey. "
                "I'm here to help you understand histology results, explain next steps, "
                "or just chat through any worries you might have. What's on your mind?")

    # About the prediction
    if tissue and any(w in msg for w in ["what", "mean", "explain", "tell me", "result", "finding"]):
        if info:
            return (f"{info['description']} \n\n"
                    f"**Suggested next steps:**\n" +
                    "\n".join(f"• {s}" for s in info["next_steps"][:3]) +
                    f"\n\n{info['prognosis']}\n\n"
                    "Remember: I'm an AI assistant — always discuss your specific results with your pathologist or oncologist.")

    # Prognosis / survival
    if any(w in msg for w in ["prognosis", "survive", "survival", "how long", "stage", "cure"]):
        if tissue == "tumor":
            return ("Colorectal cancer prognosis varies a lot by stage:\n\n"
                    "• **Stage I** — ~90% 5-year survival\n"
                    "• **Stage II** — ~75–85% 5-year survival\n"
                    "• **Stage III** — ~40–70% 5-year survival\n"
                    "• **Stage IV** — ~15% 5-year survival (improving with modern therapy)\n\n"
                    "These are population statistics — individual outcomes depend on many factors. "
                    "Your oncologist can give you a personalised picture. 💙")
        return ("Prognosis in colorectal cancer depends heavily on stage and tissue type. "
                "The most important thing right now is getting accurate staging from your medical team, "
                "so they can tailor treatment to you specifically.")

    # Treatment
    if any(w in msg for w in ["treatment", "chemo", "surgery", "immunotherapy", "targeted", "option"]):
        return ("Colorectal cancer treatment has come a long way! Common options include:\n\n"
                "• **Surgery** — removing the tumour (most early-stage cases)\n"
                "• **Chemotherapy** — FOLFOX or FOLFIRI regimens are standard\n"
                "• **Targeted therapy** — Bevacizumab (anti-VEGF) or EGFR inhibitors for RAS wild-type tumours\n"
                "• **Immunotherapy** — Pembrolizumab works very well for MSI-H / MMR-deficient tumours\n"
                "• **Radiation** — mostly used for rectal cancer\n\n"
                "Your oncologist will recommend a combination based on your tumour's molecular profile.")

    # Symptoms
    if any(w in msg for w in ["symptom", "sign", "feel", "pain", "bleed", "blood", "bowel"]):
        return ("Common warning signs of colorectal cancer include:\n\n"
                "• Rectal bleeding or blood in stool\n"
                "• Unexplained change in bowel habits lasting >4 weeks\n"
                "• Unexplained weight loss\n"
                "• Persistent abdominal pain or cramping\n"
                "• Feeling that bowels don't empty completely\n"
                "• Fatigue and weakness\n\n"
                "If you're experiencing several of these, please see your doctor promptly. "
                "Early detection makes a huge difference! 🩺")

    # Screening
    if any(w in msg for w in ["screen", "colonoscopy", "test", "check", "prevention"]):
        return ("**Colorectal cancer screening guidelines (US):**\n\n"
                "• **Average risk** — Start colonoscopy at age 45, repeat every 10 years\n"
                "• **Family history of CRC** — Start at 40 or 10 years before youngest affected relative\n"
                "• **IBD patients** — More frequent colonoscopies depending on disease extent\n"
                "• **Lynch syndrome** — Every 1–2 years from age 20–25\n\n"
                "Alternatives to colonoscopy include FIT (annual stool test) and CT colonography every 5 years. "
                "Regular screening catches cancer early when it's most treatable!")

    # Emotional support
    if any(w in msg for w in ["scared", "afraid", "worry", "anxious", "nervous", "stress", "overwhelm", "fear", "cry", "difficult"]):
        return ("I hear you, and it's completely natural to feel this way. "
                "A cancer diagnosis — or even the wait for one — is one of the most stressful experiences a person can go through.\n\n"
                "A few things that might help:\n"
                "• **Talk to someone** — a counsellor, social worker, or support group\n"
                "• **Write down questions** for your next doctor appointment\n"
                "• **Focus on what you can control** — diet, rest, support network\n"
                "• **Connect with others** — Colorectal Cancer Alliance and Cancer Support Community both offer free support\n\n"
                "You're not alone in this. 💙 I'm here whenever you need to talk.")

    # Diet / lifestyle
    if any(w in msg for w in ["diet", "eat", "food", "exercise", "lifestyle", "drink", "alcohol", "smoke"]):
        return ("Lifestyle plays a real role in colorectal cancer risk and recovery:\n\n"
                "**Protective:**\n"
                "• High-fibre diet (vegetables, whole grains, legumes)\n"
                "• Regular physical activity (150+ min/week moderate exercise)\n"
                "• Maintaining healthy weight\n"
                "• Limiting red/processed meat\n"
                "• Low-to-no alcohol\n"
                "• Not smoking\n\n"
                "**During treatment:** focus on staying nourished — a dietitian specialising in oncology can create a personalised plan.")

    # Default / conversational
    responses = [
        ("That's a great question. Colorectal cancer pathology can be complex, "
         "and I want to make sure you have the right information. Could you tell me "
         "a bit more about what you'd like to understand? I'm here to help. 💙"),
        ("I understand this can feel overwhelming. Let me know what specific aspect "
         "you'd like to explore — whether it's understanding your results, treatment options, "
         "or what to expect next — and I'll do my best to explain it clearly."),
        ("As your AI medical companion, I want to be helpful and honest: "
         "I can explain tissue types, treatments, and next steps, but your medical team "
         "knows your full situation best. What would you like to know more about?"),
    ]
    return random.choice(responses)


# ── API routes ────────────────────────────────────────────────────────────────

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    # Read in bounded chunks so an oversized upload is rejected without buffering it all.
    chunks, total = [], 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image too large (max 15 MB).")
        chunks.append(chunk)
    data = b"".join(chunks)
    try:
        image = Image.open(io.BytesIO(data))
        if (image.width * image.height) > MAX_PIXELS:
            raise HTTPException(status_code=413, detail="Image resolution too large.")
        image = image.convert("RGB")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image file.")
    try:
        label, scores = helpers.predict(get_model(), image, CLASS_NAMES)
        info = TISSUE_INFO.get(label, {})
        return {
            "prediction": label,
            "scores": scores,
            "info": info,
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Prediction failed. Please try another image.")


class ChatRequest(BaseModel):
    message: str
    context: dict = {}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    response = generate_chat_response(req.message, req.context)
    return {"response": response}


@app.get("/api/samples")
async def list_samples():
    samples_dir = Path("sample_images")
    if not samples_dir.exists():
        return {"samples": []}
    files = sorted(samples_dir.glob("*.png"))
    samples = []
    for f in files:
        parts = f.stem.rsplit("_", 1)
        label = parts[0] if len(parts) == 2 else f.stem
        samples.append({"filename": f.name, "label": label})
    return {"samples": samples}


_SAMPLES_ROOT = Path("sample_images").resolve()


@app.get("/api/samples/{filename}")
async def get_sample(filename: str):
    # Only allow a bare .png filename that resolves inside the samples directory.
    if "/" in filename or "\\" in filename or not filename.endswith(".png"):
        raise HTTPException(status_code=400, detail="Invalid sample name")
    candidate = (_SAMPLES_ROOT / filename).resolve()
    if not candidate.is_relative_to(_SAMPLES_ROOT) or not candidate.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(str(candidate), media_type="image/png")


@app.get("/api/classes")
async def get_classes():
    return {"classes": CLASS_NAMES, "info": TISSUE_INFO}


# ── static files (React build) ────────────────────────────────────────────────
FRONTEND_DIST = Path("frontend/dist")

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    _DIST_ROOT = FRONTEND_DIST.resolve()

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        candidate = (_DIST_ROOT / full_path).resolve()
        # Only serve files that resolve inside the build directory.
        if candidate.is_file() and candidate.is_relative_to(_DIST_ROOT):
            return FileResponse(str(candidate))
        return FileResponse(str(_DIST_ROOT / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"status": "Backend running. Frontend not built yet."}


# ── entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
