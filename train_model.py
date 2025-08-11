# train_model.py
import os
import sys
import math
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error

# ===== 경로/파일 =====
STATIC_FILE   = "ML_static_dataset.csv"   # 정적(과거) 데이터
DYNAMIC_FILE  = "ML_asos_dataset.csv"     # 동적(사용자 입력/최신) 데이터 (없어도 됨)
MODEL_FILE    = "trained_model.pkl"
FEATURE_FILE  = "feature_names.pkl"

# 학습에 사용할 피처 "순서 고정" — predict_from_weather와 100% 동일
FEATURE_ORDER = [
    "최고체감온도(°C)",
    "최고기온(°C)",
    "평균기온(°C)",
    "최저기온(°C)",
    "평균상대습도(%)",
]
TARGET_COL = "환자수"

def _read_csv_any(path: str) -> pd.DataFrame:
    """utf-8-sig 우선, 실패 시 cp949로 재시도"""
    try:
        return pd.read_csv(path, encoding="utf-8-sig")
    except UnicodeDecodeError:
        return pd.read_csv(path, encoding="cp949")

def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.str.strip().str.replace("\n", "", regex=False).str.replace(" ", "", regex=False)
    # '일자' 만들기: 엑셀 날짜 or 문자열 날짜 모두 허용
    if "일자" not in df.columns:
        if "일시" in df.columns:
            # 숫자(엑셀 직렬) → 날짜
            if pd.api.types.is_numeric_dtype(df["일시"]):
                df["일자"] = (pd.to_datetime("1899-12-30") + pd.to_timedelta(df["일시"], unit="D")).dt.strftime("%Y-%m-%d")
            else:
                df["일자"] = pd.to_datetime(df["일시"], errors="coerce").dt.strftime("%Y-%m-%d")
        # 지역 컬럼 통일
    if "지역" not in df.columns:
        for cand in ["광역자치단체", "시도"]:
            if cand in df.columns:
                df["지역"] = df[cand]
                break

    # 불필요 열 제거
    drop_cols = [c for c in ["일시", "광역자치단체", "시도"] if c in df.columns]
    if drop_cols:
        df = df.drop(columns=drop_cols)
    return df

def _coerce_numeric(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    num_cols = FEATURE_ORDER + [TARGET_COL]
    for c in num_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    # RH는 0~100 clip (평균상대습도)
    if "평균상대습도(%)" in df.columns:
        df["평균상대습도(%)"] = df["평균상대습도(%)"].clip(lower=0, upper=100)
    return df

def _aggregate(df: pd.DataFrame) -> pd.DataFrame:
    # 같은 일자/지역에 다중 행 → 기상 변수는 평균, 환자수는 합
    need = ["일자", "지역"] + FEATURE_ORDER + [TARGET_COL]
    missing = [c for c in need if c not in df.columns]
    if missing:
        raise ValueError(f"필수 컬럼 누락: {missing}")

    df = df.dropna(subset=["일자", "지역"])
    # 숫자형 결측 제거
    df = df.dropna(subset=[c for c in FEATURE_ORDER + [TARGET_COL] if c in df.columns])

    grouped = df.groupby(["일자", "지역"], as_index=False).agg({
        "최고체감온도(°C)": "mean",
        "최고기온(°C)": "mean",
        "평균기온(°C)": "mean",
        "최저기온(°C)": "mean",
        "평균상대습도(%)": "mean",
        "환자수": "sum",
    })
    return grouped

def main():
    print("📂 CWD:", os.getcwd())
    print("📄 파일:", os.listdir())

    if not os.path.exists(STATIC_FILE):
        print(f"❌ 정적 데이터 파일이 없습니다: {STATIC_FILE}")
        sys.exit(1)

    # 1) 정적 데이터
    df_static = _read_csv_any(STATIC_FILE)
    df_static = _normalize_columns(df_static)
    df_static = _coerce_numeric(df_static)
    print(f"✅ 정적 데이터 로드: {df_static.shape}")

    # 2) 동적 데이터(선택)
    if os.path.exists(DYNAMIC_FILE):
        df_dyn = _read_csv_any(DYNAMIC_FILE)
        df_dyn = _normalize_columns(df_dyn)
        df_dyn = _coerce_numeric(df_dyn)
        print(f"✅ 동적 데이터 로드: {df_dyn.shape}")
        df_all = pd.concat([df_static, df_dyn], ignore_index=True)
    else:
        print("⚠️ 동적 데이터 없음 → 정적 데이터만 사용")
        df_all = df_static.copy()

    # 3) 집계
    df_all = _aggregate(df_all)
    print(f"📊 집계 완료: {df_all.shape}")

    # 4) 학습 데이터 구성
    X = df_all[FEATURE_ORDER].astype(np.float32)
    y = df_all[TARGET_COL].astype(np.float32)

    if len(df_all) < 20:
        print(f"⚠️ 표본 {len(df_all)} → 홀드아웃 평가 대신 훈련셋 지표만 출력")
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        # 날짜/지역 섞여있으니 랜덤 분할(재현성 고정)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

    # 5) 모델 학습
    model = XGBRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # 6) 성능 평가
    def _eval(split, X_, y_):
        pred = model.predict(X_)
        r2 = r2_score(y_, pred)
        rmse = math.sqrt(mean_squared_error(y_, pred))
        print(f"📈 {split} — R²: {r2:.4f} | RMSE: {rmse:.4f}")

    _eval("Train", X_train, y_train)
    if X_test is not X_train:
        _eval("Test", X_test, y_test)

    # 7) 아티팩트 저장
    joblib.dump(model, MODEL_FILE)
    joblib.dump(FEATURE_ORDER, FEATURE_FILE)
    print(f"\n✅ 저장 완료 → {MODEL_FILE}, {FEATURE_FILE}")
    print(f"🧠 사용 피처(순서 고정): {FEATURE_ORDER}")

if __name__ == "__main__":
    main()
