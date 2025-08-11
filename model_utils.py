import pandas as pd
import joblib
import math
import numpy as np

# ✅ 모델 및 피처 로드
model = joblib.load("trained_model.pkl")
feature_names = joblib.load("feature_names.pkl")

# --- 안전 가드 ---
assert isinstance(feature_names, (list, tuple)), "feature_names.pkl은 리스트여야 합니다."
assert len(feature_names) == 5, f"모델 입력 피처 개수(5)와 다릅니다: {len(feature_names)}"

def compute_tw_stull(ta, rh):
    """ta: °C, rh: % (0~100)"""
    try:
        rh = float(rh)
        ta = float(ta)
        rh = max(0.0, min(100.0, rh))  # clip
        tw = ( ta * math.atan(0.151977 * math.sqrt(rh + 8.313659))
             + math.atan(ta + rh)
             - math.atan(rh - 1.67633)
             + 0.00391838 * (rh ** 1.5) * math.atan(0.023101 * rh)
             - 4.686035 )
        return tw  # ⬅ 반올림하지 않고 원값 반환
    except Exception as e:
        raise ValueError(f"습구온도 계산 실패: {e}")

def compute_heat_index_kma2022(ta, rh):
    """ta: °C, rh: % — KMA(개정식) 기반 근사"""
    tw = compute_tw_stull(ta, rh)
    hi = (-0.2442
          + 0.55399 * tw
          + 0.45535 * ta
          - 0.0022 * (tw ** 2)
          + 0.00278 * tw * ta
          + 3.0)
    return hi  # ⬅ 반올림하지 않음

def predict_from_weather(tmx, tmn, reh):
    """
    tmx: 최고기온(°C), tmn: 최저기온(°C), reh: 평균상대습도(%)
    return: (pred, avg_temp, heat_index, input_df)
    """
    tmx = float(tmx); tmn = float(tmn); reh = float(reh)
    if tmx < tmn:  # 입력 실수 방지
        tmx, tmn = tmn, tmx

    avg_temp = (tmx + tmn) / 2.0
    heat_index = compute_heat_index_kma2022(tmx, reh)

    row = {
        "최고체감온도(°C)": heat_index,
        "최고기온(°C)": tmx,
        "평균기온(°C)": avg_temp,
        "최저기온(°C)": tmn,
        "평균상대습도(%)": reh,
    }
    input_df = pd.DataFrame([row], dtype=np.float32)

    # ✅ 피처 순서 강제 + 누락/과잉 컬럼 체크
    miss = [c for c in feature_names if c not in input_df.columns]
    extra = [c for c in input_df.columns if c not in feature_names]
    if miss or extra:
        raise ValueError(f"모델 입력 피처 불일치. 누락: {miss}, 과잉: {extra}")

    X = input_df.reindex(columns=feature_names).astype(np.float32)
    pred = float(model.predict(X)[0])

    # 화면 표시는 반올림해서 사용
    return pred, round(avg_temp, 1), round(heat_index, 1), input_df
