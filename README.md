# OpenMed - Open Source Medical Catalog for Israel

OpenMed is a simple, accurate, and efficient open-source medical catalog system for Israel. It provides a clean REST API for serving medication data with search and filtering capabilities.

## Project Structure

```
OpenMed/
├── catalog/                    # Generated catalog files
│   ├── MOH_12345.json         # Individual medication files
│   └── catalog_index.json     # Catalog index
├── scripts/                    # Public scripts
│   └── generate_catalog_index.py # Generate catalog index
├── api/                        # REST API
│   └── app.py
├── schema/                     # JSON schemas
│   └── openmed_medication.schema.json
└── .gitignore
```

## Features

- **REST API**: Simple endpoints for medication data
- **Search & Filter**: Find medications by name, manufacturer, status, category
- **Israeli Context**: Specialized for Israeli healthcare system
- **Clean Data**: Standardized JSON format for medication information

## Requirements

### Python Dependencies

```bash
# Core data processing
pandas>=1.5.0
numpy>=1.21.0

# Web framework
Flask>=2.3.0
Flask-CORS>=4.0.0

# JSON validation
jsonschema>=4.17.0

# HTTP requests
requests>=2.28.0

# Logging and configuration
python-dotenv>=1.0.0
```

### System Requirements

- Python 3.8+
- 1GB RAM minimum
- 100MB disk space

## Quick Start

### 1. Setup Environment

```bash
# Clone repository
git clone https://github.com/formidablecare/openmed.git
cd openmed

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install pandas>=1.5.0 numpy>=1.21.0 Flask>=2.3.0 Flask-CORS>=4.0.0 jsonschema>=4.17.0 requests>=2.28.0 python-dotenv>=1.0.0
```

### 2. Generate Catalog Index

```bash
# Create catalog index for API
python scripts/generate_catalog_index.py
```

### 3. Start API Server

```bash
# Start the REST API
python api/app.py
```

The API will be available at `http://localhost:5001`

## API Usage

### Find Medication by Name

```bash
# Search for medications containing "amoxicillin"
curl "http://localhost:5001/medications?search=amoxicillin"

# Search for exact medication name
curl "http://localhost:5001/medications?search=Amoxicillin%20500mg%20capsule"
```

### Get All Manufacturers

```bash
curl http://localhost:5001/manufacturers
```

### Filter by Status and Categories

```bash
# Get all active antibiotics
curl "http://localhost:5001/medications?status=active&category=Antibiotics"

# Get all active medications from Teva
curl "http://localhost:5001/medications?status=active&search=Teva&field=manufacturer.name"
```

### List All Medications

```bash
# Get all medications
curl http://localhost:5001/medications

# Get first 10 medications
curl "http://localhost:5001/medications?limit=10"

# Search for medications containing "amoxicillin"
curl "http://localhost:5001/medications?search=amoxicillin"
```

## API Endpoints

| Endpoint            | Method | Description                     |
| ------------------- | ------ | ------------------------------- |
| `/`                 | GET    | API information and endpoints   |
| `/medications`      | GET    | List medications (with filters) |
| `/medications/{id}` | GET    | Get specific medication         |
| `/manufacturers`    | GET    | Get all manufacturers           |
| `/categories`       | GET    | Get all categories              |
| `/statuses`         | GET    | Get all statuses                |
| `/health`           | GET    | Health check                    |

### Query Parameters

- `limit` - Number of results (default: 100)
- `offset` - Pagination offset (default: 0)
- `search` - Search query
- `field` - Search field (default: 'name')
- `status` - Filter by status
- `category` - Filter by category

## Data Schema

Each medication follows the `OpenMedMedication` schema with fields:

```json
{
  "resourceType": "OpenMedMedication",
  "id": "MOH_12345",
  "product": {
    "name": "Amoxicillin 500mg capsule",
    "form": "capsule"
  },
  "composition": [
    {
      "substance": "Amoxicillin",
      "baseEquivalent": {
        "value": 500.0,
        "unit": "mg"
      }
    }
  ],
  "standardCodes": {
    "moh": "MOH_12345",
    "yarpa": "YAR123",
    "pharmasoft": "PH5678",
    "atc": {
      "code": "J01CA04",
      "description": "Amoxicillin"
    },
    "snomed": {
      "code": "372687004",
      "description": "Amoxicillin 500mg capsule"
    }
  },
  "manufacturer": {
    "name": "Teva Pharmaceuticals",
    "country": "IL"
  },
  "category": "Antibiotics",
  "status": "active"
}
```

## Development

### Running Tests

```bash
# Test API endpoints
curl http://localhost:5001/health
curl http://localhost:5001/medications?limit=1
```

### Code Quality

```bash
# Format code
black api/ scripts/

# Check syntax
python -m py_compile api/*.py scripts/*.py
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**OpenMed - Simple, Accurate, and Efficient Medical Catalog 🎯**
