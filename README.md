KNow first ??

WHAT are we building?
WHY are we building it?
HOW does it work?
WHAT technologies are we using?
WHAT does each component do?
HOW do components communicate?
WHAT will the prototype demonstrate?
WHAT are our limitations?

# Predictive Cybercrime Intelligence Platform

## 1. Problem

Cybercrime complaints involving financial fraud can involve rapid movement of funds followed by cash withdrawal.

The objective of this project is to develop a predictive analytics framework that analyzes available cybercrime complaint and transaction information to identify and rank candidate locations where a cash withdrawal may potentially occur.

The system is intended to generate **actionable intelligence for timely investigation and intervention**.

---

# 2. Core Idea

Our system follows:

Complaint
→ Transaction Intelligence
→ Pattern Analysis
→ Temporal + Spatial + Relational Features
→ Candidate Location Scoring
→ Ranked Withdrawal Locations
→ Explainable Intelligence
→ Law-Enforcement Dashboard

The system is a **decision-support tool**.

It does not claim to deterministically know where a criminal will withdraw money.

---

# 3. Prototype Objective

The internal-round prototype will demonstrate a complete end-to-end workflow:

1. Create a cybercrime complaint/case.
2. Associate transaction information with the case.
3. Analyze transaction and behavioral features.
4. Generate candidate cash-withdrawal locations.
5. Rank candidate locations using a risk-scoring/prediction engine.
6. Display predicted locations on a map.
7. Explain why a location received a high ranking.
8. Generate actionable intelligence for investigators.

---

# 4. Core Intelligence Dimensions

## 4.1 Temporal Intelligence

Analyze patterns related to:

* transaction time
* transaction frequency
* time intervals
* historical activity windows
* expected withdrawal time window

## 4.2 Spatial Intelligence

Analyze:

* candidate withdrawal locations
* geographic proximity
* location characteristics
* historical location patterns
* geographic clustering

## 4.3 Transaction Intelligence

Analyze:

* transaction amount
* transaction sequence
* transaction frequency
* account relationships
* movement of funds

## 4.4 Relational / Graph Intelligence

Represent relationships such as:

Victim
→ Account
→ Transaction
→ Beneficiary
→ Account
→ Candidate Withdrawal Location

This allows the system to analyze relationships rather than treating every transaction as an isolated record.

---

# 5. System Architecture

```text
                    CYBERCRIME COMPLAINT
                            |
                            v
                  +--------------------+
                  |   Data Ingestion   |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  | Data Processing    |
                  | & Feature Creation |
                  +---------+----------+
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
        Temporal        Transaction      Spatial
        Features         Features       Features
             |              |              |
             +--------------+--------------+
                            |
                            v
                  +--------------------+
                  | Prediction / Risk  |
                  | Scoring Engine     |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  | Candidate Location |
                  | Ranking             |
                  +---------+----------+
                            |
             +--------------+--------------+
             |                             |
             v                             v
       Explainability                  GIS / Map
             |                             |
             +--------------+--------------+
                            |
                            v
                  +--------------------+
                  | Intelligence       |
                  | Dashboard          |
                  +--------------------+
                            |
                            v
                  INVESTIGATIVE SUPPORT
```

---

# 6. Technology Stack

## Frontend

* React
* Tailwind CSS
* component libraries where useful
* interactive charts
* Leaflet / OpenStreetMap for maps

## Backend

* Python
* FastAPI
* REST APIs

## Data / Database

* PostgreSQL
* Pandas
* SQLAlchemy where required

## Machine Learning

Initial prototype:

* Scikit-learn
* Random Forest / Gradient Boosting
* XGBoost where useful

Potential advanced layer:

* graph-based features
* anomaly detection
* temporal modeling
* Graph Neural Networks if justified by available data

## Graph Intelligence

Potential technologies:

* Neo4j
* Neo4j Graph Data Science
* NetworkX for lightweight experimentation

## Geospatial

* Leaflet
* OpenStreetMap
* GeoPandas where required
* spatial-distance calculations

## AI Layer

AI-assisted development and intelligence features may use:

* Gemini API
* other approved LLM APIs where useful

LLMs will not be treated as the primary predictive model for financial-location prediction.

They may assist with:

* case summarization
* explanation generation
* intelligence-report drafting
* natural-language querying
* analyst assistance

---

# 7. AI-Assisted Development Strategy

Because the project has a limited development window, the team will use AI-assisted development extensively.

AI tools may be used for:

* frontend generation
* backend scaffolding
* API generation
* database schema generation
* debugging
* test generation
* documentation
* UI refinement
* data analysis
* research assistance
* code review
* refactoring
* deployment configuration

Generated code must still be reviewed and tested by the team.

---

# 8. Prototype Data Strategy

Real banking and law-enforcement datasets are not assumed to be available for the prototype.

The prototype will use:

* synthetic transaction data
* publicly available datasets where applicable
* synthetic candidate-location data

The prototype validates the **technical pipeline**, not real-world predictive performance.

Production deployment would require authorized data access and appropriate privacy, security and legal controls.

---

# 9. Prediction Strategy

The first prototype will use a transparent scoring/ranking approach.

