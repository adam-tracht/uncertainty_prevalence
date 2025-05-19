# Economic Uncertainty Analysis Dashboard

## Overview

This is the frontend dashboard for the Economic Uncertainty Analysis project. It provides interactive visualizations and analysis tools for exploring uncertainty mentions in economic news media using data from GDELT Web NGrams 3.0.

## Features

- **Interactive Dashboard**: Overview of key metrics and visualizations
- **Time Series Analysis**: Track uncertainty mentions over time with customizable filters
- **Word Analysis**: Explore terms co-occurring with "uncertainty" through word clouds and tables
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Supports system preferences and manual toggle

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS for utility-first styling
- **State Management**: React Context API
- **Routing**: React Router
- **Data Fetching**: Axios
- **Visualization**: Chart.js/React-Chartjs-2 and D3.js

## Project Structure

```
frontend/
├── public/               # Static files
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Generic UI components
│   │   ├── charts/       # Visualization components
│   │   └── layout/       # Layout components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── context/          # React context providers
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main App component
│   └── index.tsx         # Entry point
├── package.json          # Dependencies
└── tailwind.config.js    # TailwindCSS configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Integration with Backend

This frontend communicates with the FastAPI backend located in `/src/api/`. The backend provides the following endpoints:

- `/api/uncertainty/mentions` - Get uncertainty mentions with filtering options
- `/api/uncertainty/cooccurrences` - Get co-occurring terms data
- `/api/uncertainty/timeseries` - Get time series data for uncertainty mentions
- `/api/uncertainty/domains` - Get domain distribution data

## Development Guidelines

1. Follow the modular component structure
2. Use TypeScript types for all props and state
3. Implement responsive design using Tailwind's utility classes
4. Write unit tests for all components
5. Document complex logic with inline comments
