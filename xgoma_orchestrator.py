import json
from datetime import datetime

class XGOMAOrchestrator:
    def __init__(self):
        self.accumulated_payout = 0.0
        self.sales = []

    def sell_pdf_guide(self, user_id: str):
        amount = 9.9
        net = round(amount * 0.95, 2)
        self.accumulated_payout += net
        self.sales.append({
            "type": "PDF",
            "amount": amount,
            "net": net,
            "user": user_id,
            "product": "Karam NC Purple Removal Guide"
        })
        
        return {
            "status": "success",
            "product": "Karam NC Purple Removal Guide",
            "price": amount,
            "net": net,
            "download_link": "https://hai.xgoma.com/download/nc-guide.pdf",
            "message": "PDF 구매 완료. 바로 다운로드 가능"
        }

    def create_service_payment(self, amount: int, user_id: str, service: str):
        net = round(amount * 0.95, 2)
        self.accumulated_payout += net
        self.sales.append({
            "type": "Service",
            "amount": amount,
            "net": net,
            "user": user_id,
            "service": service
        })
        
        return {
            "status": "success",
            "service": service,
            "price": amount,
            "net": net,
            "message": "1:1 서비스 결제 완료. Calendly 링크로 이동"
        }

    def generate_sales_report(self):
        gross_sales = round(sum(sale["amount"] for sale in self.sales), 2)
        net_payout = round(sum(sale["net"] for sale in self.sales), 2)
        pdf_sales = [sale for sale in self.sales if sale["type"] == "PDF"]
        service_sales = [sale for sale in self.sales if sale["type"] == "Service"]

        return {
            "status": "success",
            "total_sales_count": len(self.sales),
            "pdf_sales_count": len(pdf_sales),
            "service_sales_count": len(service_sales),
            "gross_sales": gross_sales,
            "net_to_karam": net_payout,
            "sales": self.sales
        }

if __name__ == "__main__":
    orch = XGOMAOrchestrator()
    
    print("=== PDF 판매 테스트 ===")
    print(orch.sell_pdf_guide("karam_test"))
    
    print("\n=== 1:1 서비스 테스트 ===")
    print(orch.create_service_payment(97, "karam_test", "NC Remote Clean"))
    
    print(f"\n총 누적 수익: ${round(orch.accumulated_payout, 2)}")

    print("\n=== 판매 리포트 ===")
    print(json.dumps(orch.generate_sales_report(), ensure_ascii=False, indent=2))
