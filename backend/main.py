from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.analysis import router as analysis_router

app = FastAPI(title="Legal Clause Risk Analyzer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analysis_router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def healthcheck():
    return {"status": "ok"}
