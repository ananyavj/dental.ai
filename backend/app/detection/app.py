from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn

app = FastAPI()
model = YOLO("/model/best.pt")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Read the uploaded image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    # 2. Run the model
    results = model(image)
    
    # 3. Extract data to send back as JSON
    detections = []
    for r in results:
        for box in r.boxes:
            detections.append({
                "class": model.names[int(box.cls)],
                "confidence": float(box.conf),
                "bbox": box.xyxy.tolist() # [xmin, ymin, xmax, ymax]
            })

    return {"detections": detections}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)