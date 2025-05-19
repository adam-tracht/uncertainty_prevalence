"""
Module for streaming and processing GDELT Web NGrams 3.0 data without local storage.

This module provides functionality to directly stream, process, and analyze GDELT Web NGrams data
for tracking mentions of economic uncertainty terms in news articles.
"""

import gzip
import json
import io
import logging
import os
import requests
import pandas as pd
from datetime import datetime, timedelta
from collections import Counter
from typing import Dict, List, Tuple, Set, Optional, Any

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to see more detailed logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Constants
GDELT_BASE_URL = "http://data.gdeltproject.org/gdeltv3/webngrams"
DEFAULT_KEYWORDS = ["uncertainty"]


class GDELTNGramsStreamer:
    """Class for streaming and processing GDELT Web NGrams 3.0 data without local storage."""

    def __init__(
        self,
        keywords: Optional[List[str]] = None,
        target_domains: Optional[List[str]] = None,
        base_url: str = GDELT_BASE_URL,
    ):
        """Initialize the GDELT NGrams streamer.
        
        Args:
            keywords: List of keywords to search for in the NGrams data.
            target_domains: List of domains to filter for (if empty, all domains are included).
            base_url: Base URL for GDELT Web NGrams data.
        """
        self.keywords = [kw.lower() for kw in (keywords or DEFAULT_KEYWORDS)]
        self.target_domains = target_domains
        self.base_url = base_url.rstrip('/')
        self.processed_urls: Set[str] = set()

    def get_ngrams_url_for_date(self, date_time: datetime) -> str:
        """Generate the NGrams URL for a specific date and time.
        
        Args:
            date_time: The date and time to get the NGrams file for
            
        Returns:
            URL string for the NGrams file
        """
        # Format: YYYYMMDDHHMMSS.webngrams.json.gz
        filename = date_time.strftime("%Y%m%d%H%M00.webngrams.json.gz")
        return f"{self.base_url}/{filename}"

    def process_ngram_file(self, date_time: datetime) -> Tuple[List[Dict[str, Any]], Counter]:
        """Process a single ngram file, streaming without saving locally.
        
        Args:
            date_time: The date and time of the NGrams file to process
            
        Returns:
            Tuple of (list of uncertainty mentions, counter of co-occurring terms)
        """
        # Format the URL
        url = self.get_ngrams_url_for_date(date_time)
        file_obj = None
        
        # Track data we care about
        uncertainty_mentions = []
        co_occurring_terms = Counter()
        
        # Debug: Print the keywords we're looking for
        logger.debug(f"Looking for keywords: {self.keywords}")
        
        try:
            # Stream the file
            logger.info(f"Streaming {url}...")
            
            # Handle local file paths for testing
            if url.startswith('http'):
                response = requests.get(url, stream=True, timeout=60)
                if response.status_code != 200:
                    logger.warning(f"No data for {date_time.isoformat()} (Status: {response.status_code})")
                    return [], Counter()
                file_obj = io.BytesIO(response.content)
            else:
                # For testing with local files
                file_obj = open(url, 'rb')
            
            # Process the gzipped content line by line
            line_count = 0
            found_count = 0
            with gzip.GzipFile(fileobj=file_obj) as f:
                for line in f:
                    line_count += 1
                    if line_count % 100000 == 0:
                        logger.debug(f"Processed {line_count} lines, found {found_count} matches so far...")
                    
                    try:
                        record = json.loads(line)
                        
                        # Check if this is an English record
                        if record.get('lang', '') != 'en':
                            continue
                            
                        # Get the URL and check domain
                        article_url = record.get('url', '')
                        if not article_url:
                            continue
                            
                        # Extract domain
                        domain = article_url.split('/')[2] if '//' in article_url else article_url.split('/')[0]
                            
                        # Check if the ngram field exactly matches any of our keywords
                        # or contains any of our multi-word keywords
                        ngram = record.get('ngram', '').lower()
                        
                        # Debug: Print any record with 'uncertainty' in the ngram
                        if ngram == 'uncertainty':
                            logger.debug(f"Found 'uncertainty' ngram: {record}")
                        
                        matched_keywords = []
                        
                        for kw in self.keywords:
                            kw_lower = kw.lower()
                            # For single-word keywords, require exact match
                            # For multi-word keywords, check if they're contained
                            if ((' ' not in kw_lower and ngram == kw_lower) or
                                (' ' in kw_lower and kw_lower in ngram)):
                                matched_keywords.append(kw)
                                found_count += 1
                                logger.debug(f"Found match: {kw} in ngram: {ngram}, URL: {record.get('url', '')}")
                                break
                        
                        # If we found any matches, add to results
                        if matched_keywords:
                            # Extract context from pre and post
                            pre = record.get('pre', '')
                            post = record.get('post', '')
                            full_context = f"{pre} {ngram} {post}".strip()
                            
                            # Save the mention
                            uncertainty_mentions.append({
                                'date': record.get('date', ''),
                                'url': article_url,
                                'domain': domain,
                                'keywords': matched_keywords,
                                'context': full_context[:500] if full_context else '',  # Truncate long contexts
                                'ngram': ngram
                            })
                            
                            # Extract co-occurring words for word cloud and co-occurrence matrix
                            if pre or post:
                                # Process pre and post fields separately to get better context
                                pre_words = [w.lower() for w in pre.split() if len(w) > 3]
                                post_words = [w.lower() for w in post.split() if len(w) > 3]
                                
                                # Combine all words
                                all_words = pre_words + post_words
                                
                                # Filter out stopwords and the uncertainty keywords themselves
                                stopwords = ['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 
                                            'should', 'their', 'about', 'there', 'these', 'those', 'they', 'what', 
                                            'when', 'where', 'which', 'while', 'your'] + [k.lower() for k in self.keywords]
                                
                                filtered_words = [w for w in all_words if w not in stopwords]
                                
                                # Update the counter with the filtered words
                                co_occurring_terms.update(filtered_words)
                    
                    except json.JSONDecodeError as e:
                        logger.warning(f"Error parsing JSON line: {e}")
                        continue
                    except Exception as e:
                        logger.warning(f"Error processing record: {e}")
                        continue
            
            # Close the file object if it's a local file
            if not url.startswith('http') and file_obj and not isinstance(file_obj, io.BytesIO):
                file_obj.close()
            
            logger.info(f"Processed {date_time.isoformat()}: Found {len(uncertainty_mentions)} mentions")
            return uncertainty_mentions, co_occurring_terms
                
        except requests.RequestException as e:
            logger.error(f"Error requesting {url}: {e}")
            return [], Counter()
        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
            if file_obj and not isinstance(file_obj, io.BytesIO):
                file_obj.close()
            return [], Counter()

    def process_date_range(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> Tuple[pd.DataFrame, Counter]:
        """Process a range of dates, collecting data for each day at midnight.
        
        Args:
            start_date: The start date (inclusive)
            end_date: The end date (inclusive)
            
        Returns:
            Tuple of (DataFrame of uncertainty mentions, Counter of co-occurring terms)
        """
        logger.info(f"Processing date range from {start_date.date()} to {end_date.date()}")
        
        current_date = start_date
        all_mentions = []
        all_terms = Counter()
        
        while current_date <= end_date:
            # Process each day using the midnight file (00:01 AM)
            date_time = current_date.replace(hour=0, minute=1, second=0, microsecond=0)
            mentions, terms = self.process_ngram_file(date_time)
            all_mentions.extend(mentions)
            all_terms.update(terms)
            
            logger.info(f"Completed date {current_date.strftime('%Y-%m-%d')}")
            current_date += timedelta(days=1)
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(all_mentions) if all_mentions else pd.DataFrame()
        
        return df, all_terms

    def process_previous_days(self, days_back: int = 1) -> Tuple[pd.DataFrame, Counter]:
        """Process a specified number of previous days.
        
        Args:
            days_back: Number of days to go back from today
            
        Returns:
            Tuple of (DataFrame of uncertainty mentions, Counter of co-occurring terms)
        """
        # Calculate date range
        end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        start_date = end_date - timedelta(days=days_back-1)
        
        return self.process_date_range(start_date, end_date)

    def generate_word_cloud_data(self, word_counts: Counter, max_words: int = 100) -> List[Dict[str, Any]]:
        """Generate word cloud data from word counts.
        
        Args:
            word_counts: Counter of word occurrences
            max_words: Maximum number of words to include
            
        Returns:
            List of dictionaries with text and value for word cloud visualization
        """
        return [{"text": word, "value": count} for word, count in word_counts.most_common(max_words)]

    def save_results(self, mentions_df: pd.DataFrame, word_counts: Counter, output_dir: str = ".") -> None:
        """Save results to CSV and JSON files.
        
        Args:
            mentions_df: DataFrame of uncertainty mentions
            word_counts: Counter of co-occurring terms
            output_dir: Directory to save output files
        """
        import os
        from pathlib import Path
        
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate filenames with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        mentions_file = os.path.join(output_dir, f"uncertainty_mentions_{timestamp}.csv")
        wordcloud_file = os.path.join(output_dir, f"word_cloud_data_{timestamp}.json")
        
        # Save files
        mentions_df.to_csv(mentions_file, index=False)
        logger.info(f"Saved mentions to {mentions_file}")
        
        word_cloud_data = self.generate_word_cloud_data(word_counts)
        with open(wordcloud_file, "w") as f:
            json.dump(word_cloud_data, f)
        logger.info(f"Saved word cloud data to {wordcloud_file}")


def main():
    """Run the GDELT NGrams streaming process."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Stream and process GDELT NGrams data")
    parser.add_argument("--days", type=int, default=1, help="Number of days to process (default: 1)")
    parser.add_argument("--interval", type=int, default=15, help="Interval in minutes between checks (default: 15)")
    parser.add_argument("--output", type=str, default="frontend/public/data/output", help="Output directory (default: frontend/public/data/output)")
    args = parser.parse_args()
    
    # Create the streamer
    streamer = GDELTNGramsStreamer()
    
    # Process the data
    mentions_df, word_counts = streamer.process_previous_days(args.days, args.interval)
    
    # Save the results
    streamer.save_results(mentions_df, word_counts, args.output)
    
    logger.info(f"Processed {len(mentions_df)} uncertainty mentions across {args.days} days")


if __name__ == "__main__":
    main()
