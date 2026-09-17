import hashlib
import json
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import CaseModel, PredictionModel, BlockchainAuditModel

class BlockchainService:
    GENESIS_PREV_HASH = "0" * 64

    @staticmethod
    def canonical_json(data: dict) -> str:
        """Produce deterministic, sorted JSON string for reliable SHA-256 hashing."""
        return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)

    @classmethod
    def compute_payload_hash(cls, data: dict) -> str:
        """Compute SHA-256 hash of the canonical serialized payload."""
        canonical_str = cls.canonical_json(data)
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    @classmethod
    def compute_block_hash(cls, index: int, prev_hash: str, payload_hash: str, timestamp_str: str) -> str:
        """Compute SHA-256 hash of the complete block header."""
        header = f"{index}:{prev_hash}:{payload_hash}:{timestamp_str}"
        return hashlib.sha256(header.encode("utf-8")).hexdigest()

    @classmethod
    def compute_merkle_root(cls, hashes: list[str]) -> str:
        """Calculate Merkle Root hash from a list of block hashes."""
        if not hashes:
            return hashlib.sha256(b"EMPTY_CHAIN").hexdigest()
        
        current_layer = list(hashes)
        while len(current_layer) > 1:
            next_layer = []
            for i in range(0, len(current_layer), 2):
                h1 = current_layer[i]
                h2 = current_layer[i + 1] if i + 1 < len(current_layer) else h1
                combined = hashlib.sha256((h1 + h2).encode("utf-8")).hexdigest()
                next_layer.append(combined)
            current_layer = next_layer
        return current_layer[0]

    def record_event(
        self,
        db: Session,
        case_id: str,
        event_type: str,
        actor: str,
        event_data: dict
    ) -> BlockchainAuditModel:
        """
        Record a real event into the immutable blockchain audit trail.
        Chains with the previous block for this case.
        """
        latest = (
            db.query(BlockchainAuditModel)
            .filter(BlockchainAuditModel.case_id == case_id)
            .order_by(BlockchainAuditModel.block_index.desc())
            .first()
        )

        now = datetime.utcnow()
        timestamp_str = now.isoformat()

        if latest is None:
            block_index = 1
            previous_hash = self.GENESIS_PREV_HASH
        else:
            block_index = latest.block_index + 1
            previous_hash = latest.block_hash

        payload_hash = self.compute_payload_hash(event_data)
        block_hash = self.compute_block_hash(block_index, previous_hash, payload_hash, timestamp_str)

        block = BlockchainAuditModel(
            case_id=case_id,
            block_index=block_index,
            event_type=event_type,
            timestamp=now,
            actor=actor,
            payload_hash=payload_hash,
            previous_hash=previous_hash,
            block_hash=block_hash,
            event_data=event_data
        )

        db.add(block)
        db.commit()
        db.refresh(block)
        return block

    def ensure_case_chained(self, db: Session, case_id: str):
        """Auto-synchronize real case & prediction state into the blockchain ledger if missing."""
        existing_blocks = (
            db.query(BlockchainAuditModel)
            .filter(BlockchainAuditModel.case_id == case_id)
            .count()
        )
        if existing_blocks > 0:
            return

        case = db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
        if not case:
            return

        # Record Genesis Case Registration Block from live DB data
        case_payload = {
            "case_id": case.case_id,
            "fraud_type": case.fraud_type,
            "amount": float(case.amount),
            "destination_account": case.destination_account,
            "transaction_time": str(case.transaction_time),
            "created_at": str(case.created_at)
        }
        self.record_event(
            db=db,
            case_id=case_id,
            event_type="CASE_REGISTERED",
            actor="CITIZEN_OR_PORTAL_REGISTRATION",
            event_data=case_payload
        )

        # If prediction already exists in DB, chain ML Prediction block
        pred = db.query(PredictionModel).filter(PredictionModel.case_id == case_id).first()
        if pred:
            pred_payload = {
                "case_id": pred.case_id,
                "risk_level": pred.risk_level,
                "prediction_count": len(pred.predictions or []),
                "top_predictions": (pred.predictions or [])[:3]
            }
            self.record_event(
                db=db,
                case_id=case_id,
                event_type="ML_PREDICTION_GENERATED",
                actor="AI_ML_PREDICTION_ENGINE_RF_V1",
                event_data=pred_payload
            )

    def get_audit_trail(self, db: Session, case_id: str) -> list[dict]:
        """Fetch chronological blockchain blocks for a case."""
        self.ensure_case_chained(db, case_id)
        blocks = (
            db.query(BlockchainAuditModel)
            .filter(BlockchainAuditModel.case_id == case_id)
            .order_by(BlockchainAuditModel.block_index.asc())
            .all()
        )

        return [
            {
                "id": b.id,
                "case_id": b.case_id,
                "block_index": b.block_index,
                "event_type": b.event_type,
                "timestamp": b.timestamp.isoformat() if b.timestamp else None,
                "actor": b.actor,
                "payload_hash": b.payload_hash,
                "previous_hash": b.previous_hash,
                "block_hash": b.block_hash,
                "event_data": b.event_data
            }
            for b in blocks
        ]

    def verify_audit_trail(self, db: Session, case_id: str) -> dict:
        """
        Verify mathematical integrity of the cryptographic chain and cross-reference
        against LIVE database state to detect tampering.
        """
        self.ensure_case_chained(db, case_id)
        blocks = (
            db.query(BlockchainAuditModel)
            .filter(BlockchainAuditModel.case_id == case_id)
            .order_by(BlockchainAuditModel.block_index.asc())
            .all()
        )

        if not blocks:
            return {
                "case_id": case_id,
                "is_valid": True,
                "tamper_detected": False,
                "chain_length": 0,
                "merkle_root": None,
                "tamper_status": "EMPTY_CHAIN",
                "compliance_note": "No records to verify.",
                "blocks": []
            }

        is_valid = True
        tamper_detected = False
        block_verification_results = []
        all_block_hashes = []

        case = db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
        pred = db.query(PredictionModel).filter(PredictionModel.case_id == case_id).first()

        for i, b in enumerate(blocks):
            all_block_hashes.append(b.block_hash)
            block_errors = []

            # 1. Verify previous_hash linkage
            if i == 0:
                if b.previous_hash != self.GENESIS_PREV_HASH:
                    block_errors.append(f"Genesis block previous_hash invalid: {b.previous_hash}")
            else:
                prev_block = blocks[i - 1]
                if b.previous_hash != prev_block.block_hash:
                    block_errors.append(f"Broken hash link from Block #{prev_block.block_index}")

            # 2. Verify payload hash integrity
            expected_payload_hash = self.compute_payload_hash(b.event_data or {})
            if b.payload_hash != expected_payload_hash:
                block_errors.append("Stored payload hash does not match computed payload hash")

            # 3. Verify block header hash integrity
            timestamp_str = b.timestamp.isoformat() if b.timestamp else ""
            expected_block_hash = self.compute_block_hash(
                b.block_index, b.previous_hash, b.payload_hash, timestamp_str
            )
            if b.block_hash != expected_block_hash:
                block_errors.append("Block header hash mismatch - possible block alteration")

            # 4. Cross-verify against LIVE database tables (detect direct DB row tampering)
            if b.event_type == "CASE_REGISTERED" and case:
                live_amount = float(case.amount)
                recorded_amount = float((b.event_data or {}).get("amount", -1))
                if live_amount != recorded_amount:
                    block_errors.append(
                        f"Tamper detected in live database! Live amount (₹{live_amount}) != Block amount (₹{recorded_amount})"
                    )

            if b.event_type == "ML_PREDICTION_GENERATED" and pred:
                live_risk = pred.risk_level
                recorded_risk = (b.event_data or {}).get("risk_level")
                if live_risk != recorded_risk:
                    block_errors.append(
                        f"Tamper detected in prediction table! Live risk ({live_risk}) != Block risk ({recorded_risk})"
                    )

            block_status = "VALID" if not block_errors else "TAMPERED"
            if block_errors:
                is_valid = False
                tamper_detected = True

            block_verification_results.append({
                "block_index": b.block_index,
                "event_type": b.event_type,
                "timestamp": timestamp_str,
                "actor": b.actor,
                "block_hash": b.block_hash,
                "previous_hash": b.previous_hash,
                "payload_hash": b.payload_hash,
                "status": block_status,
                "errors": block_errors
            })

        merkle_root = self.compute_merkle_root(all_block_hashes)

        return {
            "case_id": case_id,
            "is_valid": is_valid,
            "tamper_detected": tamper_detected,
            "chain_length": len(blocks),
            "merkle_root": merkle_root,
            "tamper_status": "VERIFIED_AUTHENTIC_UNALTERED" if is_valid else "TAMPER_DETECTED",
            "compliance_note": (
                "Compliant with Bharatiya Sakshya Adhiniyam (BSA) Section 63 / Indian Evidence Act Section 65B"
                if is_valid
                else "Non-compliant: Cryptographic hash or database state discrepancy detected."
            ),
            "verified_at": datetime.utcnow().isoformat(),
            "blocks": block_verification_results
        }

blockchain_service = BlockchainService()

