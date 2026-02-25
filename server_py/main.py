"""
FastAPI main application — mirrors server/index.js
Run:  uvicorn server_py.main:app --port 3001 --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, seed_data
from .routes import projects, experiments, splits, search, upload, llm_search, line_lots, analysis

# ── App ──
app = FastAPI(title="Lab DB API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Init DB ──
init_db()
seed_data()

# ── Wire up index invalidation callbacks ──
experiments.set_invalidate_index(search.invalidate_index)
splits.set_invalidate_index(search.invalidate_index)
upload.set_invalidate_fns(search.invalidate_index, llm_search.invalidate_index)

# ── Register routers ──
app.include_router(projects.router)
app.include_router(experiments.router)
app.include_router(splits.router)
app.include_router(search.router)
app.include_router(upload.router)
app.include_router(llm_search.router)
app.include_router(line_lots.router)
app.include_router(analysis.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server_py.main:app", host="0.0.0.0", port=3001, reload=True)
