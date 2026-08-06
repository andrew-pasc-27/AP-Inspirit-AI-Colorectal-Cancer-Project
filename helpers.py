# Colorectal tissue classifier - preprocessing + inference helper.
# The model is a ResNet50 transfer model trained on histology tiles resized WITH
# PADDING to 224x224 and kept on a 0-255 scale (NOT normalized to 0-1, and with NO
# resnet preprocess_input). The app must match this exactly or predictions come out
# near-random.
#
# Usage in the Python backend:
#   import model_setup, helpers, json
#   import tensorflow as tf
#   model = tf.keras.models.load_model(model_setup.paths["model_precision_medicine.keras"])
#   class_names = json.load(open(model_setup.paths["class_names.json"]))
#   label, scores = helpers.predict(model, image, class_names)
import numpy as np
import tensorflow as tf
from PIL import Image

def preprocess(image):
    if isinstance(image, Image.Image):
        image = np.asarray(image.convert("RGB"))
    image = np.asarray(image).astype("float32")
    if image.ndim == 2:
        image = np.stack([image, image, image], axis=-1)
    if image.shape[-1] == 4:
        image = image[..., :3]
    if image.max() <= 1.0:            # if given 0-1, restore the 0-255 training scale
        image = image * 255.0
    image = tf.image.resize_with_pad(image, 224, 224, antialias=True).numpy()
    return np.expand_dims(image, 0)

def predict(model, image, class_names):
    probs = model.predict(preprocess(image), verbose=0)[0]
    scores = {class_names[i]: float(probs[i]) for i in range(len(class_names))}
    return class_names[int(np.argmax(probs))], scores
