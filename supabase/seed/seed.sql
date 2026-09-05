-- supabase/seed/seed.sql
-- K02, K03, K04 기반 초기 시드 데이터

-- 1. 방법론 버전 (v1.0)
insert into method_versions (version, named_count, unnamed_count, effective_from, notes)
values ('v1.0', 12, 8, '2026-09-01', 'kplacelab 초기 표준 방법론 v1.0')
on conflict (version) do nothing;

-- 2. 광역 자치단체 (16곳)
insert into units (id, population, unit_type, name, name_en, sgg_code, domain_form, contracting_body, active) values
('lg-11000', 'local_gov', 'metro', '서울특별시', 'Seoul', '11000', 'A', '서울특별시청', true),
('lg-26000', 'local_gov', 'metro', '부산광역시', 'Busan', '26000', 'A', '부산광역시청', true),
('lg-27000', 'local_gov', 'metro', '대구광역시', 'Daegu', '27000', 'A', '대구광역시청', true),
('lg-28000', 'local_gov', 'metro', '인천광역시', 'Incheon', '28000', 'A', '인천광역시청', true),
('lg-29000', 'local_gov', 'metro', '전남광주통합특별시', 'Jeonnam-Gwangju', '29000', 'A', '전남광주통합특별시청', true),
('lg-30000', 'local_gov', 'metro', '대전광역시', 'Daejeon', '30000', 'A', '대전광역시청', true),
('lg-31000', 'local_gov', 'metro', '울산광역시', 'Ulsan', '31000', 'A', '울산광역시청', true),
('lg-36000', 'local_gov', 'metro', '세종특별자치시', 'Sejong', '36000', 'A', '세종특별자치시청', true),
('lg-41000', 'local_gov', 'metro', '경기도', 'Gyeonggi-do', '41000', 'A', '경기도청', true),
('lg-42000', 'local_gov', 'metro', '강원특별자치도', 'Gangwon-do', '42000', 'A', '강원특별자치도청', true),
('lg-43000', 'local_gov', 'metro', '충청북도', 'Chungcheongbuk-do', '43000', 'A', '충청북도청', true),
('lg-44000', 'local_gov', 'metro', '충청남도', 'Chungcheongnam-do', '44000', 'A', '충청남도청', true),
('lg-45000', 'local_gov', 'metro', '전북특별자치도', 'Jeonbuk-do', '45000', 'A', '전북특별자치도청', true),
('lg-47000', 'local_gov', 'metro', '경상북도', 'Gyeongsangbuk-do', '47000', 'A', '경상북도청', true),
('lg-48000', 'local_gov', 'metro', '경상남도', 'Gyeongsangnam-do', '48000', 'A', '경상남도청', true),
('lg-50000', 'local_gov', 'metro', '제주특별자치도', 'Jeju-do', '50000', 'A', '제주특별자치도청', true)
on conflict (id) do nothing;

-- 3. 대표 기초 자치단체
insert into units (id, population, unit_type, name, name_en, sgg_code, parent_unit_id, domain_form, contracting_body, is_depop_area, active) values
('lg-41650', 'local_gov', 'basic', '포천시', 'Pocheon-si', '41650', 'lg-41000', 'A', '포천시청', true, true),
('lg-41110', 'local_gov', 'special_city', '수원시', 'Suwon-si', '41110', 'lg-41000', 'A', '수원시청', false, true),
('lg-41130', 'local_gov', 'special_city', '성남시', 'Seongnam-si', '41130', 'lg-41000', 'A', '성남시청', false, true),
('lg-41280', 'local_gov', 'special_city', '고양시', 'Goyang-si', '41280', 'lg-41000', 'A', '고양시청', false, true),
('lg-41460', 'local_gov', 'special_city', '용인시', 'Yongin-si', '41460', 'lg-41000', 'A', '용인시청', false, true),
('lg-48120', 'local_gov', 'special_city', '창원시', 'Changwon-si', '48120', 'lg-48000', 'A', '창원시청', false, true),
('lg-11110', 'local_gov', 'basic', '종로구', 'Jongno-gu', '11110', 'lg-11000', 'A', '종로구청', false, true),
('lg-11680', 'local_gov', 'basic', '강남구', 'Gangnam-gu', '11680', 'lg-11000', 'A', '강남구청', false, true),
('lg-42150', 'local_gov', 'basic', '강릉시', 'Gangneung-si', '42150', 'lg-42000', 'A', '강릉시청', false, true),
('lg-43770', 'local_gov', 'basic', '증평군', 'Jeungpyeong-gun', '43770', 'lg-43000', 'A', '증평군청', true, true)
on conflict (id) do nothing;

