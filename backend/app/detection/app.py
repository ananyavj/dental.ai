from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn
import cv2
from google.colab.patches import cv2_imshow

app = FastAPI()
model = YOLO("/model/best.pt")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Read the uploaded image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))

    # 2. Run the model
    results = model.predict(source=image, conf=0.25,save=True)

    res_image_path = f"{results[0].save_dir}/{results[0].path}"
    annotated_img = cv2.imread(res_image_path)
    cv2_imshow(annotated_img)

    for r in results:
        im_array = r.plot() # Plot the boxes on the image
        cv2_imshow(im_array)

        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
    
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