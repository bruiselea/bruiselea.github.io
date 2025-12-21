from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import subprocess
import os
import shutil
import json
import uuid

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WORK_DIR = "temp_work"
os.makedirs(WORK_DIR, exist_ok=True)

# Mount the work directory to serve string generated files
app.mount("/files", StaticFiles(directory=WORK_DIR), name="files")

@app.post("/api/generate")
async def generate_signboard(
    shape: str = Form(...),
    logo: UploadFile = File(None),
    content_configs: str = Form(...),
    footer_text: str = Form("")
):
    try:
        # Generate a unique ID for this request to avoid collisions
        request_id = str(uuid.uuid4())
        
        # 1. Handle Logo
        logo_filename = ""
        if logo:
            ext = os.path.splitext(logo.filename)[1]
            logo_path = os.path.join(WORK_DIR, f"{request_id}_logo{ext}")
            with open(logo_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
            logo_filename = logo_path
            
            # TODO: Convert to SVG using potrace mechanism here
            # For now, we just pass the file path, but OpenSCAD needs SVG or DXF usually for 2D import
            # If it's a PNG, we'd need code here to convert.
        
        # 2. Prepare OpenSCAD variables
        # Absolute path to the scad directory
        base_scad = os.path.abspath("../scad/signboard_core.scad")
        
        # Generate SCAD override script
        scad_content = f"""
include <{base_scad}>;

SHAPE_TYPE = "{shape}";
// Add other overrides based on content_configs later
"""
        
        generated_scad_path = os.path.join(WORK_DIR, f"{request_id}.scad")
        with open(generated_scad_path, "w") as f:
            f.write(scad_content)
            
        # 3. Run OpenSCAD
        output_filename = f"{request_id}.stl"
        output_stl_path = os.path.join(WORK_DIR, output_filename)
        
        # Check system openscad path
        openscad_cmd = "openscad"
        possible_paths = [
            "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD",
            os.path.expanduser("~/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD")
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                openscad_cmd = path
                break
            
        cmd = [openscad_cmd, "-o", output_stl_path, generated_scad_path]
        print(f"Using OpenSCAD at: {openscad_cmd}")
        print(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print("OpenSCAD Error:", result.stderr)
            # Fallback for dev without OpenSCAD: Return a mock or error
            # return {"status": "error", "message": "OpenSCAD generation failed", "details": result.stderr}
            # For now, if it fails, we might check if file exists (mock test)
            if not os.path.exists(output_stl_path):
                 raise HTTPException(status_code=500, detail=f"OpenSCAD failed: {result.stderr}")

        return {
            "status": "success",
            "stl_url": f"http://localhost:8000/files/{output_filename}"
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
