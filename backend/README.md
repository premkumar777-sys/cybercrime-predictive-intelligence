Backend FastAPI app.

Run locally:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic
uvicorn app.main:app --reload --port 8000
```
