
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine
from app.models.rescue_event import RescueEvent
from app.models.theme import Theme
from app.models.capture_asset import CaptureAsset
from app.routes.captures import router as captures_router
from app.routes.rescues import router as rescues_router
from app.routes.themes import router as themes_router
from app.routes.assets import router as assets_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Echo",
    description="Local-first creative memory system",
    version="0.1.0",
)

# Permite que o frontend Vite acesse a API durante o desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(captures_router)
app.include_router(themes_router)
app.include_router(rescues_router)
app.include_router(assets_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
