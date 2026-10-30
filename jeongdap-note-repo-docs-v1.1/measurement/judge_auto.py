#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
1차 자동 판정기 — 출처 4단과 내용 일치의 기계 가능 부분만 판정하고 나머지는 사람에게 넘긴다.
  입력: instances.jsonl, runs/<run_id>/answers.jsonl, ledger.csv(정답 원장; 기입된 행만 사용)
  출력: runs/<run_id>/judgments.jsonl, runs/<run_id>/summary.csv, runs/<run_id>/human_queue.csv
출처 4단(방법론 2.1):
  S1 검색에 뜸      = 인용이 하나라도 있음
  S2 AI가 읽음      = 인용 중 공식 도메인(sites.csv official_domains 또는 원장의 official_url 도메인)이 있음
  S3 첫 근거가 됨   = 첫 인용이 공식 도메인
  S4 내용이 맞음    = 원장의 numbers(숫자·날짜)와 answer_key 핵심어가 답변에 들어 있음 → 기계 판정은 '맞음 후보/다름 후보/보류'
                       최종 '맞음/다름'은 사람 전수 판정(3.4). 고위험은 2인.
공급 공백(3.3): 원장 supply_gap=Y 이면 분모에서 분리.
안정성: 같은 인스턴스의 9회 판정 중 다수와 다른 횟수.
"""
import argparse, json, csv, re, collections, pathlib, urllib.parse

ap = argparse.ArgumentParser()
ap.add_argument("--instances", default="instances.jsonl")
ap.add_argument("--run-id", required=True)
ap.add_argument("--ledger", default="ledger.csv")
ap.add_argument("--sites", default="sites.csv")
args = ap.parse_args()

inst = {json.loads(l)["instance_id"]: json.loads(l) for l in open(args.instances, encoding="utf-8")}
site_dom = {r["site_id"]: [d.strip().lower() for d in r["official_domains"].split(";")] for r in csv.DictReader(open(args.sites, encoding="utf-8"))}
ledger = {}
if pathlib.Path(args.ledger).exists():
    for r in csv.DictReader(open(args.ledger, encoding="utf-8")):
        if r.get("official_url_1") or r.get("supply_gap(공식 문서 없음=Y)", "").upper() == "Y":
            ledger[r["instance_id"]] = r

EXCLUDED_PORTAL_HOSTS = {
    "blog.naver.com", "cafe.naver.com", "kin.naver.com", "post.naver.com",
    "namu.wiki", "ko.wikipedia.org", "en.wikipedia.org", "brunch.co.kr", "tistory.com"
}
OFFICIAL_SUFFIXES = (".go.kr", ".korea.kr", ".or.kr")
PLACEBO_REFUSAL_RE = re.compile(r"(없습니다|없으며|시행하지|존재하지|확인되지|운영하지|해당\s*제도는\s*없|실시하지)")

def domain(u):
    try: return urllib.parse.urlparse(u).netloc.lower().split(":")[0]
    except Exception: return ""

def is_official(u, site_id, led):
    d = domain(u)
    if not d:
        return False
    if any(d == p or d.endswith("." + p) for p in EXCLUDED_PORTAL_HOSTS):
        return False
    doms = list(site_dom.get(site_id, []))
    for k in ("official_url_1", "official_url_2(고위험 필수)"):
        if led and led.get(k): doms.append(domain(led[k]))
    if any(d == o or d.endswith("." + o) for o in doms if o):
        return True
    return any(d.endswith(sfx) for sfx in OFFICIAL_SUFFIXES)

NUM = re.compile(r"\d[\d,./:~\-]*")
def norm(s): return re.sub(r"[\s,]", "", s or "")

def match_number_token(num_str, norm_answer, raw_answer):
    n = norm(num_str)
    if not n:
        return False
    if len(n) == 1 and n.isdigit():
        # 1자리 숫자는 앞뒤로 다른 숫자가 붙지 않은 경우(단위·조사 동반)만 인정
        return bool(re.search(rf"(?<!\d){re.escape(n)}(?!\d)", raw_answer or ""))
    return n in norm_answer

def content_check(answer, led):
    """원장 기반 내용 대조. 반환: 맞음 후보 / 다름 후보 / 보류(원장 없음)"""
    if not led: return "보류"
    nums = [n for n in NUM.findall(led.get("numbers(숫자·날짜)", "")) if len(n) >= 1]
    keys = [k.strip() for k in re.split(r"[;,·]", led.get("answer_key(정답 요지)", "")) if k.strip()]
    a = norm(answer)
    hit_n = sum(1 for n in nums if match_number_token(n, a, answer or ""))
    hit_k = sum(1 for k in keys if norm(k) in a)
    if nums and hit_n == len(nums) and (not keys or hit_k >= max(1, len(keys) // 2)): return "맞음 후보"
    if nums and hit_n == 0: return "다름 후보"
    if not nums and keys and hit_k >= max(1, (len(keys) + 1) // 2): return "맞음 후보"
    return "보류"

run_dir = pathlib.Path("runs") / args.run_id
answers = [json.loads(l) for l in open(run_dir / "answers.jsonl", encoding="utf-8")]
judg = []
for a in answers:
    i = inst[a["instance_id"]]; led = ledger.get(a["instance_id"])
    cites = a.get("citations", [])
    tool_sources = a.get("tool_sources")
    s2 = any(is_official(c["url"], a["site_id"], led) for c in cites)
    s3 = bool(cites) and is_official(cites[0]["url"], a["site_id"], led)
    if isinstance(tool_sources, list) and len(tool_sources) > 0:
        s1 = any(is_official(s.get("url", ""), a["site_id"], led) for s in tool_sources) or s2
    else:
        s1 = bool(cites)
    raw_gap_val = (led.get("supply_gap(공식 문서 없음=Y)", "") if led else "").strip().upper()
    not_applicable = raw_gap_val in ("NA", "N/A", "해당없음") or (led and led.get("status", "").strip() == "해당없음")
    gap = bool(led) and raw_gap_val == "Y" and not not_applicable
    if not_applicable:
        s4 = "해당없음"
    elif gap:
        s4 = "공급 공백"
    else:
        s4 = content_check(a.get("answer", ""), led)
    is_placebo = i.get("qtype") == "위약" or str(a.get("qid", "")).startswith("PL-")
    ans_text = a.get("answer", "") or ""
    placebo_fp = bool(is_placebo and ans_text and not PLACEBO_REFUSAL_RE.search(ans_text))
    # 피해 위험 신호: 고위험 문항인데 공식 근거 없이 숫자·연락처를 단정하거나 위약 오탐인 경우
    harm_flag = (i["risk"] == "고" and not s2 and bool(NUM.search(ans_text))) or placebo_fp
    judg.append(dict(instance_id=a["instance_id"], site_id=a["site_id"], qid=a["qid"], day=a["day"], rep=a["rep"],
                     risk=i["risk"], qtype=i["qtype"], s1=s1, s2=s2, s3=s3, s4=s4, supply_gap=gap,
                     not_applicable=bool(not_applicable), placebo_fp=placebo_fp,
                     harm_flag=harm_flag, error=bool(a.get("error")),
                     first_domain=domain(cites[0]["url"]) if cites else "", n_cites=len(cites),
                     n_tool_sources=len(tool_sources) if isinstance(tool_sources, list) else 0))
with open(run_dir / "judgments.jsonl", "w", encoding="utf-8") as f:
    for j in judg: f.write(json.dumps(j, ensure_ascii=False) + "\n")

# 안정성: 인스턴스별 (s3, s4) 다수 판정과 다른 횟수
by_inst = collections.defaultdict(list)
for j in judg: by_inst[j["instance_id"]].append(j)
stab = {}
for k, js in by_inst.items():
    c = collections.Counter((j["s3"], j["s4"]) for j in js)
    stab[k] = len(js) - c.most_common(1)[0][1]

# 집계: 지자체별 공식 근거율(S3, 공급 공백·해당없음·오류 제외) · 피해 위험 신호 건수 · 사람 판정 대기
rows = []
for site in sorted(set(j["site_id"] for j in judg)):
    js = [j for j in judg if j["site_id"] == site and not j["error"]]
    denom = [j for j in js if not j["supply_gap"] and not j.get("not_applicable")]
    placebo_js = [j for j in js if j.get("qtype") == "위약" or str(j.get("qid", "")).startswith("PL-")]
    rows.append(dict(site_id=site, answers=len(js), supply_gap=sum(j["supply_gap"] for j in js),
                     not_applicable=sum(j.get("not_applicable", False) for j in js),
                     s1_rate=round(sum(j["s1"] for j in denom) / max(1, len(denom)), 3),
                     s2_rate=round(sum(j["s2"] for j in denom) / max(1, len(denom)), 3),
                     s3_official_rate=round(sum(j["s3"] for j in denom) / max(1, len(denom)), 3),
                     s4_match_candidate=sum(j["s4"] == "맞음 후보" for j in denom),
                     s4_mismatch_candidate=sum(j["s4"] == "다름 후보" for j in denom),
                     s4_pending=sum(j["s4"] == "보류" for j in denom),
                     placebo_fp=sum(j.get("placebo_fp", False) for j in placebo_js),
                     harm_flags=sum(j["harm_flag"] for j in js),
                     unstable_instances=sum(1 for k, v in stab.items() if v > 2 and by_inst[k][0]["site_id"] == site)))
with open(run_dir / "summary.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

# 사람 판정 대기열: 보류·다름 후보·피해 신호·불안정 — 고위험 먼저
order = {"고": 0, "중": 1, "저": 2}
queue = [j for j in judg if j["s4"] in ("보류", "다름 후보") or j["harm_flag"] or stab[j["instance_id"]] > 2]
queue.sort(key=lambda j: (order[j["risk"]], j["instance_id"], j["day"], j["rep"]))
with open(run_dir / "human_queue.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["instance_id", "site", "qid", "risk", "day", "rep", "question", "auto_s4", "harm_flag", "unstable",
                "judge_A(맞음/다름/보류)", "judge_B(고위험)", "final", "note"])
    for j in queue:
        w.writerow([j["instance_id"], j["site_id"], j["qid"], j["risk"], j["day"], j["rep"], inst[j["instance_id"]]["question"],
                    j["s4"], j["harm_flag"], stab[j["instance_id"]] > 2, "", "", "", ""])
print(open(run_dir / "summary.csv", encoding="utf-8").read())
print(f"사람 판정 대기 {len(queue)}건 → {run_dir/'human_queue.csv'}")
