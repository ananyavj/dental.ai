# X-Ray Detection + Google Vision Integration TODO

## Plan Overview
Integrate YOLO detection backend with xray-page.tsx, show annotated results, pass to Google Vision API for analysis.

## Steps (Approved - Proceed Sequentially)

### 1. ✅ Create Backend Detection Router [DONE]
- Created `dental.ai/backend/app/routers/detection.py`
- Moved `/predict`, fixed model path to "model/best.pt"
- Added `/analyze` Google Vision + Gemini dental interp

### 2. ✅ Update main.py [DONE]
- Imported `from app.routers import detection`
- Mounted `app.include_router(detection.router, prefix="/api/detect", tags=["Detection"])` 

### 3. ✅ Install Backend Dependencies [DONE]
- Added `google-cloud-vision` to backend/requirements.txt (langchain-google-genai already present)
- User can run `cd dental.ai/backend && pip install -r requirements.txt`

### 4. ✅ Update Frontend Types [DONE]
- Added DetectionResult, VisionResult to `src/types/index.ts`
- Extended XrayResult with optional detection/vision

### 5. ✅ Update xray-page.tsx [DONE]
- Added states for detectResult, visionResult, fullReport
- Implemented handleFile: upload → detect → vision → merged report
- Tabs UI: Original/Detected/Vision/Report with skeletons
- Updated saveXrayReport with full data
- TS types integrated 

### 6. ✅ Update data-client.ts [DONE]
- Added XrayResult import, typed saveXrayReport param

### 7. ✅ Deprecate standalone detection/app.py [DONE]
- Backend now uses routers/detection.py mounted in main.py
- Standalone app.py can be removed/archived

### 8. Test & Complete
- Backend endpoints
- Frontend flow
- attempt_completion

**Next Action:** Complete Step 2 (update main.py), mark done, proceed.