Candidate locations receive scores based on available features such as:

* temporal similarity
* transaction-pattern similarity
* geographic relevance
* historical pattern features
* relational/graph features where available

Example:

```text
ATM-A → 0.86
ATM-B → 0.71
ATM-C → 0.53
```

These values represent prototype risk scores.

They must not be presented as calibrated real-world probabilities unless validated appropriately.

---

# 10. Explainability

Every prediction should provide supporting factors.

Example:

Prediction:

ATM-A — Rank #1

Possible contributing factors:

* strong temporal similarity
* geographic relevance
* similar transaction pattern
* connected suspicious transaction path
* historical pattern similarity

The system should answer:

> "Why was this location ranked highly?"

rather than only displaying a score.

---

# 11. API Architecture

Core APIs:

```text
POST /cases

GET /cases/{case_id}

POST /cases/{case_id}/analyze

GET /cases/{case_id}/predictions

GET /locations

GET /health
```

The frontend and intelligence engine will communicate through defined API contracts.

---

# 12. Core Prediction Response

Example:

```json
{
  "case_id": "CASE001",
  "risk_level": "HIGH",
  "predictions": [
    {
      "location_id": "ATM001",
      "location_name": "ATM Central",
      "risk_score": 0.86,
      "rank": 1,
      "time_window": "18:00-20:00",
      "explanation": [
        "Strong temporal similarity",
        "High geographic relevance",
        "Similar transaction pattern"
      ]
    }
  ]
}
```

---

# 13. Golden Demo

The entire team will build around one integrated demonstration.

### Scenario

A victim reports a ₹75,000 fraudulent transaction.

### Flow

```text
Complaint
   ↓
Case Creation
   ↓
Transaction Analysis
   ↓
Risk Analysis
   ↓
Candidate Location Generation
   ↓
Location Ranking
   ↓
Map Visualization
   ↓
Explainable Prediction
   ↓
Actionable Intelligence Report
```

The Golden Demo is the primary definition of a working prototype.

---

# 14. Team Integration Principle

We are not building six independent projects.

We are building **one integrated system**.

Every component must have:

* defined input
* defined output
* defined interface
* integration test

A component is not considered complete merely because its internal code works.

It is complete when it works with the next component in the system.

---

# 15. Development Order

The project will be developed using a vertical-slice approach.

### Stage 1

Frontend
→ Backend
→ Dummy prediction
→ Result

### Stage 2

Replace dummy prediction with actual scoring engine.

### Stage 3

Add geographic visualization.

### Stage 4

Add explainability.

### Stage 5

Add advanced ML / graph features where time permits.

### Stage 6

Testing + demonstration.

Advanced features must never break the working Golden Demo.

---

# 16. Repository Structure

```text
cybercrime-predictive-intelligence/
│
├── frontend/
├── backend/
├── ml/
├── data/
├── gis/
├── research/
├── docs/
│
├── API_CONTRACT.md
├── DATA_SCHEMA.md
├── PROJECT_TRUTH.md
├── README.md
└── docker-compose.yml
```

---

# 17. Project Truth

The following claims must remain accurate during the presentation:

* Prototype data may be synthetic/public.
* Real banking integration is not assumed.
* Real police-system integration is not assumed.
* Predictions are ranked candidate locations.
* Prototype scores are not automatically real-world probabilities.
* The system is intended as investigative decision support.
* Real-world deployment requires authorized data and appropriate security/privacy controls.

---

# 18. Success Criteria

The internal prototype is successful if an evaluator can see:

1. A complaint being created.
2. Transaction information being analyzed.
3. A risk assessment being generated.
4. Candidate locations being ranked.
5. Locations appearing on a map.
6. Reasons supporting the ranking.
7. A clear actionable intelligence output.
8. The entire workflow operating as one integrated system.

---

# 19. Development Philosophy

Prioritize:

**Working integrated system > isolated sophisticated modules**

**Demonstrable intelligence > unnecessary features**

**Evidence-backed claims > exaggerated claims**

**AI-assisted productivity > manual boilerplate**

**Explainability > black-box predictions**

**Integration > individual module perfection**

**Real-world feasibility > technology hype**

## Technology Stack

| Job | Tool | How we'll use it |
| --- | --- | --- |
| Main coding | **Cursor** | AI-assisted multi-file development |
| Agentic coding | **Claude Code** | Large repo changes/debugging |
| GitHub integration | **GitHub Copilot** | Code assistance + review |
| Rapid UI | **Google AI Studio / Lovable** | Generate/refine prototype UI |
| AI capabilities | **Gemini API** | Analyst/report/explanation features |
| Database/backend acceleration | **Supabase** | PostgreSQL/auth/storage if useful |
| Maps | **Leaflet + OpenStreetMap** | GIS visualization |
| ML | **Python + Scikit-learn/XGBoost** | Actual predictive engine |
| Graph | **Neo4j** | Transaction relationships |
| Research | **Google Scholar + Perplexity/ChatGPT** | Papers and competitive research |
| API testing | **Postman/Bruno** | Test integration |
| UI testing | **Playwright** | Automated browser tests |
| Deployment | **Vercel/Cloud Run/Render** | Fast prototype deployment |

