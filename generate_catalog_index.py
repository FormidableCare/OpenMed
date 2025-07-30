#!/usr/bin/env python3
"""
OpenMed Catalog Index Generator
Creates a catalog index from existing medication JSON files.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Configuration
CATALOG_DIR = Path("catalog")

def get_next_version(catalog_dir: Path) -> str:
    """Get the next version by incrementing the patch version of the existing catalog index."""
    
    index_filepath = catalog_dir / "catalog_index.json"
    
    # Default version if no existing index
    default_version = "1.0.0"
    
    if not index_filepath.exists():
        return default_version
    
    try:
        with open(index_filepath, 'r', encoding='utf-8') as f:
            existing_index = json.load(f)
            current_version = existing_index.get("catalog_index", {}).get("version", default_version)
    except Exception as e:
        print(f"Warning: Could not read existing catalog index: {e}")
        return default_version
    
    # Parse version and increment patch
    try:
        major, minor, patch = current_version.split('.')
        new_patch = str(int(patch) + 1)
        return f"{major}.{minor}.{new_patch}"
    except Exception as e:
        print(f"Warning: Could not parse version '{current_version}': {e}")
        return default_version

def create_catalog_index(catalog_dir: Path) -> None:
    """Create a catalog index file with metadata about all medications."""
    
    # Find all medication JSON files (excluding catalog_index.json itself)
    medication_files = [f for f in catalog_dir.glob("*.json") if f.name != "catalog_index.json"]
    
    # Get the next version number
    next_version = get_next_version(catalog_dir)
    
    index_data = {
        "catalog_index": {
            "version": next_version,
            "generated_at": datetime.now().isoformat(),
            "total_medications": len(medication_files),
            "medications": []
        }
    }
    
    # Read each medication file and extract basic info
    for filepath in sorted(medication_files):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                medication = json.load(f)
            
            # Extract basic information for index
            index_entry = {
                "catalogId": medication.get("catalogId"),
                "name": medication.get("name"),
                "status": medication.get("status"),
                "category": medication.get("category"),
                "atc5": medication.get("codes", {}).get("atc5", {}).get("code"),
                "registrationNumber": medication.get("registrationNumber"),
                "filename": filepath.name
            }
            
            index_data["catalog_index"]["medications"].append(index_entry)
            
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
    
    # Save catalog index
    index_filepath = catalog_dir / "catalog_index.json"
    with open(index_filepath, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    print(f"Created catalog index: {index_filepath}")
    print(f"Version: {next_version}")
    print(f"Total medications indexed: {len(medication_files)}")

def main():
    """Main function to generate the catalog index."""
    
    print("OpenMed Catalog Index Generator")
    print("=" * 40)
    
    # Ensure we're in the right directory
    if not Path("api").exists():
        print("Error: Please run this script from the OpenMed root directory")
        return
    
    # Create catalog index from existing files
    print("Creating catalog index from existing medication files...")
    create_catalog_index(CATALOG_DIR)
    
    print("\n✅ Catalog index created successfully.")
    print("The API can now serve the indexed medications.")

if __name__ == "__main__":
    main() 