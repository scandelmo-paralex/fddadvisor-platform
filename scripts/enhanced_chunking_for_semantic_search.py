#!/usr/bin/env python3
"""
Enhanced Semantic Search Chunking with Gemini
==============================================
Takes YOUR existing pipeline output from items/ folder and creates proper 
chunks for semantic search with embeddings.

Uses Google Gemini text-embedding-004 for embeddings (768 dimensions)
Integrates with your existing Vertex AI pipeline, not replacing it.

UPDATED: Reads individual item files from items/ folder instead of parsing combined file
"""

import os
import json
import time
import re
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv
from google.auth import default
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import requests
from supabase import create_client, Client
import tiktoken

load_dotenv()

# Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "fddadvisor-fdd-processing")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Gemini Embedding Model Configuration
MODEL_LOCATION = os.getenv("MODEL_LOCATION", "us-central1")
EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_ENDPOINT = f"https://{MODEL_LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{MODEL_LOCATION}/publishers/google/models/{EMBEDDING_MODEL}:predict"

# Chunking parameters - optimized for semantic search
TARGET_CHUNK_SIZE = 600  # tokens
MAX_CHUNK_SIZE = 1000
MIN_CHUNK_SIZE = 100
OVERLAP_SIZE = 75  # Larger overlap for better context

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
encoding = tiktoken.get_encoding("cl100k_base")


def get_credentials():
    """Get Google Cloud credentials from service account or default"""
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    if credentials_path and Path(credentials_path).exists():
        # Use service account credentials
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
    else:
        # Fall back to application default credentials
        credentials, _ = default()
    
    return credentials


def get_access_token():
    """Get Google Cloud access token for API calls"""
    credentials = get_credentials()
    if not credentials.valid:
        credentials.refresh(Request())
    return credentials.token


def count_tokens(text: str) -> int:
    """Count tokens in text using tiktoken"""
    return len(encoding.encode(text))


def split_into_paragraphs(text: str) -> List[str]:
    """Split text into paragraphs, preserving structure"""
    # Split on double newlines
    paragraphs = re.split(r'\n\s*\n', text)
    return [p.strip() for p in paragraphs if p.strip()]


def get_last_n_tokens(text: str, n: int) -> str:
    """Get the last n tokens from text for overlap"""
    tokens = encoding.encode(text)
    if len(tokens) <= n:
        return text
    overlap_tokens = tokens[-n:]
    return encoding.decode(overlap_tokens)


def load_page_mapping(page_mapping_file: Path) -> Dict[int, int]:
    """Load page mappings from your pipeline output"""
    with open(page_mapping_file, 'r') as f:
        mapping_data = json.load(f)
    
    # Convert "Item 1" keys to integers
    page_mapping = {}
    for key, page_num in mapping_data.items():
        # Extract item number from "Item 1", "Item 19", etc.
        match = re.search(r'Item\s+(\d+)', key, re.IGNORECASE)
        if match:
            item_num = int(match.group(1))
            page_mapping[item_num] = page_num
    
    return page_mapping


