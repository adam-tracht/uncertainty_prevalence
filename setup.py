"""Package configuration for the Economic Uncertainty Analysis project."""
from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="uncertainty_prevalence",
    version="0.1.0",
    author="",
    author_email="",
    description="Analyze the prevalence of uncertainty in economic news",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3.9",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
    install_requires=[
        "python-dotenv>=1.0.0",
        "pandas>=1.5.0",
        "numpy>=1.21.0",
        "python-dateutil>=2.8.2",
        "requests>=2.28.0",
        "requests-cache>=1.0.0",
        "ratelimit>=2.2.1",
        "fastapi>=0.95.0",
        "uvicorn>=0.21.0",
        "pydantic>=1.10.5",
    ],
    extras_require={
        "dev": [
            "pytest>=7.2.0",
            "black>=22.12.0",
            "isort>=5.12.0",
            "mypy>=1.0.0",
            "pylint>=2.15.0",
            "mkdocs>=1.4.0",
            "mkdocs-material>=9.0.0",
        ],
    },
)
