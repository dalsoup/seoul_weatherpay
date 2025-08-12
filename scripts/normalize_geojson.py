# scripts/normalize_geojson.py
import json, urllib.request, os
SRC = "https://raw.githubusercontent.com/southkorea/seoul-maps/master/juso/2015/json/seoul_municipalities_geo.json"
with urllib.request.urlopen(SRC) as r:
    gj = json.load(r)

features = []
for f in gj.get("features", []):
    props = f.get("properties", {})
    name = props.get("name") or props.get("SIG_KOR_NM") or ""
    features.append({"type":"Feature","properties":{"name":name},"geometry":f.get("geometry")})

out = {"type":"FeatureCollection","features":features}
os.makedirs("public", exist_ok=True)
with open("public/seoul_districts.geojson","w",encoding="utf-8") as fp:
    json.dump(out, fp, ensure_ascii=False)
print("✅ Wrote public/seoul_districts.geojson")