def create_semantic_chunks_from_items(
    items_dir: Path,
    page_mapping: Dict[int, int],
    franchise_name: str
) -> List[Dict]:
    """
    Create semantic chunks from individual Item files
    Reads from items/item_01.txt, items/item_02.txt, etc.
    """
    chunks = []
    
    print(f"\nReading individual Item files from {items_dir}...")
    
    # Process each Item file (item_01.txt through item_23.txt)
    for item_num in range(1, 24):
        item_file = items_dir / f"item_{item_num:02d}.txt"
        
        if not item_file.exists():
            print(f"  ⚠ Item {item_num} file not found, skipping")
            continue
        
        # Read Item text
        with open(item_file, 'r', encoding='utf-8') as f:
            item_text = f.read().strip()
        
        if not item_text or len(item_text) < 50:
            print(f"  ⚠ Item {item_num} is empty or too short, skipping")
            continue
        
        # Get page number from mapping
        page_num = page_mapping.get(item_num, 1)
        
        # Get Item title from the text (usually first line or from header)
        item_title = f"Item {item_num}"
        lines = item_text.split('\n')
        if lines:
            first_line = lines[0].strip()
            # If first line looks like a title (short and doesn't end with period)
            if len(first_line) < 100 and not first_line.endswith('.'):
                item_title = first_line
        
        print(f"  Processing Item {item_num}: {item_title[:50]}... (Page {page_num})")
        
        # Split item text into paragraphs
        paragraphs = split_into_paragraphs(item_text)
        
        current_chunk_text = f"ITEM {item_num}: {item_title}\n\n"
        chunk_start_page = page_num
        
        for para in paragraphs:
            potential_text = current_chunk_text + para + "\n\n"
            potential_tokens = count_tokens(potential_text)
            
            if potential_tokens > TARGET_CHUNK_SIZE and count_tokens(current_chunk_text) >= MIN_CHUNK_SIZE:
                # Save current chunk
                chunks.append({
                    'franchise_name': franchise_name,
                    'item_number': item_num,
                    'item_title': item_title[:100],  # Truncate if too long
                    'page_number': chunk_start_page,
                    'start_page': chunk_start_page,
                    'end_page': page_num,
                    'chunk_text': current_chunk_text.strip(),
                    'token_count': count_tokens(current_chunk_text),
                    'metadata': {
                        'chunk_type': 'item_section',
                        'has_table': 'table' in para.lower() or '|' in para
                    }
                })
                
                # Start new chunk with overlap
                overlap = get_last_n_tokens(current_chunk_text, OVERLAP_SIZE)
                current_chunk_text = f"ITEM {item_num}: {item_title}\n\n{overlap}\n\n{para}\n\n"
            else:
                # Add paragraph to current chunk
                current_chunk_text = potential_text
        
        # Save final chunk for this Item
        if count_tokens(current_chunk_text) >= MIN_CHUNK_SIZE:
            chunks.append({
                'franchise_name': franchise_name,
                'item_number': item_num,
                'item_title': item_title[:100],
                'page_number': chunk_start_page,
                'start_page': chunk_start_page,
                'end_page': page_num,
                'chunk_text': current_chunk_text.strip(),
                'token_count': count_tokens(current_chunk_text),
                'metadata': {
                    'chunk_type': 'item_section',
                    'has_table': False
                }
            })
    
    return chunks


