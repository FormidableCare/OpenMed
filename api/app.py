#!/usr/bin/env python3
"""
OpenMed REST API
Provides endpoints to serve medication JSON files.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
OUTPUT_DIR = Path("catalog")

class MedicationAPI:
    """API handler for medication operations."""
    
    def __init__(self, output_dir: Path = OUTPUT_DIR):
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
    
    def get_medication(self, medication_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific medication by ID."""
        json_file = self.output_dir / f"{medication_id}.json"
        
        if not json_file.exists():
            return None
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading medication {medication_id}: {e}")
            return None
    
    def _load_all_medications(self) -> List[Dict[str, Any]]:
        """Load all medication files."""
        json_files = list(self.output_dir.glob("*.json"))
        medication_files = [f for f in json_files if f.stem.startswith('MOH_')]
        medications = []
        
        for json_file in medication_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    medication = json.load(f)
                medications.append(medication)
            except Exception as e:
                logger.error(f"Error reading {json_file}: {e}")
        
        return medications
    
    def list_medications(self, limit: int = 100, offset: int = 0, 
                        search: str = None, field: str = "name",
                        status: str = None, category: str = None) -> List[Dict[str, Any]]:
        """List medications with optional search, filtering, and pagination."""
        medications = self._load_all_medications()
        
        # Apply search if provided
        if search:
            search_lower = search.lower()
            filtered_medications = []
            
            for medication in medications:
                # Search in specified field
                search_value = medication.get(field, "")
                if isinstance(search_value, list):
                    search_value = " ".join(search_value)
                
                if search_lower in str(search_value).lower():
                    filtered_medications.append(medication)
            
            medications = filtered_medications
        
        # Apply status filter
        if status:
            medications = [m for m in medications if m.get('status', '').lower() == status.lower()]
        
        # Apply category filter
        if category:
            medications = [m for m in medications if m.get('category', '').lower() == category.lower()]
        
        # Apply pagination
        start_idx = offset
        end_idx = min(start_idx + limit, len(medications))
        
        return medications[start_idx:end_idx]
    
    def get_all_manufacturers(self) -> List[str]:
        """Get all unique manufacturers."""
        medications = self._load_all_medications()
        manufacturers = set()
        
        for medication in medications:
            manufacturer = medication.get('manufacturer', {}).get('name', '')
            if manufacturer:
                manufacturers.add(manufacturer)
        
        return sorted(list(manufacturers))
    
    def get_all_categories(self) -> List[str]:
        """Get all unique categories."""
        medications = self._load_all_medications()
        categories = set()
        
        for medication in medications:
            category = medication.get('category', '')
            if category:
                categories.add(category)
        
        return sorted(list(categories))
    
    def get_all_statuses(self) -> List[str]:
        """Get all unique statuses."""
        medications = self._load_all_medications()
        statuses = set()
        
        for medication in medications:
            status = medication.get('status', '')
            if status:
                statuses.add(status)
        
        return sorted(list(statuses))

# Initialize API handler
api = MedicationAPI()

@app.route('/')
def index():
    """API root endpoint."""
    return jsonify({
        "name": "OpenMed API",
        "version": "1.0",
        "description": "REST API for OpenMed Israel Medical Catalog",
        "endpoints": {
            "GET /medications": "List all medications (with optional search, filtering, and pagination)",
            "GET /medications/{id}": "Get specific medication",
            "GET /manufacturers": "Get all manufacturers",
            "GET /categories": "Get all categories",
            "GET /statuses": "Get all statuses",
            "GET /health": "Health check"
        },
        "query_parameters": {
            "limit": "Number of medications to return (default: 100)",
            "offset": "Number of medications to skip (default: 0)",
            "search": "Search query to filter medications",
            "field": "Field to search in (default: 'name')",
            "status": "Filter by status",
            "category": "Filter by category"
        }
    })

@app.route('/medications', methods=['GET'])
def list_medications():
    """List medications with optional search, filtering, and pagination."""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    search = request.args.get('search', None)
    field = request.args.get('field', 'name')
    status = request.args.get('status', None)
    category = request.args.get('category', None)
    
    medications = api.list_medications(
        limit=limit, 
        offset=offset, 
        search=search, 
        field=field,
        status=status,
        category=category
    )
    
    return jsonify({
        "medications": medications,
        "total": len(medications),
        "limit": limit,
        "offset": offset,
        "search": search,
        "field": field,
        "status": status,
        "category": category
    })

@app.route('/medications/<medication_id>', methods=['GET'])
def get_medication(medication_id):
    """Get a specific medication."""
    medication = api.get_medication(medication_id)
    
    if medication is None:
        return jsonify({"error": "Medication not found"}), 404
    
    return jsonify(medication)

@app.route('/manufacturers', methods=['GET'])
def get_manufacturers():
    """Get all manufacturers."""
    manufacturers = api.get_all_manufacturers()
    
    return jsonify({
        "manufacturers": manufacturers,
        "total": len(manufacturers)
    })

@app.route('/categories', methods=['GET'])
def get_categories():
    """Get all categories."""
    categories = api.get_all_categories()
    
    return jsonify({
        "categories": categories,
        "total": len(categories)
    })

@app.route('/statuses', methods=['GET'])
def get_statuses():
    """Get all statuses."""
    statuses = api.get_all_statuses()
    
    return jsonify({
        "statuses": statuses,
        "total": len(statuses)
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    medication_files = [f for f in OUTPUT_DIR.glob("*.json") if f.stem.startswith('MOH_')]
    
    return jsonify({
        "status": "healthy",
        "catalog_dir": str(OUTPUT_DIR),
        "medications_count": len(medication_files),
        "total_files": len(list(OUTPUT_DIR.glob("*.json")))
    })

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 