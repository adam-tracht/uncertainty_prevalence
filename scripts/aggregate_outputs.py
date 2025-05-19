#!/usr/bin/env python
"""
Script to aggregate raw uncertainty analysis outputs into combined files for visualization.

This script finds all raw output files in the raw directory and combines them into
the main files used by the frontend visualizations.
"""

import os
import json
import glob
import logging
import pandas as pd
from pathlib import Path
from collections import Counter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Default paths
DEFAULT_RAW_DIR = "frontend/public/data/output/raw"
DEFAULT_OUTPUT_DIR = "frontend/public/data/output"


def aggregate_mentions(raw_dir, output_file):
    """Aggregate all uncertainty mentions CSV files by appending rows.
    
    Args:
        raw_dir: Directory containing raw output files
        output_file: Path to the output file
    
    Returns:
        DataFrame of aggregated mentions
    """
    # Find all uncertainty mentions CSV files
    mentions_files = glob.glob(os.path.join(raw_dir, "uncertainty_mentions_*.csv"))
    
    if not mentions_files:
        logger.warning(f"No uncertainty mentions files found in {raw_dir}")
        return pd.DataFrame()
    
    logger.info(f"Found {len(mentions_files)} uncertainty mentions files")
    
    # Read and combine all files
    dfs = []
    for file in mentions_files:
        try:
            df = pd.read_csv(file)
            dfs.append(df)
            logger.info(f"Read {len(df)} rows from {os.path.basename(file)}")
        except Exception as e:
            logger.error(f"Error reading {file}: {e}")
    
    if not dfs:
        logger.warning("No valid uncertainty mentions files found")
        return pd.DataFrame()
    
    # Combine all DataFrames
    combined_df = pd.concat(dfs, ignore_index=True)
    
    # Remove duplicates based on date, url, and context
    combined_df = combined_df.drop_duplicates(subset=['date', 'url', 'context'])
    
    # Sort by date
    combined_df['datetime'] = pd.to_datetime(combined_df['date'])
    combined_df = combined_df.sort_values('datetime')
    combined_df = combined_df.drop('datetime', axis=1)
    
    # Save to output file
    combined_df.to_csv(output_file, index=False)
    logger.info(f"Saved {len(combined_df)} aggregated mentions to {output_file}")
    
    return combined_df


def aggregate_cooccurrences(raw_dir, output_file):
    """Aggregate all co-occurrence CSV files by summing frequencies for matching words.
    
    Args:
        raw_dir: Directory containing raw output files
        output_file: Path to the output file
    
    Returns:
        DataFrame of aggregated co-occurrences
    """
    # Find all co-occurrence CSV files
    cooc_files = glob.glob(os.path.join(raw_dir, "uncertainty_cooccurrences_*.csv"))
    
    if not cooc_files:
        logger.warning(f"No co-occurrence files found in {raw_dir}")
        return pd.DataFrame()
    
    logger.info(f"Found {len(cooc_files)} co-occurrence files")
    
    # Initialize a counter for word frequencies
    word_counts = Counter()
    
    # Read and combine all files
    for file in cooc_files:
        try:
            df = pd.read_csv(file)
            # Add to counter
            file_counts = dict(zip(df['word'], df['co_occurrences_with_uncertainty']))
            word_counts.update(file_counts)
            logger.info(f"Read {len(df)} words from {os.path.basename(file)}")
        except Exception as e:
            logger.error(f"Error reading {file}: {e}")
    
    if not word_counts:
        logger.warning("No valid co-occurrence files found")
        return pd.DataFrame()
    
    # Convert counter to DataFrame
    combined_df = pd.DataFrame({
        'word': list(word_counts.keys()),
        'co_occurrences_with_uncertainty': list(word_counts.values())
    })
    
    # Sort by frequency
    combined_df = combined_df.sort_values('co_occurrences_with_uncertainty', ascending=False)
    
    # Save to output file
    combined_df.to_csv(output_file, index=False)
    logger.info(f"Saved {len(combined_df)} aggregated co-occurrences to {output_file}")
    
    return combined_df


