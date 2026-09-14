#!/usr/bin/env python3
"""저장소 검증.

  1) JSON 문법
  2) JSON Schema 로 표본 레코드 검증 (jsonschema 가 있으면)
  3) 금지 키 린트 — 총점·순위·등급·빈칸 수·목표치·요약
  4) 금지 표현 린트
  5) 문항 지식 소스의 무결성 — 지번 중복, 값형/원장 짝, 서술형/정확층
  6) 계열 개방 게이트 — 근거 미확인 계열이 열려 있지 않은지

  python3 tools/validate.py            경고는 통과
  python3 tools/validate.py --strict   경고도 실패
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERRORS = []
WARNINGS = []


def err(where, msg):
    ERRORS.append("%s: %s" % (where, msg))


def warn(where, msg):
    WARNINGS.append("%s: %s" % (where, msg))


def rel(p):
    return os.path.relpath(p, ROOT)


def walk(exts, skip=("sealed", ".git")):
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in skip]
        for f in files:
            if f.endswith(exts):
                yield os.path.join(base, f)


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


# ── 1. JSON 문법 ────────────────────────────────────────────────
JSON_FILES = sorted(walk((".json",)))
DOCS = {}
for p in JSON_FILES:
    try:
        DOCS[p] = load(p)
    except Exception as e:
        err(rel(p), "JSON 을 읽을 수 없음 — %s" % e)


# ── 2. 스키마 검증 ──────────────────────────────────────────────
FIXTURE_SCHEMA = {
    "sample_response_record.json": "response_record.schema.json",
    "sample_observation.json": "observation.schema.json",
    "sample_verdict.json": "verdict.schema.json",
    "sample_verdict_mismatch.json": "verdict.schema.json",
    "sample_grid.json": "grid.schema.json",
    "sample_project_record.json": "project_record.schema.json",
    "sample_output.json": "output.schema.json",
}

try:
    import jsonschema  # type: ignore
    HAVE_JSONSCHEMA = True
except ImportError:
    HAVE_JSONSCHEMA = False
    warn("tools", "jsonschema 가 없어 스키마 검증을 건너뜀 (pip install jsonschema)")

if HAVE_JSONSCHEMA:
    def check(instance, schema_name, where):
        sp = os.path.join(ROOT, "schema", schema_name)
        try:
            schema = load(sp)
        except Exception as e:
            err("schema/" + schema_name, "읽을 수 없음 — %s" % e)
            return
        try:
            jsonschema.validate(instance, schema)
        except jsonschema.ValidationError as e:
            path = "/".join(str(x) for x in e.absolute_path) or "(최상위)"
            err(where, "스키마 위반 [%s] %s" % (path, e.message))
        except jsonschema.SchemaError as e:
            err("schema/" + schema_name, "스키마 자체가 잘못됨 — %s" % e.message)

    for name, schema_name in FIXTURE_SCHEMA.items():
        fp = os.path.join(ROOT, "fixtures", name)
        if not os.path.exists(fp):
            err("fixtures/" + name, "표본 레코드가 없음")
            continue
        if fp in DOCS:
            check(DOCS[fp], schema_name, "fixtures/" + name)

    # 문항 파일의 각 문항을 question 스키마로
    qdir = os.path.join(ROOT, "data", "questions")
    for p in sorted(walk((".json",), skip=("sealed", ".git"))):
        if not p.startswith(qdir):
            continue
        doc = DOCS.get(p)
        if not isinstance(doc, dict):
            continue
        for q in doc.get("questions", []):
            check(q, "question.schema.json",
                  "%s [%s]" % (rel(p), q.get("id", "?")))


# ── 3. 금지 키 린트 ─────────────────────────────────────────────
fk_path = os.path.join(ROOT, "policy", "forbidden_keys.json")
FORBIDDEN, EXCEPTIONS = [], []
if fk_path in DOCS:
    FORBIDDEN = DOCS[fk_path]["keys"]
    EXCEPTIONS = DOCS[fk_path].get("allowed_exceptions", [])
else:
    err("policy/forbidden_keys.json", "금지 키 목록이 없음")

FORBIDDEN_MAP = {k["key"]: k["reason"] for k in FORBIDDEN}


def excused(key, path):
    for ex in EXCEPTIONS:
        if ex["key"] == key and ex.get("path_contains", "") in path:
            return True
    return False


def scan_keys(node, path, where):
    if isinstance(node, dict):
        for k, v in node.items():
            here = path + "/" + str(k)
            if k in FORBIDDEN_MAP and not excused(k, here):
                err(where, '금지 키 "%s" (%s) — %s' % (k, here, FORBIDDEN_MAP[k]))
            scan_keys(v, here, where)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            scan_keys(v, path + "/%d" % i, where)


# 스키마 파일은 properties 아래의 키 이름이 곧 만들어질 필드이므로 함께 본다
for p, doc in DOCS.items():
    if p == fk_path:
        continue
    scan_keys(doc, "", rel(p))


# ── 4. 금지 표현 린트 ───────────────────────────────────────────
bt_path = os.path.join(ROOT, "policy", "banned_terms.json")
TERMS = []
if bt_path in DOCS:
    TERMS = [t["term"] for t in DOCS[bt_path]["terms"]]
else:
    err("policy/banned_terms.json", "금지 표현 목록이 없음")

TEXT_FILES = sorted(walk((".md", ".json", ".py")))

# 금지 표현을 정의하거나 인용하는 자리는 명시적 표식으로만 면제합니다.
#   한 줄:   ... <!-- lint:allow-banned -->
#   블록:    <!-- lint:allow-banned:start -->  ...  <!-- lint:allow-banned:end -->
ALLOW_ONE = "lint:allow-banned"
ALLOW_START = "lint:allow-banned:start"
ALLOW_END = "lint:allow-banned:end"

for p in TEXT_FILES:
    if p in (bt_path, os.path.abspath(__file__)):
        continue
    try:
        with open(p, encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        continue
    in_block = False
    for n, line in enumerate(lines, 1):
        if ALLOW_START in line:
            in_block = True
            continue
        if ALLOW_END in line:
            in_block = False
            continue
        if in_block or ALLOW_ONE in line:
            continue
        for term in TERMS:
            if term in line:
                err("%s:%d" % (rel(p), n), '금지 표현 "%s"' % term)


# ── 5. 문항 지식 소스 무결성 ────────────────────────────────────
seen_ids = {}
qdir = os.path.join(ROOT, "data", "questions")
for p, doc in sorted(DOCS.items()):
    if not p.startswith(qdir) or not isinstance(doc, dict):
        continue
    for q in doc.get("questions", []):
        qid = q.get("id")
        where = "%s [%s]" % (rel(p), qid)
        if qid in seen_ids:
            err(where, "지번이 %s 와 중복" % seen_ids[qid])
        else:
            seen_ids[qid] = rel(p)

        if q.get("type") == "value" and not q.get("ledger"):
            err(where, "값형인데 원장이 없음 — 서술형이어야 한다 (관문 2)")
        if q.get("type") == "descriptive":
            if q.get("ledger") is not None:
                err(where, "서술형인데 원장이 있음")
            if "accuracy" in q.get("layers", []):
                err(where, "서술형에 정확 층이 붙어 있음 — 값 판정 대상이 아니다")
        if not (q.get("boundary") or "").strip():
            err(where, "경계 선언이 비어 있음 (여섯 요건 중 2)")
        if q.get("difficulty") == "D0" and q.get("type") == "descriptive":
            warn(where, "서술형에 D0 — 확인 방법을 다시 보십시오")

# 역점사업 템플릿
tpl = DOCS.get(os.path.join(ROOT, "data", "questions", "project_template.json"))
if tpl:
    slots = [s["slot"] for s in tpl.get("slots", [])]
    if len(slots) != 6:
        err("data/questions/project_template.json", "여섯 물음이어야 하는데 %d 개" % len(slots))
    if tpl.get("sensitivity") != "agency_only":
        err("data/questions/project_template.json",
            "역점사업 지번의 민감도는 agency_only 여야 한다")
    for s in tpl.get("slots", []):
        if s.get("type") == "value" and not s.get("ledger"):
            err("data/questions/project_template.json [%s]" % s.get("slot"),
                "값형인데 원장이 없음")


# ── 6. 계열 개방 게이트 ────────────────────────────────────────
aa = DOCS.get(os.path.join(ROOT, "data", "registries", "archetype_assignment.json"))
if aa:
    for a in aa.get("archetypes", []):
        if a.get("open_for_publication") and a.get("basis_verification") != "confirmed":
            err("data/registries/archetype_assignment.json [%s]" % a.get("code"),
                "근거가 확인되지 않았는데 판본에 열려 있음")
        if a.get("basis_verification") != "confirmed":
            warn("data/registries/archetype_assignment.json [%s]" % a.get("code"),
                 "근거 자구 대조가 남아 있음 — 판본에 실을 수 없음")
    if not aa.get("min_cell_size"):
        err("data/registries/archetype_assignment.json", "min_cell_size 가 없음")

pf = DOCS.get(os.path.join(ROOT, "data", "registries", "population_frame.json"))
if pf and pf.get("status") == "placeholder":
    warn("data/registries/population_frame.json",
         "기관 목록이 비어 있음 — 판본을 열기 전에 기준일 자료로 채워야 함")

rp = DOCS.get(os.path.join(ROOT, "data", "registries", "run_profile.json"))
if rp and rp.get("status") == "placeholder":
    warn("data/registries/run_profile.json",
         "관측 조건이 비어 있음 — 판본을 열 때 고정해야 함")


# ── 7. 산식 유출 검사 ──────────────────────────────────────────
FORMULA_HINTS = [
    (re.compile(r"가중치\s*[:=]\s*[0-9.]"), "가중치 값"),
    (re.compile(r"임계값?\s*[:=]\s*[0-9.]"), "임계값"),
    (re.compile(r"구간\s*경계\s*[:=]"), "구간 경계"),
]
for p in TEXT_FILES:
    if p == os.path.abspath(__file__):
        continue
    try:
        with open(p, encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        continue
    for n, line in enumerate(lines, 1):
        for rx, label in FORMULA_HINTS:
            if rx.search(line):
                err("%s:%d" % (rel(p), n),
                    "산식으로 보이는 값 (%s) — 이 저장소에 적지 않는다" % label)


# ── 보고 ────────────────────────────────────────────────────────
print("검사한 JSON 파일: %d" % len(JSON_FILES))
print("등록된 지번: %d" % len(seen_ids))
print()

for w_ in WARNINGS:
    print("  경고  " + w_)
for e in ERRORS:
    print("  오류  " + e)

print()
if ERRORS:
    print("실패 — 오류 %d, 경고 %d" % (len(ERRORS), len(WARNINGS)))
    sys.exit(1)
if WARNINGS and "--strict" in sys.argv:
    print("실패 (strict) — 경고 %d" % len(WARNINGS))
    sys.exit(1)
print("통과 — 오류 0, 경고 %d" % len(WARNINGS))
sys.exit(0)
