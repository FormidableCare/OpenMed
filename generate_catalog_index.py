#!/usr/bin/env python3
"""
OpenMed Catalog Index Generator
Creates catalog index from existing medication JSON files.
Generates both JSON and CSV formats with comprehensive data.
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

def extract_medication_data(medication: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract comprehensive medication data including all packaging options."""
    
    # Format filename as GitHub URL
    filename = medication.get("filename", "")
    github_url = f"https://github.com/FormidableCare/OpenMed/tree/main/catalog/{filename}" if filename else ""
    
    base_data = {
        # Basic medication information - starting with catalogId
        "catalogId": medication.get("catalogId", ""),
        "name": medication.get("name", ""),
        "status": medication.get("status", ""),
        "category": medication.get("category", ""),
        "registrationValidity": medication.get("registrationValidity", ""),
        "registrationNumber": medication.get("registrationNumber", ""),
        
        # Clinical information
        "treatmentDescriptions": medication.get("treatmentDescriptions", ""),
        "termsOfIssue": medication.get("termsOfIssue", ""),
        "form": medication.get("form", ""),
        "route": medication.get("route", ""),
        "site": medication.get("site", ""),
        "method": medication.get("method", ""),
        "administrationNotes": medication.get("administrationNotes", ""),
        "ingredients": medication.get("ingredients", ""),
        
        # Codes and classifications
        "atc5_code": medication.get("codes", {}).get("atc5", {}).get("code", ""),
        "atc5_name": medication.get("codes", {}).get("atc5", {}).get("name", ""),
        "atc5_system": medication.get("codes", {}).get("atc5", {}).get("system", ""),
        "snomed_ct_integration_code": medication.get("codes", {}).get("snomedCTIntegrationComposition", {}).get("code", ""),
        "snomed_ct_integration_name": medication.get("codes", {}).get("snomedCTIntegrationComposition", {}).get("name", ""),
        "snomed_ct_clinical_code": medication.get("codes", {}).get("snomedCTClinicalDrug", {}).get("code", ""),
        "snomed_ct_clinical_name": medication.get("codes", {}).get("snomedCTClinicalDrug", {}).get("name", ""),
        
        # Safety information
        "contraindications": medication.get("contraindications", ""),
        "sideEffect": medication.get("sideEffect", ""),
        "warnings": medication.get("warnings", ""),
        "alternativeMedications": ", ".join(medication.get("alternativeMedications", [])),
        
        # Metadata
        "schema_version": medication.get("metadata", {}).get("version", ""),
        "lastUpdated": medication.get("metadata", {}).get("lastUpdated", ""),
        
        # File information - GitHub URL format
        "filename": github_url
    }
    
    # Extract packaging information
    packages = medication.get("packaging", [])
    if not packages:
        # If no packaging, return base data with empty packaging fields
        return [base_data]
    
    # Create a row for each packaging option
    rows = []
    for package in packages:
        package_data = base_data.copy()
        
        # Packaging information
        package_data.update({
            "package_name": package.get("name", ""),
            "manufacturer_name": package.get("manufacturer", {}).get("name", ""),
            "manufacturer_country": package.get("manufacturer", {}).get("countryOfOrigin", ""),
            "strength_value": package.get("strength", {}).get("value", ""),
            "strength_unit": package.get("strength", {}).get("unit", ""),
            "quantity_value": package.get("quantity", {}).get("value", ""),
            "quantity_unit": package.get("quantity", {}).get("unit", ""),
            "packaging_description": package.get("packagingDescription", ""),
            "shelf_life": package.get("shelfLife", ""),
            "storage_conditions": package.get("storageConditions", ""),
            "manufacturers_administration_recommendation": package.get("manufacturersAdministrationRecommendation", ""),
            
            # Package codes
            "package_barcode": package.get("codes", {}).get("barcode", ""),
            "package_pharmasoft": package.get("codes", {}).get("pharmasoft", ""),
            "package_superpharm": package.get("codes", {}).get("superpharm", ""),
            "package_yarpa": package.get("codes", {}).get("yarpa", ""),
            "package_moh": package.get("codes", {}).get("moh", ""),
            
            # Pricing information
            "currency": package.get("pricing", {}).get("currency", ""),
            "max_wholesale_price": package.get("pricing", {}).get("maxWholesalePrice", ""),
            "retail_margin": package.get("pricing", {}).get("retailMargin", ""),
            "max_retail_price": package.get("pricing", {}).get("maxRetailPrice", ""),
            "max_price_with_vat": package.get("pricing", {}).get("maxPriceWithVAT", "")
        })
        
        rows.append(package_data)
    
    return rows

