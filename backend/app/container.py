from pathlib import Path
from .repositories.repository import Repository
from .services.prediction_service import MockPredictionService

DATA_FILE = Path(__file__).resolve().parents[2] / "data_store.json"

repo = Repository(data_file=str(DATA_FILE))
predictor = MockPredictionService()
