#!/usr/bin/env python3
"""
Catalog Index Generator
Generates catalog index from medication JSON files in the catalog directory.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CatalogIndexGenerator:
    """Generates catalog index from medication JSON files."""
    
    def __init__(self, catalog_path: str = "catalog"):
        self.catalog_path = Path(catalog_path)
        if not self.catalog_path.exists():
            logger.error(f"Catalog directory {catalog_path} does not exist")
            raise FileNotFoundError(f"Catalog directory {catalog_path} not found")
    
    def generate_index(self) -> Dict[str, Any]:
        """Generate catalog index from medication files."""
        
        # Find all medication JSON files
        json_files = list(self.catalog_path.glob("*.json"))
        medication_files = [f for f in json_files if f.stem.startswith('MOH_')]
        
        logger.info(f"Found {len(medication_files)} medication files")
        
        # Create catalog structure
        catalog = {
            "catalog": {
                "name": "OpenMed Israel Medical Catalog",
                "version": "1.0",
                "lastUpdated": datetime.now().isoformat(),
                "totalMedications": len(medication_files),
                "medications": []
            }
        }
        
        # Process each medication file
        for json_file in medication_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    medication = json.load(f)
                
                # Extract key information
                medication_info = {
                    "id": medication.get("id"),
                    "name": medication.get("product", {}).get("name"),
                    "filename": json_file.name,
                    "category": medication.get("category"),
                    "manufacturer": medication.get("manufacturer", {}).get("name"),
                    "form": medication.get("product", {}).get("form"),
                    "status": medication.get("status")
                }
                
                # Add standard codes if available
                standard_codes = medication.get("standardCodes", {})
                if standard_codes:
                    medication_info["standardCodes"] = {
                        "moh": standard_codes.get("moh"),
                        "yarpa": standard_codes.get("yarpa"),
                        "pharmasoft": standard_codes.get("pharmasoft"),
                        "atc": standard_codes.get("atc", {}).get("code") if standard_codes.get("atc") else None,
                        "snomed": standard_codes.get("snomed", {}).get("code") if standard_codes.get("snomed") else None
                    }
                
                catalog["catalog"]["medications"].append(medication_info)
                
            except Exception as e:
                logger.error(f"Error reading {json_file}: {e}")
        
        return catalog
    
    def save_index(self, catalog: Dict[str, Any], filename: str = "catalog_index.json"):
        """Save catalog index to file."""
        
        index_file = self.catalog_path / filename
        
        try:
            with open(index_file, 'w', encoding='utf-8') as f:
                json.dump(catalog, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved catalog index to {index_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving catalog index: {e}")
            return False
    
    def generate_and_save(self, filename: str = "catalog_index.json") -> bool:
        """Generate and save catalog index."""
        
        try:
            catalog = self.generate_index()
            return self.save_index(catalog, filename)
            
        except Exception as e:
            logger.error(f"Error generating catalog index: {e}")
            return False

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate OpenMed Catalog Index")
    parser.add_argument(
        "--catalog-path", 
        default="catalog",
        help="Path to catalog directory (default: catalog)"
    )
    parser.add_argument(
        "--output", 
        default="catalog_index.json",
        help="Output filename (default: catalog_index.json)"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        generator = CatalogIndexGenerator(args.catalog_path)
        success = generator.generate_and_save(args.output)
        
        if success:
            logger.info("Catalog index generated successfully")
            return 0
        else:
            logger.error("Failed to generate catalog index")
            return 1
            
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1

if __name__ == "__main__":
    main() 