#!/usr/bin/env python3
"""
Step 3: Generate embeddings for semantic search
"""
import os
import sys
import subprocess

def generate_embeddings(pipeline_dir: str, fdd_id: str):
    """Generate embeddings using the enhanced_chunking_for_semantic_search.py script"""
    
    if not os.path.exists(pipeline_dir):
        raise FileNotFoundError(f"Pipeline directory not found: {pipeline_dir}")
    
    print(f"Generating embeddings for FDD ID: {fdd_id}")
    print(f"Using pipeline directory: {pipeline_dir}")
    
    # Run the embedding generation script
    cmd = [
        "python3",
        "scripts/enhanced_chunking_for_semantic_search.py",
        pipeline_dir,
        fdd_id
    ]
    
    print(f"\nRunning: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error generating embeddings:")
        print(result.stderr)
        raise Exception("Embedding generation failed")
    
    print(result.stdout)
    print("\n✓ Step 3 complete!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 step3_generate_embeddings.py <pipeline_dir> <fdd_id>")
        print("Example: python3 step3_generate_embeddings.py pipeline_output/Blo 123e4567-e89b-12d3-a456-426614174000")
        sys.exit(1)
    
    pipeline_dir = sys.argv[1]
    fdd_id = sys.argv[2]
    
    try:
        generate_embeddings(pipeline_dir, fdd_id)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
