# OpenMed - Open Source Medical Catalog

<div align="center">
  <img src="assets/logo.png" alt="OpenMed Logo" width="200"/>
  
  **Simple, Accurate, and Efficient Medical Catalog System**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
  [![Next.js](https://img.shields.io/badge/Next.js-15.4+-black.svg)](https://nextjs.org)
</div>

## What is OpenMed?

OpenMed is a comprehensive open-source medical catalog system designed specifically for the Israeli healthcare system. It provides both a REST API for programmatic access and a modern web interface for easy browsing and management of medication data.

### Key Features

- 🏥 **Israeli Healthcare Focus**: Specialized for Israeli medical regulations and standards
- 🔍 **Advanced Search**: Find medications by name, manufacturer, status, and category
- 🔧 **REST API**: Simple endpoints for integration with other systems
- 📊 **Comprehensive Data**: Detailed medication information including composition, pricing, and clinical data

## Project Structure

```
OpenMed/
├── api/                      # Python Flask REST API
│   └── app.py
├── catalog/                  # Generated medication data
│   ├── *.json               # Individual medication files
│   └── catalog_index.json   # Search index
├── schema/                   # JSON schemas
│   └── openmed_medication.schema.json
└── assets/                   # Logo
├── generate_catalog_index.py # Script to generate catalog index
```

## Quick Start

### Prerequisites

- **Python 3.8+** (for API)
- **1GB RAM minimum**
- **100MB disk space**

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/formidablecare/openmed.git
cd openmed

# Setup Python environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Generate Catalog Data

```bash
# From project root
python generate_catalog_index.py
```

### 3. Start the Services

#### Start the API Server

```bash
# From project root
python api/app.py
```

API will be available at `http://localhost:5001`

### API Endpoints

| Endpoint            | Method | Description                     |
| ------------------- | ------ | ------------------------------- |
| `/medications`      | GET    | List medications (with filters) |
| `/medications/{id}` | GET    | Get specific medication         |
| `/manufacturers`    | GET    | Get all manufacturers           |
| `/categories`       | GET    | Get all categories              |
| `/health`           | GET    | Health check                    |

#### Example API Usage

```bash
# Search for medications
curl "http://localhost:5001/medications?search=amoxicillin"

# Get specific medication
curl "http://localhost:5001/medications/MOH_12345"

# Filter by status and category
curl "http://localhost:5001/medications?status=active&category=Antibiotics"
```

## Data Schema

Schema is available in the [schema](schema/openmed_medication.schema.json) file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Sponsors

<div align="center">
  <a href="https://formidable.care">
    <img src="https://formidable.care/logo.png" alt="Formidable Logo" width="200"/>
  </a>
</div>
