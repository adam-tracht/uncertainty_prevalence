#!/usr/bin/env python
"""
Script to analyze economic uncertainty mentions in GDELT NGrams data.

This script demonstrates how to use the GDELTNGramsStreamer to collect and analyze
uncertainty mentions in economic news articles.
"""

import argparse
import logging
import os
import json
import sys
import numpy as np
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Now import the rest of the modules
try:
    import matplotlib.pyplot as plt
    import pandas as pd
    import seaborn as sns
    from src.data_collection.gdelt_ngrams_streaming import GDELTNGramsStreamer
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Please install the required dependencies using:")
    print("pip install -r requirements.txt")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Analyze economic uncertainty in news articles")
    date_group = parser.add_mutually_exclusive_group()
    date_group.add_argument(
        "--days", type=int, default=None, 
        help="Number of days to analyze (default: 30 if no other date options provided)"
    )
    date_group.add_argument(
        "--start-date", type=str, default=None,
        help="Start date in YYYY-MM-DD format"
    )
    parser.add_argument(
        "--end-date", type=str, default=None,
        help="End date in YYYY-MM-DD format (defaults to yesterday if only start-date is provided)"
    )
    parser.add_argument(
        "--output", type=str, default="frontend/public/data/output", 
        help="Output directory (default: frontend/public/data/output)"
    )
    parser.add_argument(
        "--keywords", type=str, 
        default="uncertainty",
        help="Comma-separated list of keywords to search for"
    )
    parser.add_argument(
        "--visualize", action="store_true",
        help="Generate visualizations of the results"
    )
    return parser.parse_args()


def clean_and_normalize_word(word: str) -> str:
    """Clean and normalize a word by removing special characters and converting to lowercase.
    
    Args:
        word: The word to clean and normalize
        
    Returns:
        The cleaned and normalized word
    """
    # Convert to lowercase and strip whitespace
    word = word.lower().strip()
    
    # Handle special cases with punctuation inside words
    if '.' in word:
        # Split by period and take the first part (e.g., "report.that" -> "report")
        parts = word.split('.')
        if len(parts[0]) > 2:  # Only use first part if it's a substantial word
            word = parts[0]
    
    # Handle quoted text
    if word.startswith('"') and word.endswith('"'):
        word = word[1:-1]
    elif word.startswith("'") and word.endswith("'"):
        word = word[1:-1]
    
    # Remove special characters from beginning and end of the word
    word = word.strip('.,;:"!?()[]{}""''…-–—')
    
    # Remove possessive 's
    if word.endswith("'s"):
        word = word[:-2]
    
    return word


def get_stopwords() -> list:
    """Get a list of stopwords to filter out from analysis.
    
    Returns:
        List of stopwords
    """
    return [
        # Common English stopwords
        'this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should',
        'their', 'about', 'there', 'these', 'those', 'they', 'what', 'when', 'where', 'which',
        'while', 'your', 'said', 'says', 'also', 'more', 'some', 'such', 'than', 'then', 'them',
        'were', 'into', 'over', 'under', 'again', 'further', 'here', 'once', 'only', 'very',
        'other', 'same', 'just', 'most', 'both', 'much', 'each', 'before', 'after', 'above',
        'below', 'during', 'through', 'between', 'since', 'until', 'like', 'does', 'doing',
        'done', 'many', 'still', 'even', 'make', 'made', 'making', 'take', 'taking', 'took',
        'taken', 'come', 'comes', 'coming', 'came', 'going', 'goes', 'went', 'gone', 'being',
        'show', 'shows', 'showed', 'shown', 'showing', 'give', 'gives', 'giving', 'gave', 'given',
        'find', 'finds', 'finding', 'found', 'want', 'wants', 'wanting', 'wanted',
        
        # Articles and prepositions
        'the', 'and', 'but', 'for', 'nor', 'yet', 'so', 'either', 'neither', 'both',
        'not', 'all', 'any', 'few', 'many', 'several', 'one', 'two', 'three', 'four',
        'five', 'six', 'seven', 'eight', 'nine', 'ten', 'first', 'second', 'third',
        'last', 'next', 'previous', 'now', 'today', 'tomorrow', 'yesterday',
        
        # Common reporting verbs
        'said', 'says', 'say', 'saying', 'told', 'tells', 'tell', 'telling', 'reported',
        'reports', 'report', 'reporting', 'stated', 'states', 'state', 'stating',
        'announced', 'announces', 'announce', 'announcing', 'noted', 'notes', 'note', 'noting',
        
        # Words that appear in news articles but don't add meaning to our analysis
        'image', 'photo', 'video', 'getty', 'reuters', 'afp', 'associated', 'press',
        'copyright', 'rights', 'reserved', 'caption', 'source', 'credit', 'file',
        'picture', 'pictures', 'images', 'photos', 'videos', 'article', 'story',
        'news', 'read', 'click', 'link', 'visit', 'website', 'online', 'follow',
        'twitter', 'facebook', 'instagram', 'social', 'media',
        
        # Additional common words that don't add economic meaning
        'already', 'because', 'too', 'nevertheless', 'continued', 'despite', 'around',
        'facing', 'caused', 'back', 'surrounding', 'added', 'year', 'time', 'happen',
        'affected', 'regarding', 'huge', 'prison', 'raising', 'big-picture', 'mood',
        'danger', 'president', 'hitting', 'issues'
    ]


