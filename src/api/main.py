"""
FastAPI application for the Economic Uncertainty Analysis API.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Economic Uncertainty Analysis API",
    description="API for analyzing uncertainty in economic news",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Economic Uncertainty Analysis API",
        "version": app.version,
        "docs": "/docs",
    }
