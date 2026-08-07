# OpenMed

OpenMed is a medication terminology interoperability service from
FormidableCare.

It maps medication identifiers between hospital systems, pharmacy catalogs, and
standardized clinical terminologies such as SNOMED CT and ATC.

## Cross-catalog mapping

Submit a medication identifier from a source catalog and select the catalog you
want to target.

- `system` identifies the source catalog.
- `value` is the medication identifier in that catalog.
- `catalogPreference` selects the target catalog.
- Matching entries are returned in the `mappings` array.

## Hospital medication to SNOMED CT

### Request

```bash
curl --request POST \
  "$OPENMED_API_URL/api/v1/mappings/batch" \
  --header "Authorization: $OPENMED_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "medications": [
      {
        "system": "hospital",
        "value": "Hospital-Internal-ID" 
      }
    ],
    "catalogPreference": "snomed_ct"
  }'
```

### Response

```json
{
  "results": [
    {
      "medication": {
        "system": "hospital",
        "id": "Hospital-Internal-ID"
      },
      "mappings": [
        {
          "system": "snomed_ct",
          "id": "322236009",
          "name": "Paracetamol 500 mg conventional release oral tablet"
        }
      ]
    }
  ],
  "filters": {
    "catalogPreference": "snomed_ct"
  }
}
```

[View the concept example in the SNOMED CT specification](https://docs.snomed.org/snomed-ct-specifications/snomed-ct-release-file-specification/component-release-file-specification/4.2-file-format-specifications/4.2.6-concrete-value-file-specification)

## Hospital medication to ATC

The same hospital medication can be mapped to its ATC classification by changing
the target catalog.

### Request

```bash
curl --request POST \
  "$OPENMED_API_URL/api/v1/mappings/batch" \
  --header "Authorization: $OPENMED_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "medications": [
      {
        "system": "hospital",
        "value": "HOSP-MED-1042"
      }
    ],
    "catalogPreference": "atc"
  }'
```

### Response

```json
{
  "results": [
    {
      "medication": {
        "system": "hospital",
        "id": "HOSP-MED-1042"
      },
      "mappings": [
        {
          "system": "atc",
          "id": "N02BE01",
          "name": "Paracetamol"
        }
      ]
    }
  ],
  "filters": {
    "catalogPreference": "atc"
  }
}
```

[View N02BE01 in the WHO ATC/DDD Index](https://atcddd.fhi.no/atc_ddd_index/?code=N02BE01&showdescription=yes)


## How mapping works

OpenMed can evaluate medication information such as:

- Local catalog identifiers
- Medication and active-ingredient names
- Strength and strength unit
- Dose form and release characteristics
- Administration route
- Relationships already established between catalogs
- Human-reviewed mapping decisions

The available catalogs and mapping workflow depend on each integration.

## Batch mapping

Multiple medications can be submitted in one request:

```json
{
  "medications": [
    {
      "system": "hospital",
      "value": "HOSP-MED-1042"
    },
    {
      "system": "hospital",
      "value": "HOSP-MED-2084"
    }
  ],
  "catalogPreference": "snomed_ct"
}
```

Each source medication is returned with its corresponding `mappings` array. If
no suitable mapping is available, the array is empty.

## API access

The OpenMed API requires an API key.

The source catalog identifier used for a hospital integration is provided during
onboarding. The generic `hospital` identifier in this README is illustrative.

[Contact Formidable Care](https://formidable.care/contact?interest=openmed) to discuss API access and catalog integrations.

SNOMED CT, ATC, and third-party catalog content remain subject to their
respective licenses and terms. This repository does not distribute licensed
terminology datasets.