def normalize_words(word_counts: Counter) -> Counter:
    """Normalize words by grouping similar variations and cleaning special characters.
    
    Args:
        word_counts: Counter of word frequencies
        
    Returns:
        Normalized counter with grouped word variations
    """
    # Define word variations to group together
    word_groups = {
        'economic': ['economy', 'economic', 'economics', 'economical', 'economies'],
        'tariffs': ['tariff', 'tariffs', 'tariffing'],
        'trump': ['trump', 'trumps', 'donald', 'donald trump'],
        'market': ['market', 'markets', 'marketing', 'marketplace'],
        'business': ['business', 'businesses', 'businessmen', 'businesspeople'],
        'global': ['global', 'globally', 'globalization', 'globalizing', 'globe'],
        'policy': ['policy', 'policies', 'policymakers', 'policymaking'],
        'financial': ['financial', 'finance', 'financially', 'finances', 'financing'],
        'trade': ['trade', 'trades', 'trading', 'trader', 'traders'],
        'inflation': ['inflation', 'inflationary', 'inflating'],
        'federal': ['federal', 'fed', 'federally', 'federation'],
        'government': ['government', 'governments', 'governmental', 'governance', 'governing'],
        'political': ['political', 'politically', 'politics', 'politician', 'politicians'],
        'investment': ['investment', 'investments', 'investing', 'investor', 'investors'],
        'forecast': ['forecast', 'forecasts', 'forecasting', 'forecaster', 'forecasters'],
        'impact': ['impact', 'impacts', 'impacting', 'impacted'],
        'report': ['report', 'reports', 'reporting', 'reported'],
        'research': ['research', 'researching', 'researched', 'researcher', 'researchers'],
        'change': ['change', 'changes', 'changing', 'changed'],
        'consumer': ['consumer', 'consumers', 'consumption', 'consuming'],
        'price': ['price', 'prices', 'pricing', 'priced'],
        'growth': ['growth', 'growing', 'grow', 'grows'],
        'risk': ['risk', 'risks', 'risky', 'risking'],
        'bank': ['bank', 'banks', 'banking', 'banker', 'bankers'],
        'industry': ['industry', 'industries', 'industrial'],
        'stock': ['stock', 'stocks', 'stockmarket'],
        'interest': ['interest', 'interests', 'interesting'],
        'rate': ['rate', 'rates', 'rating'],
        'debt': ['debt', 'debts', 'debtor', 'debtors'],
        'company': ['company', 'companies', 'corporation', 'corporations'],
    }
    
    # Create reverse mapping for quick lookup
    word_mapping = {}
    for group_name, variations in word_groups.items():
        for variation in variations:
            word_mapping[variation] = group_name
    
    # Create a new counter for normalized words
    normalized_counts = Counter()
    
    # Process each word in the original counter
    for word, count in word_counts.items():
        # Clean the word
        cleaned_word = clean_and_normalize_word(word)
        
        # Skip empty words or very short words
        if len(cleaned_word) <= 2:
            continue
        
        # Map to group if it exists, otherwise use the cleaned word
        normalized_word = word_mapping.get(cleaned_word, cleaned_word)
        normalized_counts[normalized_word] += count
    
    return normalized_counts


