from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn
import cv2
import base64
import numpy as np

app = FastAPI()
model = YOLO("yolov8n.pt") # Ensure your path is correct

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Read the uploaded image
    contents = await file.read()
    # Convert bytes to numpy array for OpenCV
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. Run the model
    results = model.predict(source=img, conf=0.25)
    
    # 3. Extract data and Plot boxes
    detections = []
    annotated_img = results[0].plot() # This creates the image with boxes

    for box in results[0].boxes:
        detections.append({
            "class": model.names[int(box.cls)],
            "confidence": float(box.conf),
            "bbox": box.xyxy.tolist()
        })

    # 4. Encode the annotated image to Base64
    _, buffer = cv2.imencode('.jpg', annotated_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    # 5. Return both data and the image string
    return {
        "detections": detections,
        "image": f"data:image/jpeg;base64,{img_base64}"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)