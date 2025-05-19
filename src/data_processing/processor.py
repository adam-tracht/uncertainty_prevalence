"""
Data processing module for economic uncertainty analysis.

This module provides functionality to process and analyze NGrams data
for economic uncertainty indicators.
"""

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, Union

from tqdm import tqdm

from src.data_collection.config import ECONOMIC_UNCERTAINTY_TERMS

logger = logging.getLogger(__name__)

class NGramProcessor:
    """Processes GDELT NGrams data for economic uncertainty analysis."""
    
    def __init__(self, economic_terms: Optional[Set[str]] = None):
        """Initialize the NGramProcessor.
        
        Args:
            economic_terms: Set of economic terms to look for in the NGrams data.
                         If None, uses the default set from config.
        """
        self.economic_terms = economic_terms or set(ECONOMIC_UNCERTAINTY_TERMS)
        self.uncertainty_indicators = {
            'uncertain', 'uncertainty', 'uncertainties',
            'volatility', 'volatile', 'risk', 'risks', 'risky',
            'unpredictable', 'unpredictability', 'instability',
            'turbulence', 'turbulent', 'fluctuation', 'fluctuations'
        }
        
        # Compile regex patterns for faster matching
        self.economic_pattern = re.compile(
            r'\b(' + '|'.join(map(re.escape, self.economic_terms)) + r')\b',
            re.IGNORECASE
        )
        self.uncertainty_pattern = re.compile(
            r'\b(' + '|'.join(map(re.escape, self.uncertainty_indicators)) + r')\b',
            re.IGNORECASE
        )
    
    def process_ngrams_file(self, file_path: Union[str, Path]) -> List[Dict]:
        """Process a GDELT NGrams JSON file.
        
        Args:
            file_path: Path to the NGrams JSON file
            
        Returns:
            List of processed documents with economic uncertainty mentions
        """
        file_path = Path(file_path)
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return []
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            processed_docs = []
            
            # Process each document in the file
            for doc in tqdm(data, desc=f"Processing {file_path.name}"):
                processed_doc = self._process_document(doc)
                if processed_doc:  # Only include docs with economic uncertainty mentions
                    processed_docs.append(processed_doc)
                    
            return processed_docs
            
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON from {file_path}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}", exc_info=True)
            return []
    
    def _process_document(self, doc: Dict) -> Optional[Dict]:
        """Process a single document from the NGrams data.
        
        Args:
            doc: Raw document from NGrams data
            
        Returns:
            Processed document or None if no economic uncertainty found
        """
        try:
            # Extract basic document info
            doc_id = doc.get('id', '')
            url = doc.get('url', '')
            title = doc.get('title', '')
            text = doc.get('text', '')
            
            # Skip if no text
            if not text:
                return None
                
            # Look for economic terms and uncertainty indicators
            economic_matches = set(self.economic_pattern.findall(text.lower()))
            uncertainty_matches = set(self.uncertainty_pattern.findall(text.lower()))
            
            # Skip if no matches found
            if not economic_matches or not uncertainty_matches:
                return None
                
            # Find context around the matches
            context = self._extract_context(text, economic_matches, uncertainty_matches)
            
            # Create processed document
            processed_doc = {
                'doc_id': doc_id,
                'url': url,
                'title': title,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'economic_terms': list(economic_matches),
                'uncertainty_terms': list(uncertainty_matches),
                'context': context,
                'source': 'gdelt_ngrams',
                'processing_time': datetime.utcnow().isoformat()
            }
            
            return processed_doc
            
        except Exception as e:
            logger.error(f"Error processing document {doc.get('id', 'unknown')}: {e}")
            return None
    
    def _extract_context(self, text: str, economic_matches: Set[str], 
                         uncertainty_matches: Set[str], 
                         window: int = 100) -> List[Dict]:
        """Extract context around the economic and uncertainty term co-occurrences.
        
        Args:
            text: The full text to search in
            economic_matches: Set of economic terms found
            uncertainty_matches: Set of uncertainty terms found
            window: Number of characters to include around each match
            
        Returns:
            List of context snippets with their positions
        """
        contexts = []
        
        # Find all positions of economic terms
        for term in economic_matches:
            for match in re.finditer(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE):
                start = max(0, match.start() - window)
                end = min(len(text), match.end() + window)
                context = {
                    'term': term,
                    'type': 'economic',
                    'snippet': text[start:end],
                    'start_pos': match.start(),
                    'end_pos': match.end()
                }
                contexts.append(context)
        
        # Find all positions of uncertainty terms
        for term in uncertainty_matches:
            for match in re.finditer(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE):
                start = max(0, match.start() - window)
                end = min(len(text), match.end() + window)
                context = {
                    'term': term,
                    'type': 'uncertainty',
                    'snippet': text[start:end],
                    'start_pos': match.start(),
                    'end_pos': match.end()
                }
                contexts.append(context)
        
        return contexts

    def process_ngrams_files(self, file_paths: List[Union[str, Path]]) -> List[Dict]:
        """Process multiple NGrams files.
        
        Args:
            file_paths: List of file paths to process
            
        Returns:
            Combined list of processed documents
        """
        all_docs = []
        
        for file_path in file_paths:
            docs = self.process_ngrams_file(file_path)
            all_docs.extend(docs)
            
        return all_docs
