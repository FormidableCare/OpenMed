<div align="center">
  <h1>OpenMed - Open Source Medical Catalog</h1>
  
  <img src="assets/logo.png" alt="OpenMed Logo" width="200"/>
  
  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-green.svg)](https://www.gnu.org/licenses/agpl-3.0)
  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
</div>

## What is OpenMed?

OpenMed is a comprehensive open-source medical catalog system designed specifically for the Israeli healthcare system. It provides both a REST API for programmatic access and a modern web interface for easy browsing and management of medication data. 

Explore the platform here: [🔗 OpenMed Dashboard](https://openmed.formidable.care)

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
├── catalog/                  # Individual medication data
│   └── *.json               # Medication files
├── db/                       # Database indexes
│   └── catalog-list/         # Catalog indexes
│       ├── catalog_index.json
│       └── catalog_index.csv
├── schema/                   # JSON schemas
│   └── openmed_medication.schema.json
├── assets/                   # Logo
└── generate_catalog_index.py # Script to generate catalog index
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

## Automated Workflows

### Catalog Index Auto-Generation

This repository includes a GitHub Action that automatically generates and commits the `catalog_index.json` file whenever catalog files are modified.

**How it works:**

- Triggers on pushes and pull requests to `main` and `develop` branches
- Only runs when files in the `catalog/` directory change (excluding `db/` directory)
- Automatically runs the `generate_catalog_index.py` script
- Generates catalog index in JSON and CSV formats
- Commits and pushes the updated index if changes are detected
- Uses `[skip ci]` in commit messages to prevent infinite loops
- Commits are made by the OpenMed Bot (`openmed@formidable.care`)

**Generated files:**

- `db/catalog-list/catalog_index.json` - Main catalog index
- `db/catalog-list/catalog_index.csv` - Catalog index in CSV format

**Workflow file:** `.github/workflows/update-catalog-index.yml`

**Manual trigger:** You can also manually trigger this workflow from the GitHub Actions tab.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

The AGPL-3.0 license ensures that:

- All modifications to this medical catalog system remain open source
- Network use (like your REST API) is treated as distribution, requiring source code availability
- Any improvements made to the system must be shared back with the community
- This protects the integrity and transparency of healthcare data systems

## Sponsors

<div align="center">
  <a href="https://formidable.care">
    <img src="https://formidable.care/logo.png" alt="Formidable Logo" width="200"/>
  </a>
</div>
