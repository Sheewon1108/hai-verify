import json
from datetime import datetime

class XGOMAOrchestrator:
    def __init__(self):
        self.accumulated_payout = 0.0

    def create_payment_link(self, amount_usd: int, user_id: str, service_name: str):
        mock_session_id = f"cs_test_{int(datetime.now().timestamp())}"
        self.accumulated_payout += amount_usd * 0.95
        
        return {
            "status": "success",
            "checkout_url": f"https://hai.xgoma.com/pay/{mock_session_id}",
            "session_id": mock_session_id,
            "amount": amount_usd,
            "net_to_karam": round(amount_usd * 0.95, 2),
            "service": service_name,
            "message": "테스트 모드입니다. 실제 결제는 나중에 Stripe 연결"
        }

if __name__ == "__main__":
    orch = XGOMAOrchestrator()
    result = orch.create_payment_link(97, "karam", "NC Purple Removal Service")
    print(result)
