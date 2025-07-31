#!/usr/bin/env python3
"""
OpenMed REST API
Provides endpoints to serve medication JSON files.
Uses optimized catalog index for better performance.
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
CATALOG_DIR = Path("../catalog")
DB_DIR = Path("../db")
CATALOG_INDEX_DIR = DB_DIR / "catalog-list"
CATALOG_INDEX_FILE = CATALOG_INDEX_DIR / "catalog_index.json"

class MedicationAPI:
    """API handler for medication operations."""
    
    def __init__(self, catalog_dir: Path = CATALOG_DIR, index_file: Path = CATALOG_INDEX_FILE):
        self.catalog_dir = catalog_dir
        self.index_file = index_file
        self.catalog_index = None
        self._load_catalog_index()
    
    def _load_catalog_index(self) -> None:
        """Load the catalog index for fast lookups."""
        try:
            if self.index_file.exists():
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.catalog_index = data.get("catalog_index", {})
                    logger.info(f"Loaded catalog index with {self.catalog_index.get('total_medications', 0)} medications")
            else:
                logger.warning(f"Catalog index not found at {self.index_file}")
                self.catalog_index = {"medications": [], "total_medications": 0}
        except Exception as e:
            logger.error(f"Error loading catalog index: {e}")
            self.catalog_index = {"medications": [], "total_medications": 0}
    
    def get_medication(self, medication_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific medication by ID."""
        json_file = self.catalog_dir / f"{medication_id}.json"
        
        if not json_file.exists():
            return None
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading medication {medication_id}: {e}")
            return None
    
    def list_medications(self, limit: int = 100, offset: int = 0, 
                        search: str = None, field: str = "name",
                        status: str = None, category: str = None) -> List[Dict[str, Any]]:
        """List medications using the catalog index for fast filtering."""
        if not self.catalog_index or "medications" not in self.catalog_index:
            return []
        
        medications = self.catalog_index["medications"]
        
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
        """Get all unique manufacturers from the catalog index."""
        if not self.catalog_index or "medications" not in self.catalog_index:
            return []
        
        manufacturers = set()
        
        for medication in self.catalog_index["medications"]:
            # Note: manufacturer info might not be in the index, so we'll need to load full medication
            medication_id = medication.get("catalogId")
            if medication_id:
                full_medication = self.get_medication(medication_id)
                if full_medication:
                    manufacturer = full_medication.get('manufacturer', {}).get('name', '')
                    if manufacturer:
                        manufacturers.add(manufacturer)
        
        return sorted(list(manufacturers))
    
    def get_all_categories(self) -> List[str]:
        """Get all unique categories from the catalog index."""
        if not self.catalog_index or "medications" not in self.catalog_index:
            return []
        
        categories = set()
        
        for medication in self.catalog_index["medications"]:
            category = medication.get('category', '')
            if category:
                categories.add(category)
        
        return sorted(list(categories))
    
    def get_all_statuses(self) -> List[str]:
        """Get all unique statuses from the catalog index."""
        if not self.catalog_index or "medications" not in self.catalog_index:
            return []
        
        statuses = set()
        
        for medication in self.catalog_index["medications"]:
            status = medication.get('status', '')
            if status:
                statuses.add(status)
        
        return sorted(list(statuses))
    
    def get_catalog_stats(self) -> Dict[str, Any]:
        """Get catalog statistics."""
        if not self.catalog_index:
            return {"total_medications": 0, "version": "unknown", "generated_at": "unknown"}
        
        return {
            "total_medications": self.catalog_index.get("total_medications", 0),
            "version": self.catalog_index.get("version", "unknown"),
            "generated_at": self.catalog_index.get("generated_at", "unknown")
        }

# Initialize API handler
api = MedicationAPI()

@app.route('/')
def index():
    """API root endpoint."""
    stats = api.get_catalog_stats()
    
    return jsonify({
        "name": "OpenMed API",
        "version": "1.0",
        "description": "REST API for OpenMed Israel Medical Catalog",
        "catalog_stats": stats,
        "endpoints": {
            "GET /medications": "List all medications (with optional search, filtering, and pagination)",
            "GET /medications/{id}": "Get specific medication",
            "GET /manufacturers": "Get all manufacturers",
            "GET /categories": "Get all categories",
            "GET /statuses": "Get all statuses",
            "GET /health": "Health check",
            "GET /stats": "Get catalog statistics"
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

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get catalog statistics."""
    stats = api.get_catalog_stats()
    
    return jsonify(stats)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    stats = api.get_catalog_stats()
    medication_files = [f for f in CATALOG_DIR.glob("*.json")]
    
    return jsonify({
        "status": "healthy",
        "catalog_dir": str(CATALOG_DIR),
        "index_file": str(CATALOG_INDEX_FILE),
        "medications_count": stats.get("total_medications", 0),
        "total_files": len(medication_files),
        "catalog_version": stats.get("version", "unknown"),
        "last_generated": stats.get("generated_at", "unknown")
    })

if __name__ == '__main__':
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 