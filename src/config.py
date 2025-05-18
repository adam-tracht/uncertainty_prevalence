""
Configuration settings for the Economic Uncertainty Analysis project.
"""
import os
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseSettings, HttpUrl, validator


class Settings(BaseSettings):
    """Application settings."""
    
    # Project paths
    PROJECT_ROOT: Path = Path(__file__).parent.parent
    DATA_DIR: Path = PROJECT_ROOT / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    
    # GDELT API settings
    GDELT_BASE_URL: str = "https://api.gdeltproject.org/api/v2"
    GDELT_TIMEOUT: int = 30  # seconds
    
    # Rate limiting
    REQUESTS_PER_MINUTE: int = 10  # GDELT rate limit is typically 10-15 RPM
    
    # Data collection
    DEFAULT_START_DATE: str = "2024-01-01"
    DEFAULT_END_DATE: str = "2024-12-31"
    
    # News sources (from planning.md)
    NEWS_SOURCES: Dict[str, List[str]] = {
        "major_national": [
            "nytimes.com",
            "washingtonpost.com",
            "wsj.com",
            "reuters.com",
            "apnews.com"
        ],
        "financial": [
            "bloomberg.com",
            "cnbc.com",
            "ft.com",
            "forbes.com",
            "marketwatch.com"
        ]
    }
    
    # Search terms
    PRIMARY_TERM: str = "uncertainty"
    ECONOMIC_TERMS: List[str] = [
        "economy", "economic", "market", "trade", "tariff", "inflation",
        "growth", "recession", "employment", "unemployment"
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure directories exist
os.makedirs(settings.RAW_DATA_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DATA_DIR, exist_ok=True)
