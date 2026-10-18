import json
import os
import time
from datetime import datetime

class XGOMAOrchestrator:
    def __init__(self):
        self.accumulated_payout = 0.0
        self.saved_tokens = 0

    def process_query(self, user_query: str, user_id: str, amount_usd: int) -> dict:
        fee = round(amount_usd * 0.05, 2)
        net_to_karam = round(amount_usd - fee, 2)
        self.accumulated_payout += net_to_karam
        self.saved_tokens += int(amount_usd * 1250 * 0.42)
        
        return {
            "status": "completed",
            "user_id": user_id,
            "query": user_query,
            "billing": {
                "amount": amount_usd,
                "fee": fee,
                "net_to_karam": net_to_karam
            },
            "accumulated_payout": round(self.accumulated_payout, 2)
        }

# 테스트 실행
if __name__ == "__main__":
    orch = XGOMAOrchestrator()
    result = orch.process_query("test query", "karam", 100)
    print(result)