def visualize_results(mentions_df: pd.DataFrame, word_counts: Counter, output_dir: str, timestamp: str, date_range_str: str):
    """
    Generate data files for analysis results.
    
    Args:
        mentions_df: DataFrame of uncertainty mentions
        word_counts: Counter of co-occurring terms
        output_dir: Directory to save data files
        timestamp: Timestamp string for unique filenames
        date_range_str: String representation of date range for filenames
    """
    # Extract date range from the mentions_df for data files
    if not mentions_df.empty and 'datetime' not in mentions_df.columns:
        mentions_df['datetime'] = pd.to_datetime(mentions_df['date'])
    
    if not mentions_df.empty:
        start_date = mentions_df['datetime'].min().date()
        end_date = mentions_df['datetime'].max().date()
    else:
        # Default values if no data
        start_date = "Unknown"
        end_date = "Unknown"
    if mentions_df.empty:
        logger.warning("No data to process")
        return
    
    # Convert date to datetime and group by date
    mentions_df['datetime'] = pd.to_datetime(mentions_df['date'])
    daily_counts = mentions_df.groupby(mentions_df['datetime'].dt.date).size()
    
    # 1. Process word cloud data
    try:
        # Normalize word counts for the word cloud
        normalized_word_counts = normalize_words(word_counts)
        
        # Remove stopwords and common words that don't add meaning
        stopwords = [
            # Common English stopwords
            'this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should',
            'their', 'about', 'there', 'these', 'those', 'they', 'what', 'when', 'where', 'which',
            'while', 'your', 'said', 'says', 'also', 'more', 'some', 'such', 'than', 'then', 'them',
            'were', 'into', 'over', 'under', 'again', 'further', 'here', 'once', 'only', 'very',
            'other', 'same', 'just', 'most', 'both', 'much', 'each', 'before', 'after', 'above',
            'below', 'during', 'through', 'between', 'since', 'until', 'like', 'does', 'doing',
            'done', 'many', 'still', 'even', 'make', 'made', 'making', 'take', 'taking', 'took',
            'taken', 'come', 'comes', 'coming', 'came', 'going', 'goes', 'went', 'gone', 'being',
            'show', 'shows', 'showed', 'shown', 'showing', 'give', 'gives', 'giving', 'gave', 'given',
            'find', 'finds', 'finding', 'found', 'want', 'wants', 'wanting', 'wanted',
            
            # Articles and prepositions
            'the', 'and', 'but', 'for', 'nor', 'yet', 'so', 'either', 'neither', 'both',
            'not', 'all', 'any', 'few', 'many', 'several', 'one', 'two', 'three', 'four',
            'five', 'six', 'seven', 'eight', 'nine', 'ten', 'first', 'second', 'third',
            'last', 'next', 'previous', 'now', 'today', 'tomorrow', 'yesterday',
            
            # Common reporting verbs
            'said', 'says', 'say', 'saying', 'told', 'tells', 'tell', 'telling', 'reported',
            'reports', 'report', 'reporting', 'stated', 'states', 'state', 'stating',
            'announced', 'announces', 'announce', 'announcing', 'noted', 'notes', 'note', 'noting',
            
            # Words that appear in news articles but don't add meaning to our analysis
            'image', 'photo', 'video', 'getty', 'reuters', 'afp', 'associated', 'press',
            'copyright', 'rights', 'reserved', 'caption', 'source', 'credit', 'file',
            'picture', 'pictures', 'images', 'photos', 'videos', 'article', 'story',
            'news', 'read', 'click', 'link', 'visit', 'website', 'online', 'follow',
            'twitter', 'facebook', 'instagram', 'social', 'media'
        ]
        
        for word in stopwords:
            if word in normalized_word_counts:
                del normalized_word_counts[word]
        
        # Save word cloud data
        word_cloud_data = {word: count for word, count in normalized_word_counts.most_common(100)}
        with open(os.path.join(output_dir, 'word_cloud_data.json'), 'w') as f:
            json.dump(word_cloud_data, f, indent=4)
        
        logger.info("Word cloud data saved")
    except Exception as e:
        logger.error(f"Error generating word cloud data: {e}")
    
    # 2. Co-occurrence with 'uncertainty' (top 50 words)
    try:
        # Count co-occurrences with 'uncertainty'
        uncertainty_cooccurrences = Counter()
        
        # Process each context containing 'uncertainty'
        for context in mentions_df['context'].tolist():
            # Check if the context contains 'uncertainty'
            if 'uncertainty' in context.lower():
                # Get all words in the context
                words = [w.lower() for w in context.split() 
                          if len(w) > 3 and w.lower() != 'uncertainty']
                
                # Clean and normalize each word
                cleaned_words = [clean_and_normalize_word(w) for w in words]
                cleaned_words = [w for w in cleaned_words if len(w) > 2]  # Filter out very short words
                
                # Get stopwords
                stopwords = get_stopwords()
                
                # Filter out stopwords
                cleaned_words = [w for w in cleaned_words if w not in stopwords]
                
                # Count each unique word once per context
                for word in set(cleaned_words):
                    uncertainty_cooccurrences[word] += 1
        
        # Normalize the words (group similar variations)
        normalized_cooccurrences = normalize_words(uncertainty_cooccurrences)
        
        # Remove stopwords and common words that don't add meaning
        stopwords = [
            # Common English stopwords
            'this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should',
            'their', 'about', 'there', 'these', 'those', 'they', 'what', 'when', 'where', 'which',
            'while', 'your', 'said', 'says', 'also', 'more', 'some', 'such', 'than', 'then', 'them',
            'were', 'into', 'over', 'under', 'again', 'further', 'here', 'once', 'only', 'very',
            'other', 'same', 'just', 'most', 'both', 'much', 'each', 'before', 'after', 'above',
            'below', 'during', 'through', 'between', 'since', 'until', 'like', 'does', 'doing',
            'done', 'many', 'still', 'even', 'make', 'made', 'making', 'take', 'taking', 'took',
            'taken', 'come', 'comes', 'coming', 'came', 'going', 'goes', 'went', 'gone', 'being',
            'show', 'shows', 'showed', 'shown', 'showing', 'give', 'gives', 'giving', 'gave', 'given',
            'find', 'finds', 'finding', 'found', 'want', 'wants', 'wanting', 'wanted',
            
            # Articles and prepositions
            'the', 'and', 'but', 'for', 'nor', 'yet', 'so', 'either', 'neither', 'both',
            'not', 'all', 'any', 'few', 'many', 'several', 'one', 'two', 'three', 'four',
            'five', 'six', 'seven', 'eight', 'nine', 'ten', 'first', 'second', 'third',
            'last', 'next', 'previous', 'now', 'today', 'tomorrow', 'yesterday',
            
            # Common reporting verbs
            'said', 'says', 'say', 'saying', 'told', 'tells', 'tell', 'telling', 'reported',
            'reports', 'report', 'reporting', 'stated', 'states', 'state', 'stating',
            'announced', 'announces', 'announce', 'announcing', 'noted', 'notes', 'note', 'noting',
            
            # Words that appear in news articles but don't add meaning to our analysis
            'image', 'photo', 'video', 'getty', 'reuters', 'afp', 'associated', 'press',
            'copyright', 'rights', 'reserved', 'caption', 'source', 'credit', 'file',
            'picture', 'pictures', 'images', 'photos', 'videos', 'article', 'story',
            'news', 'read', 'click', 'link', 'visit', 'website', 'online', 'follow',
            'twitter', 'facebook', 'instagram', 'social', 'media'
        ]
        
        for word in stopwords:
            if word in normalized_cooccurrences:
                del normalized_cooccurrences[word]
        
        # Create a DataFrame for the co-occurrences
        cooc_df = pd.DataFrame({
            'word': list(normalized_cooccurrences.keys()),
            'co_occurrences_with_uncertainty': list(normalized_cooccurrences.values())
        })
        
        # Sort by frequency
        cooc_df = cooc_df.sort_values('co_occurrences_with_uncertainty', ascending=False).head(50)
        
        # Save to CSV with timestamp and date range in raw directory
        raw_dir = os.path.join(output_dir, "raw")
        Path(raw_dir).mkdir(parents=True, exist_ok=True)
        
        cooc_file = f'uncertainty_cooccurrences_{date_range_str}_{timestamp}.csv'
        cooc_df.to_csv(os.path.join(raw_dir, cooc_file), index=False)
        
        # Also save to a standard filename for the frontend to reference
        cooc_df.to_csv(os.path.join(output_dir, 'uncertainty_cooccurrences.csv'), index=False)
        
        # Save word cloud data with timestamp and date range in raw directory
        raw_dir = os.path.join(output_dir, "raw")
        Path(raw_dir).mkdir(parents=True, exist_ok=True)
        
        word_cloud_data = [{'text': word, 'value': count} for word, count in normalized_cooccurrences.items()]
        word_cloud_file = f'word_cloud_data_{date_range_str}_{timestamp}.json'
        with open(os.path.join(raw_dir, word_cloud_file), 'w') as f:
            json.dump(word_cloud_data, f)
            
        # Also save to a standard filename for the frontend to reference
        with open(os.path.join(output_dir, 'word_cloud_data.json'), 'w') as f:
            json.dump(word_cloud_data, f)
        
        logger.info("Uncertainty co-occurrences analysis saved")
    except Exception as e:
        logger.warning(f"Error generating co-occurrence data: {e}")
    
    logger.info(f"Data files saved to {output_dir}")