-- 4. 경제자유구역 (A형 6곳: 자체 도메인 독립 계약 주체)
insert into units (id, population, unit_type, name, name_en, domain_form, contracting_body, active) values
('sz-fez-ifez',  'special_zone', 'fez', '인천경제자유구역',   'IFEZ',  'A', '인천경제자유구역청', true),
('sz-fez-bjfez', 'special_zone', 'fez', '부산진해경제자유구역', 'BJFEZ', 'A', '부산진해경제자유구역청', true),
('sz-fez-gfez',  'special_zone', 'fez', '광양만권경제자유구역', 'GFEZ',  'A', '광양만권경제자유구역청', true),
('sz-fez-dgfez', 'special_zone', 'fez', '대구경북경제자유구역', 'DGFEZ', 'A', '대구경북경제자유구역청', true),
('sz-fez-jgfez', 'special_zone', 'fez', '전남광주경제자유구역', 'JGFEZ', 'A', '전남광주경제자유구역청', true),
('sz-fez-gsfez', 'special_zone', 'fez', '강원경제자유구역',   'GSFEZ', 'A', '강원경제자유구역청', true)
on conflict (id) do nothing;

-- 5. 경제자유구역 (B형 3곳: 시·도 산하 종속 도메인)
insert into units (id, population, unit_type, name, name_en, parent_unit_id, domain_form, contracting_body, active) values
('sz-fez-ggfez', 'special_zone', 'fez', '경기경제자유구역', 'GGFEZ', 'lg-41000', 'B', '경기도청', true),
('sz-fez-cbfez', 'special_zone', 'fez', '충북경제자유구역', 'CBFEZ', 'lg-43000', 'B', '충청북도청', true),
('sz-fez-ufez',  'special_zone', 'fez', '울산경제자유구역', 'UFEZ',  'lg-31000', 'B', '울산광역시청', true)
on conflict (id) do nothing;

-- 6. 단위 도메인 매핑 (A형 및 광역/기초)
insert into unit_domains (unit_id, host, role, scannable, active) values
('lg-11000', 'www.seoul.go.kr', 'main', true, true),
('lg-26000', 'www.busan.go.kr', 'main', true, true),
('lg-27000', 'www.daegu.go.kr', 'main', true, true),
('lg-28000', 'www.incheon.go.kr', 'main', true, true),
('lg-29000', 'www.jeonnam.go.kr', 'main', true, true),
('lg-30000', 'www.daejeon.go.kr', 'main', true, true),
('lg-31000', 'www.ulsan.go.kr', 'main', true, true),
('lg-36000', 'www.sejong.go.kr', 'main', true, true),
('lg-41000', 'www.gg.go.kr', 'main', true, true),
('lg-42000', 'state.gwd.go.kr', 'main', true, true),
('lg-43000', 'www.chungbuk.go.kr', 'main', true, true),
('lg-44000', 'www.chungnam.go.kr', 'main', true, true),
('lg-45000', 'www.jeonbuk.go.kr', 'main', true, true),
('lg-47000', 'www.gb.go.kr', 'main', true, true),
('lg-48000', 'www.gyeongnam.go.kr', 'main', true, true),
('lg-50000', 'www.jeju.go.kr', 'main', true, true),
('lg-41650', 'www.pocheon.go.kr', 'main', true, true),
('lg-41110', 'www.suwon.go.kr', 'main', true, true),
('lg-41130', 'www.seongnam.go.kr', 'main', true, true),
('lg-41280', 'www.goyang.go.kr', 'main', true, true),
('lg-41460', 'www.yongin.go.kr', 'main', true, true),
('lg-48120', 'www.changwon.go.kr', 'main', true, true),
('lg-11110', 'www.jongno.go.kr', 'main', true, true),
('lg-11680', 'www.gangnam.go.kr', 'main', true, true),
('lg-42150', 'www.gn.go.kr', 'main', true, true),
('lg-43770', 'www.jp.go.kr', 'main', true, true),
-- A형 경제자유구역
('sz-fez-ifez',  'www.ifez.go.kr', 'main', true, true),
('sz-fez-bjfez', 'www.bjfez.go.kr', 'main', true, true),
('sz-fez-gfez',  'www.gfez.go.kr', 'main', true, true),
('sz-fez-dgfez', 'www.dgfez.go.kr', 'main', true, true),
('sz-fez-jgfez', 'www.gjfez.go.kr', 'main', true, true),
('sz-fez-gsfez', 'gsfez.go.kr', 'main', true, true),
-- B형 경제자유구역 (scannable = false)
('sz-fez-ggfez', 'ggfez.gg.go.kr', 'main', false, true),
('sz-fez-cbfez', 'www.chungbuk.go.kr', 'other', false, true),
('sz-fez-ufez',  'www.ulsan.go.kr', 'other', false, true)
on conflict (unit_id, host, role) do nothing;

