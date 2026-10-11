# Colorectal Cancer Histology Classification

A machine learning project built through **Inspirit AI Scholars** exploring how AI can classify colorectal tissue images. The project combines deep learning, image analysis, and an interactive application to make exploring tissue classification more accessible.

## About the Project

Colorectal tissue samples can look very different from one another, making tissue classification an important part of pathology. For this project, I worked on training machine learning models to recognize different types of tissue from microscope images.

The project focused on comparing different approaches, improving model performance, and exploring how AI predictions could be displayed in an interactive application.

## What It Does

The model classifies H&E-stained colorectal tissue images into eight categories:

- Adipose
- Complex
- Debris
- Empty space
- Lympho
- Mucosa
- Stroma
- Tumor

The project also explores visual explanations of model predictions and includes an interactive application for viewing and testing image classifications.

## How I Built It

- **Python:** Used to develop and evaluate the machine learning models.
- **CNN:** Built a convolutional neural network to classify tissue images.
- **Data Augmentation:** Tested image transformations to help improve model performance.
- **ResNet50:** Used transfer learning to improve classification results.
- **Grad-CAM:** Explored heatmaps to visualize which image regions influenced predictions.
- **Replit AI:** Used AI-assisted development tools to help build the supporting application.

## Results

I experimented with different model architectures and training approaches to see which performed best.

| Approach | Result |
|---|---|
| Baseline CNN using Adam | 74.2% accuracy |
| Augmentation-based approach | Approximately 70% recall |
| ResNet50 transfer learning | Approximately 91% average recall and 90% precision |

Transfer learning performed better than the baseline approaches in our experiments. These results reflect performance on the evaluated dataset and do not establish clinical reliability.

## Application Features

The broader project explored several interactive features:

- **Tissue Classification:** Upload an image and view the model's predicted tissue category.
- **Prediction Heatmaps:** Visualize image regions that influence predictions.
- **Sample Gallery:** Explore example tissue images.
- **Interactive Learning:** Test your ability to identify tissue types alongside the AI.

## Repository Structure

- `app.py` — application backend
- `helpers.py` — supporting prediction functions
- `model_setup.py` — model setup
- `model_config.json` — model configuration
- `class_names.json` — tissue category labels
- `model_precision_medicine.keras` — saved model
- `requirements.txt` — Python dependencies
- `frontend/` — application frontend
- `sample_images/` — example images

## What I Learned

This project gave me experience with training and evaluating neural networks, working with image data, addressing overfitting, and using transfer learning. I also explored how machine learning models can be incorporated into an interactive application.

One of the biggest takeaways was that building a model involves more than just achieving a high score. Choosing the right approach, evaluating results carefully, and understanding the model's limitations are all important.


## Acknowledgments

Developed through Inspirit AI Scholars, with AI-assisted tools used during application development.