def create_catalog_index(catalog_dir: Path, output_dir: Path) -> None:
    """Create catalog index files with comprehensive metadata about all medications."""
    
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
    
    # Comprehensive CSV data
    csv_rows = []
    
    # Read each medication file and extract comprehensive info
    for filepath in sorted(medication_files):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                medication = json.load(f)
            
            # Add filename to medication data
            medication["filename"] = filepath.name
            
            # Extract basic information for JSON index
            # Format filename as GitHub URL
            github_url = f"https://github.com/FormidableCare/OpenMed/tree/main/catalog/{filepath.name}"
            
            index_entry = {
                "catalogId": medication.get("catalogId"),
                "name": medication.get("name"),
                "status": medication.get("status"),
                "category": medication.get("category"),
                "atc5": medication.get("codes", {}).get("atc5", {}).get("code"),
                "registrationNumber": medication.get("registrationNumber"),
                "filename": github_url
            }
            
            index_data["catalog_index"]["medications"].append(index_entry)
            
            # Extract comprehensive data for CSV
            medication_csv_rows = extract_medication_data(medication)
            csv_rows.extend(medication_csv_rows)
            
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
    
    # Save JSON catalog index
    json_filepath = output_dir / "catalog_index.json"
    with open(json_filepath, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    # Save comprehensive CSV catalog index
    csv_filepath = output_dir / "catalog_index.csv"
    if csv_rows:
        # Get all possible field names from the data
        fieldnames = set()
        for row in csv_rows:
            fieldnames.update(row.keys())
        
        # Create ordered fieldnames with specific priority order
        priority_fields = [
            "catalogId",      # 1st
            "name",           # 2nd
            "category",       # 3rd
            "atc5_code",      # 4th
            "atc5_name",      # 5th
            "package_moh",    # 6th (MOH codes)
        ]
        
        ordered_fieldnames = []
        
        # Add priority fields in order
        for field in priority_fields:
            if field in fieldnames:
                ordered_fieldnames.append(field)
        
        # Add all other fields except priority fields and filename
        other_fields = sorted([f for f in fieldnames if f not in priority_fields + ["filename"]])
        ordered_fieldnames.extend(other_fields)
        
        # Add filename at the end
        if "filename" in fieldnames:
            ordered_fieldnames.append("filename")
        
        with open(csv_filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=ordered_fieldnames)
            writer.writeheader()
            writer.writerows(csv_rows)
    
    print(f"Created catalog index: {json_filepath}")
    print(f"Created comprehensive CSV index: {csv_filepath}")
    print(f"Version: {next_version}")
    print(f"Total medications indexed: {len(medication_files)}")
    print(f"Total CSV rows (including packaging): {len(csv_rows)}")

def create_packaging_index(catalog_dir: Path, output_dir: Path) -> None:
    """Create packaging index files with detailed packaging information."""
    
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
                # Format filename as GitHub URL
                github_url = f"https://github.com/FormidableCare/OpenMed/tree/main/catalog/{filepath.name}"
                
                package_entry = {
                    "catalogId": medication.get("catalogId"),
                    "medicationName": medication.get("name"),
                    "packageId": package.get("packageId"),
                    "strength": package.get("strength"),
                    "form": package.get("form"),
                    "size": package.get("size"),
                    "unit": package.get("unit"),
                    "status": package.get("status"),
                    "filename": github_url
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
    print("\n📋 Creating comprehensive catalog index...")
    create_catalog_index(CATALOG_DIR, CATALOG_LIST_DIR)
    
    print("\n✅ Comprehensive catalog index created successfully.")
    print("The CSV now includes all medication fields and packaging information.")
    print("The API can now serve the indexed medications.")

if __name__ == "__main__":
    main() 