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
insert into unit_domains (unit_id, host, role, scannable, active, path_prefix) values
('lg-11000', 'www.seoul.go.kr', 'main', true, true, null),
('lg-26000', 'www.busan.go.kr', 'main', true, true, null),
('lg-27000', 'www.daegu.go.kr', 'main', true, true, null),
('lg-28000', 'www.incheon.go.kr', 'main', true, true, null),
('lg-29000', 'www.jeonnam.go.kr', 'main', true, true, null),
('lg-30000', 'www.daejeon.go.kr', 'main', true, true, null),
('lg-31000', 'www.ulsan.go.kr', 'main', true, true, null),
('lg-36000', 'www.sejong.go.kr', 'main', true, true, null),
('lg-41000', 'www.gg.go.kr', 'main', true, true, null),
('lg-42000', 'state.gwd.go.kr', 'main', true, true, null),
('lg-43000', 'www.chungbuk.go.kr', 'main', true, true, null),
('lg-44000', 'www.chungnam.go.kr', 'main', true, true, null),
('lg-45000', 'www.jeonbuk.go.kr', 'main', true, true, null),
('lg-47000', 'www.gb.go.kr', 'main', true, true, null),
('lg-48000', 'www.gyeongnam.go.kr', 'main', true, true, null),
('lg-50000', 'www.jeju.go.kr', 'main', true, true, null),
('lg-41650', 'www.pocheon.go.kr', 'main', true, true, null),
('lg-41110', 'www.suwon.go.kr', 'main', true, true, null),
('lg-41130', 'www.seongnam.go.kr', 'main', true, true, null),
('lg-41280', 'www.goyang.go.kr', 'main', true, true, null),
('lg-41460', 'www.yongin.go.kr', 'main', true, true, null),
('lg-48120', 'www.changwon.go.kr', 'main', true, true, null),
('lg-11110', 'www.jongno.go.kr', 'main', true, true, null),
('lg-11680', 'www.gangnam.go.kr', 'main', true, true, null),
('lg-42150', 'www.gn.go.kr', 'main', true, true, null),
('lg-43770', 'www.jp.go.kr', 'main', true, true, null),
-- A형 경제자유구역
('sz-fez-ifez',  'www.ifez.go.kr', 'main', true, true, null),
('sz-fez-bjfez', 'www.bjfez.go.kr', 'main', true, true, null),
('sz-fez-gfez',  'www.gfez.go.kr', 'main', true, true, null),
('sz-fez-dgfez', 'www.dgfez.go.kr', 'main', true, true, null),
('sz-fez-jgfez', 'www.gjfez.go.kr', 'main', true, true, null),
('sz-fez-gsfez', 'gsfez.go.kr', 'main', true, true, null),
-- B형 경제자유구역 (scannable = false)
('sz-fez-ggfez', 'ggfez.gg.go.kr', 'main', false, true, null),
('sz-fez-cbfez', 'www.chungbuk.go.kr', 'other', false, true, '/eco'),
('sz-fez-ufez',  'www.ulsan.go.kr', 'other', false, true, '/s/ufez')
on conflict (unit_id, host, role) do nothing;

