from .blockchain_service import blockchain_service

class NotificationService:
    def trigger_alerts(self, case_id: str, prediction: dict, db=None):
        # Determine the highest risk level from the prediction
        risk_level = prediction.get("risk_level", "LOW")
        top_locations = prediction.get("predictions", [])
        
        # Trigger high-priority alerts for HIGH risk cases
        if risk_level == "HIGH" and top_locations:
            top_atm = top_locations[0]
            
            # Print I4C / LEA dispatch alert
            print("="*50)
            print("🚨 HIGH PRIORITY I4C / LEA DISPATCH ALERT 🚨")
            print("="*50)
            print(f"CASE: {case_id}")
            print(f"To: Cyber Crime Police Station (CCPS), I4C Coordination Center")
            print(f"Alert: High probability cash-withdrawal predicted.")
            print(f"Location: {top_atm.get('location_name')} ({top_atm.get('time_window')})")
            print(f"Risk Score: {top_atm.get('risk_score', 0) * 100:.1f}%")
            print(f"Explanation: {' | '.join(top_atm.get('explanation', []))}")
            print("="*50)
            
            # Record immutable audit block if database session is present
            if db:
                blockchain_service.record_event(
                    db=db,
                    case_id=case_id,
                    event_type="LEA_INTERVENTION_DISPATCHED",
                    actor="I4C_TASKFORCE_COORDINATION",
                    event_data={
                        "case_id": case_id,
                        "target_location": top_atm.get("location_name"),
                        "location_id": top_atm.get("location_id"),
                        "time_window": top_atm.get("time_window"),
                        "risk_score": top_atm.get("risk_score", 0),
                        "channel": "AUTOMATED_DISPATCH_POLICE_BEAT"
                    }
                )
            return True
            
        return False

# Global instance for dependency injection
notifier = NotificationService()