-- 7. 질문 은행 (K04 기준: 지명 12문항 + 무지명 8문항, 8블록 구조)
insert into question_bank (id, method_version, kind, seq, body, domain_tag, block_actor, block_situation, block_task, block_knowledge, block_workflow, block_format, block_language, block_output) values
('N01', 'v1.0', 'named', 1,  '{지역명} 대형폐기물 스티커 가격과 온라인 배출 신청 방법 알려줘', '폐기물', '주민', '이사/가구교체', '배출신청', '수수료표', '온라인신청', '비교표', 'ko', '안내'),
('N02', 'v1.0', 'named', 2,  '{지역명} 전입신고 후 받을 수 있는 전입지원 혜택이나 출산축하금이 있어?', '전입', '신규주민', '전입신고', '지원혜택', '신청절차', '목록', 'ko', '안내'),
('N03', 'v1.0', 'named', 3,  '{지역명} 종량제봉투 종류별 가격과 불연성 마대 파는 곳 어디야?', '환경', '주민', '쓰레기배출', '규격봉투', '판매처조회', '요약', 'ko', '안내'),
('N04', 'v1.0', 'named', 4,  '{지역명} 청년 기본소득이나 청년 월세 지원 대상 조건과 신청 기간 알려줘', '복지', '청년', '월세지원', '자격요건', '접수일정', '항목화', 'ko', '안내'),
('N05', 'v1.0', 'named', 5,  '{지역명} 둘째 아이 낳으면 나오는 출산지원금과 산후조리비 지원 내용 뭐야?', '출산', '부모', '출산예정', '지원금액', '지급기준', '단계별', 'ko', '안내'),
('N06', 'v1.0', 'named', 6,  '{지역명} 당일치기 여행 코스로 가볼 만한 대표 명소 3곳 추천해줘', '관광', '관광객', '여행계획', '관광지', '동선추천', '추천목록', 'ko', '안내'),
('N07', 'v1.0', 'named', 7,  '{지역명} 올해 열리는 대표 축제 일정과 장소 안내해줘', '축제', '주민/방문객', '행사참여', '축제일정', '장소안내', '일정표', 'ko', '안내'),
('N08', 'v1.0', 'named', 8,  '{지역명} 시립/구립 도서관 열람실 휴관일과 대출 권수 어떻게 돼?', '문화', '이용자', '도서관이용', '이용시간', '회원가입', '간략안내', 'ko', '안내'),
('N09', 'v1.0', 'named', 9,  '{지역명} 야간·휴일 영유아 진료 가능한 달빛어린이병원이나 소아과 있어?', '보건', '부모', '응급상황', '병원목록', '운영시간', '목록', 'ko', '안내'),
('N10', 'v1.0', 'named', 10, '{지역명} 65세 이상 어르신 교통비 지원이나 목욕권 지급 제도 있어?', '노인복지', '어르신', '복지이용', '교통비지원', '지급처', '요약', 'ko', '안내'),
('N11', 'v1.0', 'named', 11, '{지역명} 소상공인 특례보증 대출 조건과 이자 지원 사업 신청 방법 알려줘', '경제', '소상공인', '대출지원', '보증한도', '서류준비', '단계별', 'ko', '안내'),
('N12', 'v1.0', 'named', 12, '{지역명} 시청/구청 민원실 점심시간 휴무제 시행하는지, 주차요금 얼마야?', '행정', '민원인', '청사방문', '운영시간', '주차안내', '안내문', 'ko', '안내'),
-- 무지명 8문항
('U01', 'v1.0', 'unnamed', 1, '서울 근교에서 대중교통으로 가기 좋은 당일치기 여행지 5곳 추천해줘', '관광', '여행자', '근교여행', '지자체관광자원', '교통편', '목록', 'ko', '추천'),
('U02', 'v1.0', 'unnamed', 2, '가을에 단풍 구경하고 걷기 좋은 호수나 산책로 있는 국내 소도시 어디야?', '관광', '방문객', '계절여행', '자연경관', '명소', '목록', 'ko', '추천'),
('U03', 'v1.0', 'unnamed', 3, '아이들과 함께 주말에 역사 체험이나 박물관 투어 가기 좋은 지자체 추천해줘', '교육', '가족', '주말나들이', '역사유적', '체험관광', '목록', 'ko', '추천'),
('U04', 'v1.0', 'unnamed', 4, '청년이 귀농·귀촌해서 스마트팜 창업 지원받기 좋은 지역 3곳 알려줘', '정주', '귀농희망자', '스마트팜', '귀농지원', '정착금', '비교', 'ko', '추천'),
('U05', 'v1.0', 'unnamed', 5, '수도권 인근에서 주말에 차박이나 캠핑하기 좋은 지자체 운영 야영장 어디 있어?', '레저', '캠핑족', '야영장탐색', '공공캠핑장', '예약안내', '목록', 'ko', '추천'),
('U06', 'v1.0', 'unnamed', 6, '지역화폐 인센티브나 할인율 높은 국내 지방자치단체 어디야?', '생활', '주민/방문객', '소비혜택', '지역사랑상품권', '할인율', '비교', 'ko', '안내'),
('U07', 'v1.0', 'unnamed', 7, '조용하게 한 달 살기 하면서 워케이션 하기 좋은 자연 친화적 지자체 추천해줘', '정주', '워케이션', '체류관광', '한달살기지원', '숙소', '목록', 'ko', '추천'),
('U08', 'v1.0', 'unnamed', 8, '해외 투자유치 혜택이나 세제 감면이 큰 국내 경제자유구역 3곳 비교해줘', '투자', '투자자', '입지선정', '경제자유구역', '세제감면', '비교표', 'ko', '비교')
on conflict (id) do nothing;

