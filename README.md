# Economic Uncertainty Analysis

Analyze the prevalence of uncertainty in economic news using GDELT data.

## Project Overview

This project tracks and analyzes the frequency of the term "uncertainty" in economic news articles from major news sources, with a focus on understanding its relationship with trade policies and economic indicators.

## Features

- Data collection from GDELT Web NGrams 3.0 API
- Time series analysis of uncertainty mentions
- Source comparison between financial and general news outlets
- Interactive visualizations of trends and patterns
- Co-occurrence analysis of economic terms

## Getting Started

### Prerequisites

- Python 3.9+
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd uncertainty_prevalence
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

1. Copy `.env.example` to `.env` and update the values as needed.
2. Review `src/config.py` for additional configuration options.

## Usage

```bash
# Run the FastAPI development server
uvicorn src.api.main:app --reload
```

## Project Structure

```
uncertainty_prevalence/
├── data/                   # Data storage
│   ├── raw/                # Raw data from GDELT
│   └── processed/          # Processed data
├── docs/                   # Documentation
├── src/                    # Source code
│   ├── api/                # FastAPI application
│   ├── core/               # Core functionality
│   ├── models/             # Data models
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   ├── config.py           # Configuration
│   └── __init__.py         # Package initialization
└── tests/                  # Test suite
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
