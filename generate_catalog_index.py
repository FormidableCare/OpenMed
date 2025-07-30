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

def create_catalog_index(catalog_dir: Path) -> None:
    """Create a catalog index file with metadata about all medications."""
    
    # Find all medication JSON files (excluding catalog_index.json itself)
    medication_files = [f for f in catalog_dir.glob("*.json") if f.name != "catalog_index.json"]
    
    index_data = {
        "catalog_index": {
            "version": "1.0.0",
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
                "id": medication.get("id"),
                "name": medication.get("name"),
                "status": medication.get("status"),
                "category": medication.get("category"),
                "manufacturer": medication.get("manufacturer", {}).get("name"),
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