def main():
    """Run the analysis."""
    args = parse_args()
    
    # Create output directory
    Path(args.output).mkdir(parents=True, exist_ok=True)
    
    # Parse keywords
    keywords = [k.strip() for k in args.keywords.split(',')]
    
    # Calculate date range based on arguments
    if args.start_date:
        # Parse custom start date
        try:
            start_date = datetime.strptime(args.start_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            logger.error(f"Invalid start date format: {args.start_date}. Use YYYY-MM-DD format.")
            sys.exit(1)
            
        # Parse custom end date if provided, otherwise use yesterday
        if args.end_date:
            try:
                end_date = datetime.strptime(args.end_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0, microsecond=0)
            except ValueError:
                logger.error(f"Invalid end date format: {args.end_date}. Use YYYY-MM-DD format.")
                sys.exit(1)
        else:
            end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
    else:
        # Use days back from today if no specific dates provided
        days = args.days if args.days is not None else 30
        end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        start_date = end_date - timedelta(days=days-1)
    
    # Ensure end date is not in the future
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    if end_date > today:
        logger.warning(f"End date {end_date.date()} is in the future. Setting to yesterday.")
        end_date = today - timedelta(days=1)
    
    # Ensure start date is not after end date
    if start_date > end_date:
        logger.error(f"Start date {start_date.date()} is after end date {end_date.date()}.")
        sys.exit(1)
        
    # Format date range for filenames
    date_range_str = f"{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}"
    
    logger.info(f"Analyzing economic uncertainty from {start_date.date()} to {end_date.date()}")
    logger.info(f"Using keywords: {keywords}")
    
    # Create the streamer - include all domains by setting target_domains=None
    streamer = GDELTNGramsStreamer(keywords=keywords, target_domains=None)
    
    # Process the data
    mentions_df, word_counts = streamer.process_date_range(start_date, end_date)
    
    # Create raw directory if it doesn't exist
    raw_dir = os.path.join(args.output, "raw")
    Path(raw_dir).mkdir(parents=True, exist_ok=True)
    
    # Save the results with timestamp and date range to raw directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    mentions_file = os.path.join(raw_dir, f"uncertainty_mentions_{date_range_str}_{timestamp}.csv")
    mentions_df.to_csv(mentions_file, index=False)
    logger.info(f"Saved {len(mentions_df)} mentions to {mentions_file}")
    
    # Generate visualizations if requested
    if args.visualize:
        visualize_results(mentions_df, word_counts, args.output, timestamp, date_range_str)
    
    # Print summary statistics
    if len(mentions_df) > 0:
        print("\n===== UNCERTAINTY ANALYSIS SUMMARY =====")
        print(f"Total mentions: {len(mentions_df)}")
        print(f"Date range: {start_date.date()} to {end_date.date()}")
        print(f"Top domains:")
        for domain, count in mentions_df['domain'].value_counts().head(5).items():
            print(f"  - {domain}: {count} mentions")
        print(f"Top co-occurring terms:")
        for term, count in word_counts.most_common(5):
            print(f"  - {term}: {count} occurrences")
    else:
        print("\nNo uncertainty mentions found in the specified date range.")


if __name__ == "__main__":
    main()
