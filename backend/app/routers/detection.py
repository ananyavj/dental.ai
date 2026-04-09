from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
import os
import io
import base64
import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
from google.cloud import vision
from google.cloud.vision import ImageAnnotatorClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import json
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Detection"])

# Initialize external clients defensively so missing local setup does not crash the app.
model = None
vision_client = None

try:
    model = YOLO("model.pt")
except Exception as exc:
    print(f"Warning: YOLO model failed to initialize - {exc}")

try:
    vision_client = ImageAnnotatorClient()
except Exception as exc:
    print(f"Warning: Vision client failed to initialize - {exc}")

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
    if model is None:
        raise HTTPException(status_code=503, detail="YOLO model is not configured or failed to initialize.")

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
            bbox=[float(value) for value in box.xyxy[0].tolist()]
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
    
    labels: List[str] = []
    objects: List[dict] = []
    text = ""

    if vision_client is not None:
        # Google Vision API: Labels + Text + Objects
        pil_image = Image.open(io.BytesIO(image_content))

        with io.BytesIO() as image_file:
            pil_image.save(image_file, format='JPEG')
            vision_image = vision.Image(content=image_file.getvalue())

        try:
            labels_response = vision_client.label_detection(image=vision_image)
            labels = [label.description for label in labels_response.label_annotations[:10]]

            text_response = vision_client.text_detection(image=vision_image)
            text = text_response.full_text_annotation.text if text_response.full_text_annotation.text else ""

            objects_response = vision_client.object_localization(image=vision_image)
            for obj in objects_response.localized_object_annotations[:5]:
                objects.append({
                    "name": obj.name,
                    "score": obj.score,
                    "bbox": obj.bounding_poly.normalized_vertices
                })
        except Exception as exc:
            print(f"Warning: Google Vision analysis failed - {exc}")
    
    # Dental interpretation via Gemini
    gemini_api_key = os.getenv("VITE_GEMINI_API_KEY")
    if not gemini_api_key:
        if labels:
            interpretation = "Gemini unavailable. Vision detected: " + ", ".join(labels[:5]) + ". Correlate clinically."
        else:
            interpretation = "Gemini unavailable. Google Vision is not configured, so this response is a minimal fallback. Correlate the image clinically."
    else:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_api_key,
            temperature=0.1
        )
        prompt_text = f"""You are analyzing a dental radiograph.

If Google Vision results are available, use them as supporting context.
If not, analyze the image directly.

Vision labels: {labels}
Vision text: {text[:500]}
Vision objects: {objects}

Provide concise dental interpretation focusing on caries, pathology, restorations, anatomy, and clinical next steps."""

        try:
            response = llm.invoke([
                HumanMessage(content=[
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": f"data:image/jpeg;base64,{base64_image}"},
                ])
            ])
            interpretation = response.content
        except Exception as exc:
            print(f"Warning: Gemini vision fallback failed - {exc}")
            if labels:
                interpretation = "Gemini failed, but Vision detected: " + ", ".join(labels[:5]) + ". Correlate clinically."
            else:
                interpretation = "Gemini failed and Google Vision is unavailable. Correlate the image clinically."
    
    return VisionAnalysis(
        labels=labels,
        objects=objects,
        text=text,
        interpretation=interpretation
    )
