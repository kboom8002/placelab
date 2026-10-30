#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
상시 관측 모듈 (능동 성과 측정안 8장, D108)
  ask     : 관측 질문 90(월·수·금 각 1회) + 지명 한 줄 243(화)을 묻고 runs_weekly/<week>/answers.jsonl 에 기록
  extract : 답변에서 지자체 등장을 지명 사전(gazetteer.csv)으로 추출 → mentions.jsonl
  window  : 최근 4주(최대 12회 관측)의 등장 상태(안정·가끔·신규·소멸)를 단위×질문별로 계산 → states.csv
  cards   : 지자체 주간 카드 243장(cards/<unit_id>.md) + 전국 기상도(weather.csv) 생성
사용:
  python observe_weekly.py ask --week 2026-W49 --day mon [--dry-run]
  python observe_weekly.py ask --week 2026-W49 --day tue --identity [--dry-run]    # 지명 한 줄
  python observe_weekly.py extract --week 2026-W49
  python observe_weekly.py window --week 2026-W49
  python observe_weekly.py cards --week 2026-W49
"""
import argparse, csv, json, os, re, pathlib, random, datetime, collections

ROOT = pathlib.Path(__file__).parent
GAZ = ROOT / "gazetteer.csv"
QS = ROOT / "observe_questions.csv"
DECL = ROOT / "declarations.csv"  # 기본 선언표: unit_id, element(알릴 요소), stale(낡은 요소) — 없으면 정체성 추적 생략
OFFICIAL_SUFFIX = (".go.kr",)

def week_dir(week): d = ROOT / "runs_weekly" / week; d.mkdir(parents=True, exist_ok=True); return d
def prev_weeks(week, n):
    y, w = int(week[:4]), int(week[-2:]); out = []
    d = datetime.date.fromisocalendar(y, w, 1)
    for i in range(n):
        dd = d - datetime.timedelta(weeks=i); iy, iw, _ = dd.isocalendar(); out.append(f"{iy}-W{iw:02d}")
    return out

def load_decl():
    """declarations.csv → unit_id -> [{kind, element, keywords[]}] (알릴·낡은만)"""
    d = collections.defaultdict(list)
    if not DECL.exists(): return d
    for r in csv.DictReader(open(DECL, encoding="utf-8")):
        if r["kind"] in ("알릴", "낡은") and r["unit_id"]:
            d[r["unit_id"]].append(dict(kind=r["kind"], element=r["element"], keywords=[k.strip() for k in r["keywords"].split(";") if k.strip()]))
    return d

def load_gaz():
    g = list(csv.DictReader(open(GAZ, encoding="utf-8")))
    for r in g: r["aliases"] = [a for a in r["aliases"].split(";") if a]
    return g

# ---------- ask ----------
def ask_cmd(a):
    qs = list(csv.DictReader(open(QS, encoding="utf-8")))
    gaz = load_gaz()
    items = []
    if a.identity:
        for u in gaz: items.append(dict(q_id=f"ID-{u['unit_id']}", unit_id=u["unit_id"], lang="ko", text=f"{u['name']}는 어떤 곳이야?"))
    else:
        for q in qs: items.append(dict(q_id=q["q_id"], unit_id="", lang=q["lang"], text=q["text"]))
    out = week_dir(a.week) / "answers.jsonl"
    done = set()
    if out.exists():
        for l in open(out, encoding="utf-8"): r = json.loads(l); done.add((r["q_id"], r["day"]))
    client = None
    if not a.dry_run:
        from openai import OpenAI; client = OpenAI()
    names = [u["short"] for u in gaz]
    n = 0
    with open(out, "a", encoding="utf-8") as f:
        for it in items:
            if (it["q_id"], a.day) in done: continue
            if a.dry_run:
                picks = random.sample(names, random.randint(2, 5))
                text = f"[모의] {it['text']} → 추천: " + ", ".join(p + ("시" if not p.endswith(("시","군","구")) and random.random() < 0.3 else "") for p in picks)
                cites = [{"url": random.choice(["https://www.guro.go.kr/a", "https://blog.naver.com/x", "https://korean.visitkorea.or.kr/y", "https://www.hscity.go.kr/b"])}]
                rid = "dry"
            else:
                resp = client.responses.create(model=a.model, tools=[{"type": "web_search"}], input=it["text"])
                text, cites = "", []
                for item in resp.output:
                    if getattr(item, "type", "") == "message":
                        for c in item.content:
                            if getattr(c, "type", "") == "output_text":
                                text += c.text
                                for an in getattr(c, "annotations", []) or []:
                                    if getattr(an, "type", "") == "url_citation": cites.append({"url": an.url})
                rid = resp.id
            f.write(json.dumps(dict(week=a.week, day=a.day, q_id=it["q_id"], unit_id=it["unit_id"], lang=it["lang"], question=it["text"],
                                    answer=text, citations=cites, asked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), model=a.model, response_id=rid), ensure_ascii=False) + "\n")
            n += 1
    print(f"{n}회 기록 → {out}")

# ---------- extract ----------
def build_matchers(gaz):
    """반환: [(unit_id, pattern, needs_context)] — 긴 이름부터. 동명(중구·서구…)은 시·도 문맥 필요."""
    ms = []
    for u in gaz:
        amb = u["status"] == "동명 해소 필요"
        pats = [u["name"]]
        if u["level"] == "기초":
            pats.append(f"{u['sido']} {u['short']}"); pats.append(f"{u['sido']}{u['short']}")
            if not amb: pats.append(u["short"])
        for al in u["aliases"]:
            pats.append(al)
        for p in pats:
            ms.append((u["unit_id"], re.compile(re.escape(p)), amb and p == u["short"], u["sido"]))
    ms.sort(key=lambda m: -len(m[1].pattern))
    return ms

def extract_cmd(a):
    gaz = load_gaz(); ms = build_matchers(gaz)
    # 모호 토큰: 광역명 짧은 별칭이 기초명과 겹치는 경우(광주)
    out = week_dir(a.week) / "mentions.jsonl"
    rows = [json.loads(l) for l in open(week_dir(a.week) / "answers.jsonl", encoding="utf-8")]
    decl = load_decl()
    idf = open(week_dir(a.week) / "identity.jsonl", "w", encoding="utf-8")
    with open(out, "w", encoding="utf-8") as f:
        for r in rows:
            text = r["answer"]; found = {}
            if r["q_id"].startswith("ID-"):
                uid = r["unit_id"]
                for e in decl.get(uid, []):
                    hit = [k for k in e["keywords"] if k and k in text]
                    idf.write(json.dumps(dict(week=r["week"], unit_id=uid, kind=e["kind"], element=e["element"], hit=bool(hit), hit_keywords=hit), ensure_ascii=False) + "\n")
                continue
            for uid, pat, needs_ctx, sido in ms:
                for m in pat.finditer(text):
                    if needs_ctx and sido not in text[max(0, m.start() - 20): m.start()]: continue
                    if uid not in found: found[uid] = dict(pos=m.start(), term=m.group(0))
            order = sorted(found.items(), key=lambda kv: kv[1]["pos"])
            official = [c["url"] for c in r.get("citations", []) if any(c["url"].split("/")[2].endswith(s) for s in OFFICIAL_SUFFIX)] if r.get("citations") else []
            for rank, (uid, v) in enumerate(order, 1):
                f.write(json.dumps(dict(week=r["week"], day=r["day"], q_id=r["q_id"], lang=r["lang"], unit_id=uid, term=v["term"],
                                        first_three=rank <= 3, official_cited=bool(official), official_urls=official), ensure_ascii=False) + "\n")
    idf.close()
    print(f"등장 추출 → {out} · 정체성 → identity.jsonl")

# ---------- window ----------
def window_cmd(a):
    weeks = prev_weeks(a.week, 4)
    obs = collections.defaultdict(lambda: collections.defaultdict(int))   # (unit,q) -> week -> count
    nobs = collections.defaultdict(int)                                   # q -> total observations in window
    offi = collections.defaultdict(int)
    for w in weeks:
        p = ROOT / "runs_weekly" / w / "mentions.jsonl"
        ap = ROOT / "runs_weekly" / w / "answers.jsonl"
        if ap.exists():
            for l in open(ap, encoding="utf-8"): nobs[json.loads(l)["q_id"]] += 1
        if not p.exists(): continue
        for l in open(p, encoding="utf-8"):
            m = json.loads(l)
            if m["q_id"].startswith("ID-"): continue
            obs[(m["unit_id"], m["q_id"])][w] += 1
            if m["official_cited"]: offi[(m["unit_id"], m["q_id"])] += 1
    this, last = weeks[0], weeks[1:]
    out = week_dir(a.week) / "states.csv"
    with open(out, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(["unit_id", "q_id", "hits_4w", "obs_4w", "hits_this_week", "hits_prev_3w", "state", "official_share"])
        for (uid, q), byw in obs.items():
            h = sum(byw.values()); ht = byw.get(this, 0); hp = sum(byw.get(x, 0) for x in last)
            n = nobs.get(q, 0)
            if ht >= 2 and hp == 0: state = "신규"
            elif h >= 9: state = "안정"
            elif h >= 3: state = "가끔"
            elif ht == 0 and hp >= 6 and all(byw.get(x, 0) == 0 for x in weeks[:2]): state = "소멸"
            else: state = "드묾"
            w.writerow([uid, q, h, n, ht, hp, state, round(offi[(uid, q)] / h, 2) if h else 0])
    print(f"4주 창 상태 → {out}")

# ---------- cards ----------
def cards_cmd(a):
    gaz = {u["unit_id"]: u for u in load_gaz()}
    qs = {q["q_id"]: q for q in csv.DictReader(open(QS, encoding="utf-8"))}
    states = list(csv.DictReader(open(week_dir(a.week) / "states.csv", encoding="utf-8")))
    by_unit = collections.defaultdict(list)
    for s in states: by_unit[s["unit_id"]].append(s)
    # 새로 읽은 공식 페이지: 이번 주 인용된 go.kr URL 중 지난 4주에 없던 것
    weeks = prev_weeks(a.week, 5)
    seen_prev, seen_now = set(), collections.Counter()
    for i, w in enumerate(weeks):
        p = ROOT / "runs_weekly" / w / "mentions.jsonl"
        if not p.exists(): continue
        for l in open(p, encoding="utf-8"):
            for u in json.loads(l)["official_urls"]:
                (seen_now if i == 0 else seen_prev).update([u]) if i == 0 else seen_prev.add(u)
    new_pages = [u for u in seen_now if u not in seen_prev]
    ident = collections.defaultdict(dict)   # unit -> element -> (kind, hit)
    ip = week_dir(a.week) / "identity.jsonl"
    if ip.exists():
        for l in open(ip, encoding="utf-8"):
            r = json.loads(l); ident[r["unit_id"]][r["element"]] = (r["kind"], r["hit"])
    ident_prev = collections.defaultdict(dict)
    pw = prev_weeks(a.week, 2)[1]; ipp = ROOT / "runs_weekly" / pw / "identity.jsonl"
    if ipp.exists():
        for l in open(ipp, encoding="utf-8"):
            r = json.loads(l); ident_prev[r["unit_id"]][r["element"]] = r["hit"]
    cdir = week_dir(a.week) / "cards"; cdir.mkdir(exist_ok=True)
    weather = collections.Counter()
    for uid, u in gaz.items():
        ss = by_unit.get(uid, [])
        lines = [f"# {u['name']} — {a.week} 주간 진단 카드", "", "관측 질문 50·외국어 40 기준. 점수 없음, 4주 창 상태만.", ""]
        appear = [s for s in ss if s["state"] in ("안정", "가끔", "신규")]
        lines.append(f"**이번 4주 등장 질문: {len(appear)}**")
        for s in sorted(appear, key=lambda s: s["state"]):
            q = qs.get(s["q_id"], {}); lines.append(f"- [{s['state']}] {q.get('text','')} ({q.get('lang','')}) · 4주 {s['hits_4w']}/{s['obs_4w']}회 · 공식 근거 {float(s['official_share'])*100:.0f}%")
            weather[(q.get("category", ""), s["state"])] += 1
        gone = [s for s in ss if s["state"] == "소멸"]
        if gone:
            lines.append(""); lines.append("**사라진 것**")
            for s in gone: lines.append(f"- {qs.get(s['q_id'], {}).get('text','')}")
        idn = ident.get(uid, {})
        if idn:
            tell = [(e, h) for e, (k, h) in idn.items() if k == "알릴"]; stale = [(e, h) for e, (k, h) in idn.items() if k == "낡은"]
            lines.append(""); lines.append(f"**정체성 — \"{u['name']}는 어떤 곳이야\" 답에서**: 알릴 요소 {sum(h for _, h in tell)}/{len(tell)} 등장, 낡은 요소 {sum(h for _, h in stale)} 등장")
            for e, h in tell:
                ch = "" if ident_prev.get(uid, {}).get(e) is None or ident_prev[uid][e] == h else (" (지난주 → 새로 등장)" if h else " (지난주 → 사라짐)")
                lines.append(f"- {'●' if h else '○'} {e}{ch}")
            for e, h in stale:
                if h: lines.append(f"- ⚠ 낡은 요소 등장: {e}")
        dom = u.get("official_domain", "")
        mine = [p for p in new_pages if dom and dom in p]
        lines.append(""); lines.append("**AI가 새로 읽은 우리 공식 페이지**: " + (", ".join(mine) if mine else ("이번 주 없음" if dom else "공식 도메인 미기입 — gazetteer.csv official_domain 채우면 추적")))
        lines.append(""); lines.append("알리기 사건 등록 → 2주·6주 후 같은 질문을 다시 재어 전후를 보내드립니다.")
        (cdir / f"{uid}.md").write_text("\n".join(lines), encoding="utf-8")
    with open(week_dir(a.week) / "weather.csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f); w.writerow(["category", "state", "units"])
        for (cat, st), n in sorted(weather.items()): w.writerow([cat, st, n])
    print(f"카드 {len(gaz)}장 → {cdir} · 기상도 → weather.csv · 새로 읽힌 공식 URL {len(new_pages)}")

ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
p = sub.add_parser("ask"); p.add_argument("--week", required=True); p.add_argument("--day", required=True, choices=["mon", "tue", "wed", "fri"]); p.add_argument("--identity", action="store_true"); p.add_argument("--model", default=os.environ.get("MODEL", "gpt-5")); p.add_argument("--dry-run", action="store_true")
for c in ("extract", "window", "cards"):
    p = sub.add_parser(c); p.add_argument("--week", required=True)
a = ap.parse_args()
{"ask": ask_cmd, "extract": extract_cmd, "window": window_cmd, "cards": cards_cmd}[a.cmd](a)