-- 7. 질문 은행 (K04 기준: 지명 12문항 + 무지명 8문항, 8블록 14개 컬럼 엄격 일치)
insert into question_bank (
  id, method_version, kind, seq, body, domain_tag,
  block_actor, block_situation, block_task, block_knowledge,
  block_workflow, block_format, block_language, block_output
) values
-- 지명 12문항 (각 행 14개 값)
('N01', 'v1.0', 'named', 1,  '대형폐기물은 어떻게 버리나요? 수수료와 신청 방법을 알려주세요.', '생활폐기물',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '대형폐기물은 어떻게 버리나요? 수수료와 신청 방법을 알려주세요.', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N02', 'v1.0', 'named', 2,  '다른 지역에서 이사 왔습니다. 전입신고는 어디서 어떻게 하나요?', '민원',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '다른 지역에서 이사 왔습니다. 전입신고는 어디서 어떻게 하나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N03', 'v1.0', 'named', 3,  '재활용 분리배출은 무슨 요일에 하나요?', '환경',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '재활용 분리배출은 무슨 요일에 하나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N04', 'v1.0', 'named', 4,  '청년을 위한 지원 사업에는 무엇이 있나요?', '청년',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '청년을 위한 지원 사업에는 무엇이 있나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N05', 'v1.0', 'named', 5,  '출산하면 받을 수 있는 지원금이 얼마인가요?', '출산·양육',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '출산하면 받을 수 있는 지원금이 얼마인가요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N06', 'v1.0', 'named', 6,  '대표적인 관광지는 어디이고 입장료와 운영시간은 어떻게 되나요?', '관광',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '대표적인 관광지는 어디이고 입장료와 운영시간은 어떻게 되나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N07', 'v1.0', 'named', 7,  '대표 축제는 언제 열리나요?', '문화·축제',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '대표 축제는 언제 열리나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N08', 'v1.0', 'named', 8,  '공공도서관 운영시간과 휴관일을 알려주세요.', '도서관',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '공공도서관 운영시간과 휴관일을 알려주세요.', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N09', 'v1.0', 'named', 9,  '어린이집 입소 대기는 어떻게 확인하나요?', '보육',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '어린이집 입소 대기는 어떻게 확인하나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N10', 'v1.0', 'named', 10, '노인 일자리 사업은 어떻게 신청하나요?', '노인',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '노인 일자리 사업은 어떻게 신청하나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N11', 'v1.0', 'named', 11, '소상공인이 받을 수 있는 지원이 있나요?', '소상공인',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '소상공인이 받을 수 있는 지원이 있나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

('N12', 'v1.0', 'named', 12, '시청(군청·구청) 민원실 운영시간과 주차는 어떻게 되나요?', '청사',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '시청(군청·구청) 민원실 운영시간과 주차는 어떻게 되나요?', null,
 '각 항목마다 답변 2~3문장 + 확신도', '[번호] 답변 / 확신도: 높음|보통|낮음', 'ko', '마지막에 확신도를 표로 정리'),

-- 무지명 8문항 (각 행 14개 값)
('U01', 'v1.0', 'unnamed', 1, '{상위광역}에서 당일치기로 갈 만한 곳 5곳을 추천해 주세요.', '근거리 여행',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '{상위광역}에서 당일치기로 갈 만한 곳 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U02', 'v1.0', 'unnamed', 2, '가을에 가기 좋은 국내 여행지 5곳을 추천해 주세요.', '계절 여행',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '가을에 가기 좋은 국내 여행지 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U03', 'v1.0', 'unnamed', 3, '수도권에서 가까우면서 자연 경관이 좋은 곳 5곳을 추천해 주세요.', '자연 경관',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '수도권에서 가까우면서 자연 경관이 좋은 곳 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U04', 'v1.0', 'unnamed', 4, '아이와 함께 가기 좋은 {상위광역} 여행지 5곳을 추천해 주세요.', '가족 여행',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '아이와 함께 가기 좋은 {상위광역} 여행지 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U05', 'v1.0', 'unnamed', 5, '귀농이나 귀촌하기 좋은 지역 5곳을 추천해 주세요.', '귀농·귀촌',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '귀농이나 귀촌하기 좋은 지역 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U06', 'v1.0', 'unnamed', 6, '청년 창업 지원이 잘 되어 있는 시·군 5곳을 추천해 주세요.', '청년 창업',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '청년 창업 지원이 잘 되어 있는 시·군 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U07', 'v1.0', 'unnamed', 7, '조용하고 살기 좋은 중소도시 5곳을 추천해 주세요.', '정주 여건',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '조용하고 살기 좋은 중소도시 5곳을 추천해 주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.'),

('U08', 'v1.0', 'unnamed', 8, '{상위광역}의 대표적인 축제 5개를 알려주세요.', '축제',
 null, '웹 검색을 하지 마세요. 알고 있는 지식만으로 답해 주세요.', '{상위광역}의 대표적인 축제 5개를 알려주세요.', null,
 '각각 구체적인 지역명 5곳씩을 추천하고, 각 지역마다 추천 이유를 한 줄로 적어 주세요.', '[번호] 답변', 'ko', '마지막에 8개 질문에서 언급한 지역명을 전부 모아 등장 횟수가 많은 순서대로 표로 정리해 주세요.')
on conflict (id) do nothing;

-- 8. 예비 실측 기반 판정 초기 승격 데이터 (K09 기반 실측값 시드)
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
