# Economic Uncertainty Prevalence

Analyzing the prevalence of economic uncertainty in news media using GDELT data.

## Overview

This project analyzes the prevalence of economic uncertainty mentions in news articles using GDELT Web NGrams 3.0 data. It provides tools to stream, process, and analyze NGrams data without requiring local storage of large files.

## Features

- **Data Collection**
  - Direct streaming of GDELT Web NGrams 3.0 data without local storage
  - Efficient processing of uncertainty mentions in real-time
  - Filtering for economic uncertainty terms
  - Source tracking for major news outlets

- **Analysis**
  - Time series analysis of uncertainty mentions
  - Advanced word normalization and cleaning
  - Intelligent grouping of similar word variations
  - Co-occurrence analysis of terms appearing with "uncertainty"
  - Stopwords filtering to focus on meaningful economic terms

- **Visualization**
  - Time series charts showing uncertainty mentions over time
  - Domain distribution visualizations
  - Word cloud visualization of terms co-occurring with "uncertainty"
  - Co-occurrence analysis charts highlighting economic relationships

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
   pip install -r requirements-data.txt  # For data collection
   ```

## Configuration

1. Copy `.env.example` to `.env` and update the values as needed.
2. Review `src/data_collection/config.py` for data collection settings.

## Data Collection and Analysis

### Streaming Approach (Recommended)

The project supports direct streaming of GDELT NGrams data without requiring local storage of large files. Data is collected and analyzed in a single workflow:

#### 1. Analyze Data for Specific Time Periods

```bash
# Analyze a specific date range with visualization
python scripts/analyze_uncertainty.py --start-date 2025-01-01 --end-date 2025-01-31 --visualize

# Analyze past N days (e.g., 90 days)
python scripts/analyze_uncertainty.py --days 90 --visualize

# Customize keywords to search for
python scripts/analyze_uncertainty.py --keywords "uncertainty,volatility,risk" --visualize
```

This saves raw outputs to `frontend/public/data/output/raw/` with timestamped filenames, preserving each analysis run.

#### 2. Aggregate Results from Multiple Analysis Runs

After running multiple analyses for different time periods, aggregate all results into the main files used by the frontend:

```bash
python scripts/aggregate_outputs.py
```

This combines all raw outputs in the `raw` directory into standard files:
- `uncertainty_mentions.csv`: All uncertainty mentions across all time periods
- `uncertainty_cooccurrences.csv`: Combined co-occurrence data with frequencies summed
- `word_cloud_data.json`: Combined word cloud data with frequencies summed

This approach is efficient because it:
- Streams data directly from GDELT without storing raw files locally
- Processes data on-the-fly, reducing storage requirements
- Allows for analyzing data in manageable chunks (avoiding memory issues)
- Preserves raw data while providing aggregated views

### Legacy Approach

For backward compatibility, the original file-based collection is still available:

```bash
# Run the legacy data collection script
python -m src.data_collection.gdelt_ngrams
```

The collected data will be saved in the `frontend/public/data/raw/gdelt_ngrams` directory.

## Usage

### Backend API

```bash
# Run the FastAPI development server
uvicorn src.api.main:app --reload
```

Then open your browser to http://127.0.0.1:8000 to view the API documentation.

### Frontend Dashboard

#### Development Mode

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open your browser to the displayed URL (typically http://localhost:5173) to view the dashboard.

#### Building and Deploying the Frontend

1. **Build the Frontend Application**:

   ```bash
   # Navigate to the frontend directory
   cd frontend
   
   # Build the application for production
   npm run build
   ```

   This creates optimized production files in the `frontend/dist` directory.

2. **Preview the Built Application**:

   ```bash
   # Start a local preview server
   npm run preview
   ```

   This serves the built application, typically at http://localhost:4173.

3. **Deployment Options**:

   - **Static Hosting**: Deploy the contents of the `frontend/dist` directory to any static hosting service:
     - GitHub Pages
     - Netlify
     - Vercel
     - AWS S3 + CloudFront

   - **Self-Hosting**: Serve the files from your own server using a web server like Nginx or Apache.

### Complete Workflow

1. **Collect and Analyze Data**:
   ```bash
   # Analyze data for specific time periods
   python scripts/analyze_uncertainty.py --start-date 2025-01-01 --end-date 2025-01-31 --visualize
   python scripts/analyze_uncertainty.py --start-date 2025-02-01 --end-date 2025-02-28 --visualize
   ```

2. **Aggregate Results**:
   ```bash
   python scripts/aggregate_outputs.py
   ```

3. **Build and Deploy Frontend**:
   ```bash
   cd frontend && npm run build
   cd frontend && npm run preview  # For local preview
   ```

The frontend will automatically display the aggregated data from all analysis runs.

## Project Structure

```
uncertainty_prevalence/
├── data/                    # Data storage
│   ├── raw/                 # Raw data from GDELT
│   └── processed/           # Processed data for analysis
├── docs/                    # Documentation
├── frontend/                # React frontend application
│   ├── public/              # Static files
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # Generic UI components
│   │   │   ├── charts/      # Visualization components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── context/         # React context providers
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Main App component
│   │   └── main.tsx         # Entry point
│   ├── package.json         # Frontend dependencies
│   └── tailwind.config.js   # TailwindCSS configuration
├── scripts/                 # Utility scripts
│   └── analyze_uncertainty.py  # Script to analyze uncertainty mentions
├── src/                     # Backend source code
│   ├── api/                 # FastAPI application
│   ├── data_collection/     # GDELT data collection scripts
│   │   ├── __init__.py
│   │   ├── gdelt_ngrams.py  # File-based data collection script
│   │   ├── gdelt_ngrams_streaming.py  # Streaming implementation
│   │   └── config.py        # Configuration settings
│   ├── analysis/            # Data analysis modules
│   ├── core/                # Core functionality
│   ├── models/              # Data models
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── tests/                   # Test suite
├── .gitignore
├── README.md
├── planning.md              # Project planning document
├── tasks.md                 # Project tasks and progress
├── requirements.txt         # Main dependencies
└── requirements-data.txt    # Data collection dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
