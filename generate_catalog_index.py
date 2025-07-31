#!/usr/bin/env python3
"""
OpenMed Catalog Index Generator
Creates catalog index from existing medication JSON files.
Generates both JSON and CSV formats.
"""

import json
import csv
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Configuration
CATALOG_DIR = Path("catalog")
DB_DIR = Path("db")
CATALOG_LIST_DIR = DB_DIR / "catalog-list"
PACKAGING_LIST_DIR = DB_DIR / "packaging-list"

def get_next_version(index_dir: Path, filename: str) -> str:
    """Get the next version by incrementing the patch version of the existing index."""
    
    index_filepath = index_dir / filename
    
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

def create_catalog_index(catalog_dir: Path, output_dir: Path) -> None:
    """Create catalog index files with metadata about all medications."""
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all medication JSON files (excluding index files)
    medication_files = [f for f in catalog_dir.glob("*.json") if f.name != "catalog_index.json"]
    
    # Get the next version number
    next_version = get_next_version(output_dir, "catalog_index.json")
    
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
    
    # Save JSON catalog index
    json_filepath = output_dir / "catalog_index.json"
    with open(json_filepath, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    # Save CSV catalog index
    csv_filepath = output_dir / "catalog_index.csv"
    with open(csv_filepath, 'w', newline='', encoding='utf-8') as f:
        if index_data["catalog_index"]["medications"]:
            writer = csv.DictWriter(f, fieldnames=index_data["catalog_index"]["medications"][0].keys())
            writer.writeheader()
            writer.writerows(index_data["catalog_index"]["medications"])
    
    print(f"Created catalog index: {json_filepath}")
    print(f"Created CSV index: {csv_filepath}")
    print(f"Version: {next_version}")
    print(f"Total medications indexed: {len(medication_files)}")

def create_packaging_index(catalog_dir: Path, output_dir: Path) -> None:
    """Create packaging index files with packaging information."""
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all medication JSON files
    medication_files = [f for f in catalog_dir.glob("*.json") if f.name != "catalog_index.json"]
    
    # Get the next version number
    next_version = get_next_version(output_dir, "packaging_index.json")
    
    packaging_data = {
        "packaging_index": {
            "version": next_version,
            "generated_at": datetime.now().isoformat(),
            "total_packages": 0,
            "packages": []
        }
    }
    
    total_packages = 0
    
    # Read each medication file and extract packaging info
    for filepath in sorted(medication_files):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                medication = json.load(f)
            
            # Extract packaging information
            packages = medication.get("packaging", [])
            for package in packages:
                package_entry = {
                    "catalogId": medication.get("catalogId"),
                    "medicationName": medication.get("name"),
                    "packageId": package.get("packageId"),
                    "strength": package.get("strength"),
                    "form": package.get("form"),
                    "size": package.get("size"),
                    "unit": package.get("unit"),
                    "status": package.get("status"),
                    "filename": filepath.name
                }
                
                packaging_data["packaging_index"]["packages"].append(package_entry)
                total_packages += 1
            
        except Exception as e:
            print(f"Error reading packaging from {filepath}: {e}")
    
    packaging_data["packaging_index"]["total_packages"] = total_packages
    
    # Save JSON packaging index
    json_filepath = output_dir / "packaging_index.json"
    with open(json_filepath, 'w', encoding='utf-8') as f:
        json.dump(packaging_data, f, indent=2, ensure_ascii=False)
    
    # Save CSV packaging index
    csv_filepath = output_dir / "packaging_index.csv"
    with open(csv_filepath, 'w', newline='', encoding='utf-8') as f:
        if packaging_data["packaging_index"]["packages"]:
            writer = csv.DictWriter(f, fieldnames=packaging_data["packaging_index"]["packages"][0].keys())
            writer.writeheader()
            writer.writerows(packaging_data["packaging_index"]["packages"])
    
    print(f"Created packaging index: {json_filepath}")
    print(f"Created CSV packaging index: {csv_filepath}")
    print(f"Version: {next_version}")
    print(f"Total packages indexed: {total_packages}")

def main():
    """Main function to generate the catalog index."""
    
    print("OpenMed Catalog Index Generator")
    print("=" * 40)
    
    # Ensure we're in the right directory
    if not Path("api").exists():
        print("Error: Please run this script from the OpenMed root directory")
        return
    
    # Create catalog index from existing files
    print("\n📋 Creating catalog index...")
    create_catalog_index(CATALOG_DIR, CATALOG_LIST_DIR)
    
    print("\n✅ Catalog index created successfully.")
    print("The API can now serve the indexed medications.")

if __name__ == "__main__":
    main() 