def generate_embeddings_batch(chunks: List[Dict]) -> List[Dict]:
    """
    Generate embeddings for chunks using Google Gemini text-embedding-004
    768-dimensional embeddings
    Processes in batches to avoid rate limits
    """
    BATCH_SIZE = 5  # Gemini handles smaller batches better
    
    print(f"\nGenerating embeddings for {len(chunks)} chunks...")
    
    access_token = get_access_token()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        
        print(f"  Processing batch {i//BATCH_SIZE + 1}/{(len(chunks)-1)//BATCH_SIZE + 1}...")
        
        # Prepare batch request for Gemini
        instances = []
        for chunk in batch:
            instances.append({
                "content": chunk['chunk_text'],
                "task_type": "RETRIEVAL_DOCUMENT"  # Optimize for retrieval/search
            })
        
        payload = {"instances": instances}
        
        try:
            response = requests.post(
                EMBEDDING_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            # Extract embeddings from response
            predictions = result.get("predictions", [])
            
            for chunk, prediction in zip(batch, predictions):
                # Gemini returns embeddings in 'embeddings' field
                embedding = prediction.get("embeddings", {}).get("values", [])
                chunk['embedding'] = embedding
                
        except Exception as e:
            print(f"    ⚠ Error generating embeddings for batch: {e}")
            # Add empty embeddings as fallback
            for chunk in batch:
                chunk['embedding'] = [0.0] * 768  # 768-dimensional zero vector
    
    print("  ✓ All embeddings generated")
    return chunks


def store_chunks_in_supabase(chunks: List[Dict], fdd_id: str):
    """
    Store chunks in your Supabase fdd_chunks table
    """
    print(f"\nStoring {len(chunks)} chunks in Supabase...")
    
    chunk_records = []
    for idx, chunk in enumerate(chunks):
        chunk_records.append({
            'fdd_id': fdd_id,
            'chunk_text': chunk['chunk_text'],
            'chunk_index': idx,
            'item_number': chunk['item_number'],
            'page_number': chunk['page_number'],
            'start_page': chunk['start_page'],
            'end_page': chunk['end_page'],
            'token_count': chunk['token_count'],
            'embedding': chunk['embedding'],
            'metadata': chunk['metadata']
        })
    
    # Bulk insert
    response = supabase.table('fdd_chunks').insert(chunk_records).execute()
    
    print(f"  ✓ Stored {len(response.data)} chunks successfully")


def process_pipeline_output(
    pipeline_output_dir: str,
    fdd_id: str,
    franchise_name: Optional[str] = None
):
    """
    Main function: Process your existing pipeline output for semantic search
    
    Args:
        pipeline_output_dir: Path to your pipeline_output/{franchise_name}/ directory
        fdd_id: UUID of the FDD in your database
        franchise_name: Override franchise name (optional)
    """
    
    output_path = Path(pipeline_output_dir)
    
    # Load your existing outputs
    items_dir = output_path / "items"
    page_mapping_file = output_path / "page_mapping.json"
    
    if not items_dir.exists():
        raise FileNotFoundError(f"Items directory not found: {items_dir}")
    if not page_mapping_file.exists():
        raise FileNotFoundError(f"Page mapping not found: {page_mapping_file}")
    
    # Determine franchise name
    if not franchise_name:
        franchise_name = output_path.name
    
    print(f"\n{'='*70}")
    print(f"SEMANTIC SEARCH CHUNKING: {franchise_name}")
    print(f"{'='*70}\n")
    
    # Load page mapping
    print("Loading page mappings...")
    page_mapping = load_page_mapping(page_mapping_file)
    print(f"  ✓ Found mappings for {len(page_mapping)} Items")
    
    # Create semantic chunks from individual Item files
    print("\nCreating semantic search chunks...")
    chunks = create_semantic_chunks_from_items(items_dir, page_mapping, franchise_name)
    print(f"  ✓ Created {len(chunks)} chunks")
    print(f"  ✓ Avg tokens per chunk: {sum(c['token_count'] for c in chunks) / len(chunks):.0f}")
    
    # Generate embeddings
    chunks = generate_embeddings_batch(chunks)
    
    # Store in database
    store_chunks_in_supabase(chunks, fdd_id)
    
    # Save chunks locally for reference
    chunks_output = output_path / "semantic_search_chunks.json"
    with open(chunks_output, 'w', encoding='utf-8') as f:
        # Don't save embeddings to JSON (too large)
        chunks_without_embeddings = [
            {k: v for k, v in chunk.items() if k != 'embedding'}
            for chunk in chunks
        ]
        json.dump(chunks_without_embeddings, f, indent=2)
    
    print(f"\n{'='*70}")
    print(f"✓ SEMANTIC SEARCH CHUNKING COMPLETE")
    print(f"{'='*70}\n")
    print(f"Results:")
    print(f"  - {len(chunks)} chunks stored in Supabase")
    print(f"  - Local reference: {chunks_output}")
    print(f"\nReady for semantic search! 🚀")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python enhanced_chunking_for_semantic_search.py <pipeline_output_dir> <fdd_id>")
        sys.exit(1)
    
    pipeline_dir = sys.argv[1]
    fdd_id = sys.argv[2]
    
    process_pipeline_output(pipeline_dir, fdd_id)
