Economic Uncertainty Analysis Project: Planning Document
Project Overview
This project aims to analyze the prevalence and context of the term "uncertainty" in relation to President Trump's recent tariffs and trade policies using the GDELT Web NGrams 3.0 dataset. By tracking term frequency over time, we'll identify patterns, correlations, and potential economic sentiment indicators in media coverage.
Project Goals

Track frequency of "uncertainty" mentions in economic contexts over time
Identify correlation between uncertainty mentions and tariff announcements
Analyze trends across multiple reputable news sources
Develop web-based visualizations showing temporal patterns
Run a comprehensive one-time analysis covering May 2024 - May 2025

Data Source
GDELT Web NGrams 3.0

Description: Pre-computed dataset tracking term usage frequency across news media
Coverage: Historical data spanning multiple years (sufficient for our 12-month analysis)
Access Method: Direct API calls to GDELT NGrams endpoints
Advantages:

Free to access without query processing costs
Pre-computed word frequencies eliminates need for full-text processing
Time series data directly tracks changes in term usage over time
Supports multi-word phrases and co-occurrence analysis


Key Features: Supports filtering by news domains, time periods, and languages

Source Filtering
We will focus on reputable US news sources, including:
Major National Sources:

nytimes.com
washingtonpost.com
wsj.com
reuters.com
apnews.com

Financial/Business Publications:

bloomberg.com
cnbc.com
ft.com
forbes.com
marketwatch.com

Technical Architecture
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  GDELT NGrams   │    │  Data Processing │    │  Analysis &        │
│  API            │────▶  & Aggregation   │────▶  Visualization     │
└─────────────────┘    └──────────────────┘    └────────────────────┘
                                │                        │
                                ▼                        ▼
                        ┌──────────────────┐    ┌────────────────────┐
                        │  CSV/JSON        │    │  Web Application   │
                        │  Storage         │    │  Dashboard         │
                        └──────────────────┘    └────────────────────┘
Technology Stack

Programming Language: Python 3.9+
Data Collection: Custom wrappers for GDELT NGrams API
Data Storage:

Lightweight CSV/JSON files for processed data
No database required for this simplified approach


Analysis Tools:

Pandas for time series manipulation
NumPy for numerical analysis
SciPy for statistical correlations


Web Application:

FastAPI for backend API
React 18 with TypeScript for frontend
TailwindCSS for styling
React Router for navigation
Chart.js and D3.js for interactive visualizations (planned)
Context API for state management (planned)


Deployment: Static site for simplified hosting

Methodology

Data Collection Phase:

Define the primary term for tracking ("uncertainty")
Set up API queries for selected news domains
Implement consistent time interval sampling (daily/weekly aggregation)
Collect term co-occurrence data for visualization
Gather data for co-occurrence matrix analysis


Processing Phase:

Normalize frequency data across sources
Apply moving averages to smooth noisy data for time series
Identify significant peaks and valleys in uncertainty mentions
Process co-occurrence terms for contextual analysis
Build co-occurrence matrices showing term relationships


Analysis Phase:

Calculate statistical correlations between terms
Perform time-lagged analysis around tariff announcement dates
Compare term usage patterns across different news sources
Analyze semantic context through co-occurrence patterns
Identify clusters of related terms in the co-occurrence data


Visualization and Web App Phase:

Develop interactive time series charts for term frequency
Create dynamic word cloud visualization of terms co-occurring with "uncertainty"
Build interactive co-occurrence matrix visualization
Implement temporal filtering to show context evolution over time
Design source comparison functionality for visualizations
Create responsive dashboard layout with filtering options



Key Queries to Implement

Base Uncertainty Tracking:

Term frequency of "uncertainty" over time across all sources
Filtered for economic/business domains only


Co-occurrence Analysis:

Frequency of terms appearing near "uncertainty" without predefined lists
Collection of contextual terms across different time periods
Source-specific co-occurrence patterns
Term-to-term relationship strength for co-occurrence matrix


Source Comparison:

Differential analysis between financial press vs. general news
Publication bias assessment
Variation in contextual framing across sources


Temporal Context Analysis:

Examining how co-occurring terms shift before/after tariff announcements
Tracking evolution of semantic context around uncertainty
Identifying emerging themes in uncertainty discussions



Deliverables

Time series dataset of uncertainty mentions
Interactive web application featuring:

Dynamic word cloud visualization of terms co-occurring with "uncertainty"
Interactive co-occurrence matrix showing term relationships
Time series charts of uncertainty mention frequency
Source comparison tools


Analysis report documenting findings and patterns
GitHub repository with code and documentation
Presentation-ready visualizations for stakeholders

Potential Challenges and Mitigation Strategies

API Rate Limiting:

Implement proper throttling and backoff
Cache results to minimize redundant queries


Term Ambiguity:

Develop context filtering to focus on economic uncertainty
Use co-occurrence with economic terms to eliminate noise


Data Granularity:

Balance between daily vs. weekly aggregation
Implement smoothing techniques for clearer trend visualization


Causation vs. Correlation:

Clear documentation of limitations
Use statistical techniques to strengthen correlation arguments