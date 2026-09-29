from fastapi import FastAPI

from app.database.database import Base, engine
from app.routes.captures import router as captures_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Echo",
    description="Local-first creative memory system",
    version="0.1.0",
)


app.include_router(captures_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
