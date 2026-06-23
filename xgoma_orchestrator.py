import json
from datetime import datetime

class XGOMAOrchestrator:
    def __init__(self):
        self.accumulated_payout = 0.0
        self.sales = []

    def sell_pdf_guide(self, user_id: str):
        amount = 9.9
        self.accumulated_payout += amount * 0.95
        self.sales.append({"type": "PDF", "amount": amount, "user": user_id})
        
        return {
            "status": "success",
            "product": "Karam NC Purple Removal Guide",
            "price": amount,
            "net": round(amount * 0.95, 2),
            "download_link": "https://hai.xgoma.com/download/nc-guide.pdf",
            "message": "PDF 구매 완료. 바로 다운로드 가능"
        }

    def create_service_payment(self, amount: int, user_id: str, service: str):
        self.accumulated_payout += amount * 0.95
        self.sales.append({"type": "Service", "amount": amount, "user": user_id})
        
        return {
            "status": "success",
            "service": service,
            "price": amount,
            "net": round(amount * 0.95, 2),
            "message": "1:1 서비스 결제 완료. Calendly 링크로 이동"
        }

if __name__ == "__main__":
    orch = XGOMAOrchestrator()
    
    print("=== PDF 판매 테스트 ===")
    print(orch.sell_pdf_guide("karam_test"))
    
    print("\n=== 1:1 서비스 테스트 ===")
    print(orch.create_service_payment(97, "karam_test", "NC Remote Clean"))
    
    print(f"\n총 누적 수익: ${round(orch.accumulated_payout, 2)}")
