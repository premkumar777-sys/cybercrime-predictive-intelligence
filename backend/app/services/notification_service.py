class NotificationService:
    def trigger_alerts(self, case_id: str, prediction: dict):
        # Determine the highest risk level from the prediction
        risk_level = prediction.get("risk_level", "LOW")
        top_locations = prediction.get("predictions", [])
        
        # We only want to trigger high-priority alerts for HIGH risk cases
        if risk_level == "HIGH" and top_locations:
            top_atm = top_locations[0]
            
            # Print a simulated SMS/Email alert to the console
            print("="*50)
            print("🚨 HIGH PRIORITY I4C ALERT SENT 🚨")
            print("="*50)
            print(f"CASE: {case_id}")
            print(f"To: LEA Task Force, I4C Coordination Center")
            print(f"Alert: High probability cash-withdrawal predicted.")
            print(f"Location: {top_atm.get('location_name')} ({top_atm.get('time_window')})")
            print(f"Risk Score: {top_atm.get('risk_score', 0) * 100:.1f}%")
            print(f"Explanation: {' | '.join(top_atm.get('explanation', []))}")
            print("="*50)
            
            # Simulated API callback to a real I4C gateway could go here
            return True
            
        return False

# Global instance for dependency injection
notifier = NotificationService()
