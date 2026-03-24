from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import societies, residents, invoices, payments, gate, dashboard

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SocietySync API",
    description="Automated Billing & Recovery Portal for Housing Societies",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(societies.router)
app.include_router(residents.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(gate.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "name": "SocietySync API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