-- 8. 예비 실측 기반 판정 초기 승격 데이터 (K09 기반 실측값 시드)
-- 인천, 부산진해, 광양만권 (open, 2주 이상 연속 확인 가정)
insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'open', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'sz-fez-ifez' and d.role = 'main'
on conflict (domain_id) do nothing;

insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'open', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'sz-fez-bjfez' and d.role = 'main'
on conflict (domain_id) do nothing;

insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'open', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'sz-fez-gfez' and d.role = 'main'
on conflict (domain_id) do nothing;

-- 대구경북 (no_file)
insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'no_file', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'sz-fez-dgfez' and d.role = 'main'
on conflict (domain_id) do nothing;

-- 강원 (blocked_all)
insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'blocked_all', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'sz-fez-gsfez' and d.role = 'main'
on conflict (domain_id) do nothing;

-- 전남광주 (undetermined / timeout)
insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'undetermined', 'timeout', 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'sz-fez-jgfez' and d.role = 'main'
on conflict (domain_id) do nothing;

-- 대표 지자체 포천시, 서울특별시 판정 시드 (open)
insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'open', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'lg-41650' and d.role = 'main'
on conflict (domain_id) do nothing;

insert into verdicts (domain_id, robots_verdict, undetermined_reason, method_version, confirmed_from, confirmed_at, consecutive_weeks, published)
select d.id, 'open', null, 'v1.0', now() - interval '14 days', now(), 2, true
from unit_domains d where d.unit_id = 'lg-11000' and d.role = 'main'
on conflict (domain_id) do nothing;

-- 9. 증거 대장 연계 초기 사전등록 시드 (EVIDENCE.md C-1 연계)
insert into preregistrations (id, title, claim_id, hypothesis, method_version, method_summary, criteria, falsification, stop_rule, status, published_at, started_at)
values (
  'prereg-2026-c1',
  '전국 자치단체 및 특별구역 Layer 1 기술 접근성 기준선 측정',
  'C-1',
  '공공 도메인의 상당수가 AI 수집기에 닫혀 있거나 비정상 설정 상태이다',
  'v1.0',
  '243개 자치단체 및 A형 경제자유구역 대상 robots.txt 및 sitemap 주간 자동 스캔',
  'open / blocked_all / blocked_selective / no_file / undetermined 5분 판정',
  '전수 조사 결과 blocked_* 및 undetermined 합계가 10% 미만일 때',
  '전수 도메인 스캔 2주 연속 완료 시점',
  'published',
  now() - interval '7 days',
  now() - interval '6 days'
)
on conflict (id) do nothing;
