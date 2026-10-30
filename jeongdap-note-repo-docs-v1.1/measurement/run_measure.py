#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
측정 실행기 — OpenAI Responses API(web_search 도구)로 문항 인스턴스를 묻고 원본 답변·인용 URL을 기록한다.
  입력: instances.jsonl
  출력: runs/<run_id>/answers.jsonl  (1행 = 1회 질문; 인스턴스 × 반복)
사용:
  export OPENAI_API_KEY=...
  python run_measure.py --instances instances.jsonl --run-id pilot_2026-10-09 --day 1 --reps 3 [--model gpt-5] [--only-status 확정] [--dry-run]
설계 원칙(방법론 v1.0 3장):
  · 하루 3회 × 3일 = 9회. --day 와 --reps 로 나눠 실행하고 run_id 를 같게 두면 한 파일에 쌓인다.
  · 질문은 그대로 보낸다(시스템 프롬프트 없음). 답변 유도 금지.
  · 로그에는 모델·도구·시각·원문·인용 URL 전부를 남긴다(정직 기록).
  · 기관 시스템에 접속하지 않는다. 모델이 공개 웹을 읽는 것만 허용.
"""
import argparse, json, os, time, datetime, pathlib, random, hashlib

ap = argparse.ArgumentParser()
ap.add_argument("--instances", default="instances.jsonl")
ap.add_argument("--run-id", required=True)
ap.add_argument("--day", type=int, required=True, help="측정일 차수 1..3")
ap.add_argument("--reps", type=int, default=3, help="하루 반복 횟수")
ap.add_argument("--model", default=os.environ.get("MODEL", "gpt-5"))
ap.add_argument("--only-status", default="확정", help="확정 | 확정,확인 필요 | all")
ap.add_argument("--sites", default="all", help="쉼표 구분 site_id")
ap.add_argument("--limit", type=int, default=0)
ap.add_argument("--sleep", type=float, default=0.3)
ap.add_argument("--dry-run", action="store_true", help="API 호출 없이 모의 답변으로 파이프라인 점검")
args = ap.parse_args()

inst = [json.loads(l) for l in open(args.instances, encoding="utf-8")]
if args.only_status != "all":
    ok = set(s.strip() for s in args.only_status.split(","))
    inst = [i for i in inst if i["status"] in ok]
if args.sites != "all":
    ss = set(args.sites.split(","))
    inst = [i for i in inst if i["site_id"] in ss]
if args.limit:
    inst = inst[: args.limit]

out_dir = pathlib.Path("runs") / args.run_id
out_dir.mkdir(parents=True, exist_ok=True)
out_path = out_dir / "answers.jsonl"
done = set()
if out_path.exists():
    for l in open(out_path, encoding="utf-8"):
        r = json.loads(l); done.add((r["instance_id"], r["day"], r["rep"]))

client = None
if not args.dry_run:
    from openai import OpenAI
    client = OpenAI()

def ask(question):
    """질문 1회. 반환: (답변 원문, 인용 목록[{url,title,start,end}], 검색 후보 출처[{url,title}], 원응답 id, 반환 모델 버전)"""
    if args.dry_run:
        fake = ["https://www.guro.go.kr/www/x", "https://blog.naver.com/x", "https://www.gov.kr/x"]
        picked = random.choice(fake)
        return (f"[모의 답변] {question} → 주민센터에서 하시면 됩니다. 수수료 400원.",
                [{"url": picked, "title": "모의", "start": 0, "end": 0}],
                [{"url": picked, "title": "모의 후보"}],
                "dry",
                args.model)
    last_err = None
    for attempt in range(1, 4):
        try:
            resp = client.responses.create(
                model=args.model,
                tools=[{"type": "web_search"}],
                include=["web_search_call.action.sources"],
                input=question,
            )
            break
        except Exception as e:
            last_err = e
            if attempt == 3:
                raise last_err
            time.sleep((2 ** attempt) + random.uniform(0, 0.5))

    text, cites, tool_sources = "", [], []
    for item in resp.output:
        itype = getattr(item, "type", "")
        if itype == "web_search_call":
            action = getattr(item, "action", None)
            for src in getattr(action, "sources", []) or []:
                u = getattr(src, "url", "") if not isinstance(src, dict) else src.get("url", "")
                t = getattr(src, "title", "") if not isinstance(src, dict) else src.get("title", "")
                if u:
                    tool_sources.append({"url": u, "title": t})
        elif itype == "message":
            for c in item.content:
                if getattr(c, "type", "") == "output_text":
                    text += c.text
                    for a in getattr(c, "annotations", []) or []:
                        if getattr(a, "type", "") == "url_citation":
                            cites.append({"url": a.url, "title": getattr(a, "title", ""),
                                          "start": getattr(a, "start_index", 0), "end": getattr(a, "end_index", 0)})
    model_ver = getattr(resp, "model", None) or args.model
    return text, cites, tool_sources, resp.id, model_ver

n = 0
with open(out_path, "a", encoding="utf-8") as f:
    for i in inst:
        for rep in range(1, args.reps + 1):
            key = (i["instance_id"], args.day, rep)
            if key in done:
                continue
            t0 = datetime.datetime.now(datetime.timezone.utc).isoformat()
            try:
                text, cites, tool_sources, rid, model_ver = ask(i["question"])
                err = ""
            except Exception as e:  # 실패도 기록한다
                text, cites, tool_sources, rid, model_ver, err = "", [], [], "", args.model, repr(e)
            rec = dict(run_id=args.run_id, instance_id=i["instance_id"], site_id=i["site_id"], qid=i["qid"],
                       day=args.day, rep=rep, asked_at=t0, model=args.model, model_version=model_ver,
                       tool="web_search", search_tool_version="web_search:responses_v1",
                       question=i["question"], answer=text, citations=cites, tool_sources=tool_sources,
                       response_id=rid, error=err,
                       answer_hash=hashlib.sha1(text.encode()).hexdigest()[:12])
            f.write(json.dumps(rec, ensure_ascii=False) + "\n"); f.flush()
            n += 1
            time.sleep(args.sleep)
print(f"{n}회 기록 → {out_path}")