def aggregate_wordcloud(raw_dir, output_file):
    """Aggregate all word cloud JSON files by summing values for matching words.
    
    Args:
        raw_dir: Directory containing raw output files
        output_file: Path to the output file
    
    Returns:
        List of aggregated word cloud data
    """
    # Find all word cloud JSON files
    wordcloud_files = glob.glob(os.path.join(raw_dir, "word_cloud_data_*.json"))
    
    if not wordcloud_files:
        logger.warning(f"No word cloud files found in {raw_dir}")
        return []
    
    logger.info(f"Found {len(wordcloud_files)} word cloud files")
    
    # Initialize a counter for word frequencies
    word_counts = Counter()
    
    # Read and combine all files
    for file in wordcloud_files:
        try:
            with open(file, 'r') as f:
                data = json.load(f)
            
            # Add to counter
            file_counts = {item['text']: item['value'] for item in data}
            word_counts.update(file_counts)
            logger.info(f"Read {len(data)} words from {os.path.basename(file)}")
        except Exception as e:
            logger.error(f"Error reading {file}: {e}")
    
    if not word_counts:
        logger.warning("No valid word cloud files found")
        return []
    
    # Convert counter to list of dictionaries
    combined_data = [{'text': word, 'value': count} for word, count in word_counts.items()]
    
    # Sort by value
    combined_data.sort(key=lambda x: x['value'], reverse=True)
    
    # Save to output file
    with open(output_file, 'w') as f:
        json.dump(combined_data, f, indent=2)
    logger.info(f"Saved {len(combined_data)} aggregated word cloud items to {output_file}")
    
    return combined_data


def update_analysis_script(raw_dir):
    """Update the analyze_uncertainty.py script to save outputs to the raw directory.
    
    Args:
        raw_dir: Path to the raw directory
    """
    script_path = "scripts/analyze_uncertainty.py"
    
    try:
        with open(script_path, 'r') as f:
            script_content = f.read()
        
        # Check if the script already saves to the raw directory
        if f"os.path.join(args.output, 'raw'" in script_content:
            logger.info("Analysis script already saves to raw directory")
            return
        
        # Update the script to save to the raw directory
        updated_content = script_content.replace(
            "mentions_file = os.path.join(args.output, f\"uncertainty_mentions_{date_range_str}_{timestamp}.csv\")",
            "mentions_file = os.path.join(args.output, 'raw', f\"uncertainty_mentions_{date_range_str}_{timestamp}.csv\")"
        )
        
        updated_content = updated_content.replace(
            "cooc_file = f'uncertainty_cooccurrences_{date_range_str}_{timestamp}.csv'",
            "cooc_file = f'uncertainty_cooccurrences_{date_range_str}_{timestamp}.csv'"
        )
        
        updated_content = updated_content.replace(
            "cooc_df.to_csv(os.path.join(output_dir, cooc_file), index=False)",
            "cooc_df.to_csv(os.path.join(output_dir, 'raw', cooc_file), index=False)"
        )
        
        updated_content = updated_content.replace(
            "word_cloud_file = f'word_cloud_data_{date_range_str}_{timestamp}.json'",
            "word_cloud_file = f'word_cloud_data_{date_range_str}_{timestamp}.json'"
        )
        
        updated_content = updated_content.replace(
            "with open(os.path.join(output_dir, word_cloud_file), 'w') as f:",
            "with open(os.path.join(output_dir, 'raw', word_cloud_file), 'w') as f:"
        )
        
        # Write the updated script
        with open(script_path, 'w') as f:
            f.write(updated_content)
        
        logger.info(f"Updated {script_path} to save outputs to {raw_dir}")
    except Exception as e:
        logger.error(f"Error updating analysis script: {e}")


def main():
    """Run the aggregation process."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Aggregate raw uncertainty analysis outputs")
    parser.add_argument(
        "--raw-dir", type=str, default=DEFAULT_RAW_DIR,
        help=f"Directory containing raw output files (default: {DEFAULT_RAW_DIR})"
    )
    parser.add_argument(
        "--output-dir", type=str, default=DEFAULT_OUTPUT_DIR,
        help=f"Directory to save aggregated outputs (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "--update-script", action="store_true",
        help="Update the analyze_uncertainty.py script to save outputs to the raw directory"
    )
    args = parser.parse_args()
    
    # Create directories if they don't exist
    Path(args.raw_dir).mkdir(parents=True, exist_ok=True)
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)
    
    # Update the analysis script if requested
    if args.update_script:
        update_analysis_script(args.raw_dir)
    
    # Aggregate mentions
    mentions_file = os.path.join(args.output_dir, "uncertainty_mentions.csv")
    aggregate_mentions(args.raw_dir, mentions_file)
    
    # Aggregate co-occurrences
    cooc_file = os.path.join(args.output_dir, "uncertainty_cooccurrences.csv")
    aggregate_cooccurrences(args.raw_dir, cooc_file)
    
    # Aggregate word cloud
    wordcloud_file = os.path.join(args.output_dir, "word_cloud_data.json")
    aggregate_wordcloud(args.raw_dir, wordcloud_file)
    
    logger.info("Aggregation complete")


if __name__ == "__main__":
    main()
