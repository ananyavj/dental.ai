from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Any
import os
import io
import base64
import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
from google.cloud import vision
from google.cloud.vision import ImageAnnotatorClient, types
from langchain_google_genai import ChatGoogleGenerativeAI
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/detect", tags=["Detection"])

# Load YOLO model
MODEL_PATH = "model/best.pt"
model = YOLO(MODEL_PATH)

# Vision client (assumes GOOGLE_APPLICATION_CREDENTIALS env or ADC setup)
vision_client = ImageAnnotatorClient()

class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]

class DetectionResponse(BaseModel):
    detections: List[Detection]
    annotated_image: str  # base64 data:image/jpeg;base64,...

class VisionAnalysis(BaseModel):
    labels: List[str]
    objects: List[dict]
    text: str
    interpretation: str

@router.post("/predict", response_model=DetectionResponse)
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, detail="Invalid image file")
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, detail="Invalid image")
    
    results = model.predict(source=img, conf=0.25)
    annotated_img = results[0].plot()
    
    detections = []
    for box in results[0].boxes:
        detections.append(Detection(
            class_name=model.names[int(box.cls)],
            confidence=float(box.conf),
            bbox=box.xyxy.tolist()
        ))
    
    _, buffer = cv2.imencode('.jpg', annotated_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return DetectionResponse(
        detections=detections,
        annotated_image=f"data:image/jpeg;base64,{img_base64}"
    )

@router.post("/analyze", response_model=VisionAnalysis)
async def analyze_vision(request: dict):
    base64_image = request.get("image")  # expect { "image": "data:image/jpeg;base64,..." }
    if not base64_image:
        raise HTTPException(400, detail="No image provided")
    
    # Extract base64 data
    if base64_image.startswith("data:image"):
        base64_image = base64_image.split(",")[1]
    
    image_content = base64.b64decode(base64_image)
    
    # Google Vision API: Labels + Text + Objects
    pil_image = Image.open(io.BytesIO(image_content))
    cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    
    with io.BytesIO() as image_file:
        pil_image.save(image_file, format='JPEG')
        vision_image = types.Image(content=image_file.getvalue())
    
    # Labels detection
    labels_response = vision_client.label_detection(image=vision_image)
    labels = [label.description for label in labels_response.label_annotations[:10]]
    
    # Text detection
    text_response = vision_client.text_detection(image=vision_image)
    text = text_response.full_text_annotation.text if text_response.full_text_annotation.text else ""
    
    # Object localization (optional)
    objects_response = vision_client.object_localization(image=vision_image)
    objects = []
    for obj in objects_response.localized_object_annotations[:5]:
        objects.append({
            "name": obj.name,
            "score": obj.score,
            "bbox": obj.bounding_poly.normalized_vertices
        })
    
    # Dental interpretation via Gemini
    gemini_api_key = os.getenv("VITE_GEMINI_API_KEY")
    if not gemini_api_key:
        interpretation = "Gemini unavailable. Vision detected: " + ", ".join(labels[:5]) + ". Correlate clinically."
    else:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.1
        )
        prompt = f"""Dental X-ray analysis using Vision API output:

Labels: {labels}
Text: {text[:500]}
Objects: {objects}

Provide concise dental interpretation focusing on caries, pathology, restorations, anatomy."""
        
        response = llm.invoke(prompt)
        interpretation = response.content
    
    return VisionAnalysis(
        labels=labels,
        objects=objects,
        text=text,
        interpretation=interpretation
    )

