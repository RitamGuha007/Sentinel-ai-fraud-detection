import urllib.request
import json
import time

scenarios = [
    {
        "name": "Scenario 1: Verified In-Store Purchase",
        "type": "Legitimate In-Store Purchase",
        "amount": "$149.62",
        "expected": "Legitimate (Low Risk)",
        "features": [0.0, -1.3598, -0.0728, 2.5363, 1.3782, -0.3383, 0.4624, 0.2396, 0.0987, 0.3638, 0.0908, -0.5516, -0.6178, -0.9914, -0.3112, 1.4682, -0.4704, 0.2080, 0.0258, 0.4040, 0.2514, -0.0183, 0.2778, -0.1105, 0.0669, 0.1285, -0.1891, 0.1336, -0.0211, 149.62]
    },
    {
        "name": "Scenario 2: Everyday Digital Micro-Charge",
        "type": "Routine Coffee / Online Service",
        "amount": "$2.69",
        "expected": "Legitimate (Low Risk)",
        "features": [0.0, 1.1919, 0.2662, 0.1665, 0.4482, 0.0600, -0.0824, -0.0788, 0.0851, -0.2554, -0.1670, 1.6127, 1.0652, 0.4891, -0.1438, 0.6356, 0.4639, -0.1148, -0.1834, -0.1458, -0.0691, -0.2258, -0.6387, 0.1013, -0.3398, 0.1672, 0.1259, -0.0090, 0.0147, 2.69]
    },
    {
        "name": "Scenario 3: Zero-Dollar Bot Card Testing",
        "type": "High-Velocity Card Testing Ping",
        "amount": "$0.00",
        "expected": "Suspicious (Medium Risk)",
        "features": [406.0, -2.3122, 1.9520, -1.6099, 3.9979, -0.5222, -1.4265, -2.5374, 1.3917, -2.7701, -2.7723, 3.2020, -2.8999, -0.5952, -4.2893, 0.3897, -1.1407, -2.8301, -0.0168, 0.4170, 0.1269, 0.5172, -0.0350, -0.4652, 0.3202, 0.0445, 0.1778, 0.2611, -0.1433, 0.0]
    },
    {
        "name": "Scenario 4: Account Takeover & Rapid Draining",
        "type": "Compromised Account / Stolen Card",
        "amount": "$239.93",
        "expected": "Fraudulent (High Risk)",
        "features": [4462.0, -2.3033, 1.7592, -0.3597, 2.3302, -0.8216, -0.0758, 0.5623, -0.3991, -0.2383, -1.5254, 2.0329, -6.5601, 0.0229, -1.4701, -0.6988, -2.2822, -4.7818, -2.6157, -1.3344, -0.4300, -0.2942, -0.9324, 0.1727, -0.0873, -0.1561, -0.5426, 0.0396, -0.1530, 239.93]
    },
    {
        "name": "Scenario 5: High-Value Offshore Outlier Wire",
        "type": "Abnormal Midnight Transfer",
        "amount": "$529.00",
        "expected": "Fraudulent (High Risk)",
        "features": [472.0, -3.0435, -3.1573, 1.0885, 2.2886, 1.3598, -1.0648, 0.3256, -0.0678, -0.2710, -0.8386, -0.4146, -0.5031, 0.6765, -1.6920, 2.0006, 0.6668, 0.5997, 1.7253, 0.2833, 2.1023, 0.6617, 0.4355, 1.3760, -0.2938, 0.2798, -0.1454, -0.2528, 0.0358, 529.0]
    }
]

print("="*65)
print(" LIVE PIPELINE EVALUATION DEMO (FASTAPI -> ML INFERENCE)")
print("="*65)

for s in scenarios:
    t0 = time.time()
    payload = json.dumps({"features": s["features"]}).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/predict",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
    elapsed_ms = round((time.time() - t0) * 1000, 2)
    
    prob = round(res["fraud_probability"] * 100, 1)
    status_icon = "[BLOCKED - DECLINE]" if res["prediction"] == 1 else ("[CHALLENGE - 2FA REQUIRED]" if res["risk_level"] == "Medium" else "[APPROVED - AUTO-SETTLE]")

    print(f"\n>> {s['name']}")
    print(f"   Transaction Type  : {s['type']} | Amount: {s['amount']}")
    print(f"   Model Prediction  : {res['result']} (Decision code: {res['prediction']})")
    print(f"   Fraud Probability : {prob}% [Decision Threshold: 60.0%]")
    print(f"   Risk Severity     : {res['risk_level']}")
    print(f"   Gateway Action    : {status_icon}")
    print(f"   Pipeline Latency  : {elapsed_ms} ms")

print("\n" + "="*65)
