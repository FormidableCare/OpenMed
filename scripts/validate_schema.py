#!/usr/bin/env python3
"""
Validate generated JSON files against OpenMed schema
"""

import json
import jsonschema
from pathlib import Path
import sys

def validate_json_files():
    """Validate all JSON files in the catalog against the schema."""
    
    # Load schema
    schema_path = Path("../../OpenMed/schema/openmed_medication.schema.json")
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema = json.load(f)
    
    # Get all JSON files
    catalog_path = Path("../../OpenMed/catalog")
    json_files = list(catalog_path.glob("*.json"))
    
    print(f"Validating {len(json_files)} JSON files against OpenMed schema...")
    
    valid_count = 0
    invalid_count = 0
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Validate against schema
            jsonschema.validate(instance=data, schema=schema)
            valid_count += 1
            print(f"✓ {json_file.name} - Valid")
            
        except jsonschema.exceptions.ValidationError as e:
            invalid_count += 1
            print(f"✗ {json_file.name} - Invalid: {e.message}")
        except Exception as e:
            invalid_count += 1
            print(f"✗ {json_file.name} - Error: {e}")
    
    print(f"\nValidation complete:")
    print(f"Valid files: {valid_count}")
    print(f"Invalid files: {invalid_count}")
    
    return invalid_count == 0

if __name__ == "__main__":
    success = validate_json_files()
    sys.exit(0 if success else 1) 