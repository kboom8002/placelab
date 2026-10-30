# 로그·판정 스키마

## instances.jsonl (문항 인스턴스)
| 필드 | 뜻 |
|---|---|
| instance_id | sha1(site_id|qid|params) 앞 10자. 재생성해도 같은 값 |
| site_id, site_name | 파일럿 지자체 |
| qid, area, duty, source, qtype, risk, ladder | 워크북 템플릿 메타데이터 |
| params | 치환된 매개변수 {토큰: 값} |
| question | 실제로 보낸 질문 원문 |
| rule, doc_type, law | 판정 규칙·정답 근거 문서 유형·근거 사무 |
| status | 확정 / 확인 필요(표집값 검증 전) / 기입 필요(표집값 미기입) |
| official_domains | 공식 도메인 목록(S2·S3 판정용) |

## runs/<run_id>/answers.jsonl (측정 1회 = 1행)
| 필드 | 뜻 |
|---|---|
| run_id, instance_id, site_id, qid | 키 |
| day, rep | 측정일 차수(1–3)·하루 반복(1–3) |
| asked_at | UTC ISO 시각 |
| model, tool | 모델명, web_search |
| question, answer | 질문 원문, 답변 원문(가공 없음) |
| citations | [{url,title,start,end}] 답변 안 인용 순서대로 |
| response_id, error, answer_hash | 원응답 id, 오류 문자열, 답변 해시(변동 감지) |

## ledger.csv (정답 원장)
instance_id · site · qid · risk · qtype · question · status · official_url_1 · official_url_2(고위험 필수) · answer_key(정답 요지; `;`로 구분) · numbers(숫자·날짜; 공백 구분) · supply_gap(Y) · ledger_author · second_author(고위험) · checked_date · note

## runs/<run_id>/judgments.jsonl
| 필드 | 뜻 |
|---|---|
| s1 | 인용 있음 |
| s2 | 공식 도메인 인용 있음 |
| s3 | 첫 인용이 공식 도메인 → 공개 지표 ‘공식 근거율’의 분자 |
| s4 | 맞음 후보 / 다름 후보 / 보류 / 공급 공백 (최종은 사람) |
| supply_gap | 원장 기준 공식 문서 없음 → 분모 제외 |
| harm_flag | 고위험 문항 + 공식 근거 없음 + 숫자·연락처 단정 → 공개 지표 ‘피해 위험 건수’ 후보 |
| first_domain, n_cites | 첫 인용 도메인, 인용 수 |

## summary.csv — 지자체별: answers, supply_gap, s1_rate, s2_rate, s3_official_rate, s4_*, harm_flags, unstable_instances(9회 중 3회 이상 변동)
## human_queue.csv — 사람 판정 대기(고위험 우선): judge_A, judge_B(고위험), final, note 를 채운다
