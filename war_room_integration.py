from war_room_gate import WarRoomGate
from core_crypto import WarRoomSecurityProvider


class HaiIcWarRoom:
    def __init__(self):
        self.gate = WarRoomGate()
        self.security = WarRoomSecurityProvider()

    def analyze(self, input_text: str, user_id: str = "commander"):
        admit = self.gate.admit("grok", {"input": input_text}, user_id)
        if not admit.allowed:
            return {"error": "Access denied"}
        return {"status": "ok", "confidence": 85, "response": "HAI IC processed"}
