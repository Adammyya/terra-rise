import time
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from schemas.analysis import AnalysisResponse, Query
from orchestrator.workflow import execute_workflow

import models
from database import engine, get_db
from routers.auth import (
    router as auth_router,
    get_current_user,
    get_current_user_from_token_string,
)


load_dotenv()

# Auto-create tables on startup (idempotent)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SatQuery AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


@app.get("/")
def home():
    return {
        "service": "SatQuery AI Remote-Sensing Intelligence Workstation",
        "status": "online",
        "supported_modalities": ["optical", "optical+sar_visual_proxy"],
    }


@app.post("/analyze")
def analyze(data: Query):
    return {
        "task": "satellite_analysis",
        "answer": f"SatQuery received: {data.query}",
        "confidence": 0.90,
    }


@app.post("/ai/analyze", response_model=AnalysisResponse)
async def ai_analyze(
    query: str = Form(...),
    image: UploadFile = File(...),
    image2: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    start_time = time.time()

    try:
        # -----------------------------
        # Observation T1
        # -----------------------------
        image_bytes = await image.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image file is empty.",
            )

        mime_type = image.content_type or "image/jpeg"
        supported_mimes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg",
            "image/tiff",
            "image/tif",
        ]

        if mime_type not in supported_mimes:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format '{mime_type}'.",
            )

        # -----------------------------
        # Observation T2 (optional)
        # -----------------------------
        image2_bytes = None
        mime_type2 = None
        image2_filename = None

        if image2 is not None:
            image2_bytes = await image2.read()

            if not image2_bytes:
                raise HTTPException(
                    status_code=400,
                    detail="Second uploaded image file is empty.",
                )

            mime_type2 = image2.content_type or "image/jpeg"

            if mime_type2 not in supported_mimes:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported second image format '{mime_type2}'.",
                )

            image2_filename = image2.filename or "satellite_image_t2"

        # -----------------------------
        # Execute workflow
        # -----------------------------
        result = execute_workflow(
            query,
            image_bytes,
            mime_type,
            image.filename or "satellite_image_t1",
            image2_bytes,
            mime_type2,
            image2_filename,
        )

        result["execution"]["latency_ms"] = int(
            (time.time() - start_time) * 1000
        )

        # T1 metadata
        result["image"] = {
            "filename": image.filename,
            "mime_type": mime_type,
        }

        # T2 metadata, only when supplied
        if image2 is not None:
            result["image2"] = {
                "filename": image2.filename,
                "mime_type": mime_type2,
            }

        # -----------------------------
        # Optional authenticated history
        # -----------------------------
        current_user = None

        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ", 1)[1]
            current_user = get_current_user_from_token_string(token, db)

        if current_user:
            db_analysis = models.Analysis(
                user_id=current_user.id,
                query=query,
                task=result.get("task", ""),
                answer=result.get("answer", ""),
                image_filename=image.filename,
                workflow=result.get("workflow", ""),
                confidence=result.get("confidence") or 0.0,
            )

            db.add(db_analysis)
            db.commit()

        return result

    except HTTPException:
        raise

    except Exception as exc:
        err_msg = str(exc)

        if "GEMINI_QUOTA_EXHAUSTED" in err_msg:
            raise HTTPException(
                status_code=429,
                detail=(
                    "AI analysis is temporarily unavailable because the Gemini API "
                    "quota has been reached. Please try again later."
                ),
            )

        raise HTTPException(
            status_code=503,
            detail=f"SatQuery engine analysis unavailable: {err_msg}",
        )