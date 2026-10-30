import json
from sets import SEOUL,GANGNAM,JEJU,SEOGWIPO
from ml import ML,GLOSS,VISIT
css=open('base.css',encoding='utf-8').read()
extra=r"""
.meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.82rem;color:var(--ink2);margin:10px 0 0}
.meta b{color:var(--ink)}
.slot{display:inline-block;font-size:.7rem;font-weight:800;border-radius:5px;padding:0 6px;border:1px solid var(--line);color:var(--ink2);margin-right:4px}
.slot-A{border-color:var(--blue);color:var(--blue)}.slot-C{border-color:var(--pen);color:var(--pen)}.slot-D{border-color:var(--old);color:var(--old)}.slot-E{border-color:var(--unk)}
.mtx{width:100%;border-collapse:collapse;font-size:.86rem;margin-top:6px}.mtx td,.mtx th{border:1px solid var(--line);padding:6px;text-align:center}.mtx th{background:var(--soft);font-weight:700}
.subtabs{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}.subtabs button{border:1px solid var(--line);background:var(--card);color:var(--ink2);border-radius:999px;padding:3px 10px;font-size:.82rem}.subtabs button[aria-pressed="true"]{border-color:var(--ink);color:var(--ink);font-weight:700}
.key{display:grid;grid-template-columns:7em minmax(0,1fr);gap:4px 10px;font-size:.9rem}.key dt{color:var(--ink2)}.key dd{margin:0}
.ci{font-size:.78rem;color:var(--ink2);font-weight:400}
.prog{height:14px;background:var(--soft);border:1px solid var(--line);border-radius:7px;overflow:hidden}.prog i{display:block;height:100%;background:var(--pen);transition:width .3s}
.state{font-size:.78rem;font-weight:700;border-radius:6px;padding:1px 7px;border:1px solid}
.st-ok{color:var(--ok)}.st-warn{color:var(--old)}.st-bad{color:var(--nofact)}.st-info{color:var(--blue)}
.vote{border:1.5px solid var(--line);background:var(--card);color:var(--ink);border-radius:10px;padding:6px 10px;min-width:62px}
.vote[aria-pressed="true"]{border-color:var(--pen);color:var(--pen);font-weight:700}
.small{font-size:.82rem}
.layout2>*{min-width:0}
"""
SEED={
"rounds":[["2026-R0","사전 탐색","2026-09-22–24","광역 16 × 코어 24 · 3서비스 · 검색 끔/켬 · 반복 2 (+ 서울·제주·서귀포 다국어 예비 측정)","완료 (예시 데이터)"],["2026-R1","시범 회차","2026-10-27–29","광역 16 × 코어 24 + 시범 지역","예정"],["2026-R2","대한민국 영역 1회","2026-11-17–19","광역 16 × 60문항 + 보정 10%","예정"]],
"svc":["서비스 A","서비스 B","서비스 C"],
"calib":{"A":86,"B":79,"C":91},"kappa":0.84,"undecidable":3.1,
"areas":[["life","생활·행정","생활 정보"],["tour","관광·축제","놀러 갈 곳"],["traffic","교통","다니는 길"],["welfare","복지","도움 받는 법"],["foreign","외국인 정보","외국인 안내"],["safety","재난·안전","안전 정보"]],
"attrs":[["life.office_hours","민원 창구 운영 시간","life","시간표","정기","광·기·동",1,0],["life.office_address","청사·행정복지센터 소재지","life","주소","고정","광·기·동",1,0],["life.admin_name","행정구역 명칭·소속","life","명칭+승계","제도","광·기·동",1,0],["life.library_closed","공공도서관 휴관일","life","요일 규칙","정기","기·동",1,0],["life.waste_day","생활쓰레기 배출 요일","life","요일+시간","정기","기·동",0,0],["life.kiosk","무인민원발급기","life","목록+시간","정기","기·동",0,0],["life.civil_contact","대표 민원 전화","life","연락처","고정","광·기",0,0],["life.sports_facility","공공체육시설 운영·요금","life","시간표+금액","정기","기·동",0,0],
 ["tour.attraction_hours","대표 관광지 운영 시간","tour","시간표","정기","광·기",1,0],["tour.attraction_fee","관광지 입장료","tour","금액","정기","광·기",1,0],["tour.festival_dates","축제·행사 일정·장소","tour","날짜 구간+장소","행사","광·기·동",1,0],["tour.info_center","관광안내소·지원 언어","tour","주소+목록","고정","광·기",1,0],["tour.market_days","전통시장 장날","tour","날짜 규칙","정기","기·동",0,0],["tour.accessibility","관광지 무장애 정보","tour","목록","정기","광·기",0,0],["tour.reservation","예약 필요 여부","tour","예/아니오+경로","정기","기",0,0],
 ["traffic.bus_change","버스 노선·정류장 변경","traffic","날짜+내용","일시","기·동",1,0],["traffic.terminal","터미널·역 위치","traffic","주소","고정","광·기",1,0],["traffic.public_parking","공영주차장 위치·요금","traffic","주소+금액","정기","기·동",1,0],["traffic.mobility_support","교통약자 이동지원 신청","traffic","절차+연락처","제도","광·기",1,1],["traffic.ferry","여객선 출발지·운항","traffic","장소+시간표","정기","광·기",0,1],["traffic.airport_access","공항 접근 교통","traffic","목록","정기","광",0,0],["traffic.bike","공공자전거","traffic","예/아니오+위치","정기","기",0,0],
 ["welfare.health_center_hours","보건소·보건지소 진료 시간","welfare","시간표","정기","기·동",1,1],["welfare.eligibility","복지 서비스 대상 기준","welfare","조건","제도","광·기",1,1],["welfare.apply_where","신청처","welfare","기관","제도","기·동",1,0],["welfare.documents","필요 서류","welfare","목록","제도","기",1,0],["welfare.amount","지원 금액","welfare","금액","제도","광·기",0,1],["welfare.senior_center","경로당·노인복지관","welfare","주소","고정","동",0,0],["welfare.childcare","돌봄센터 운영","welfare","시간표","정기","기·동",0,0],["welfare.disability_desk","장애인 지원 창구","welfare","기관+연락처","제도","기",0,1],
 ["foreign.support_center","외국인주민지원센터","foreign","주소+시간표","정기","광·기",1,0],["foreign.multilang_days","다국어 상담 요일·언어","foreign","요일+언어","정기","광·기",1,0],["foreign.health_insurance","외국인 건강보험 안내","foreign","기관","제도","광·기",1,0],["foreign.registration","외국인 등록 관할","foreign","기관+주소","제도","광·기",1,0],["foreign.tourist_hotline","관광 통역 안내 전화","foreign","연락처","고정","광",0,0],["foreign.emergency_lang","다국어 긴급 안내","foreign","경로","제도","광·기",0,1],
 ["safety.shelter_lookup","대피소 확인 경로","safety","경로","제도","광·기·동",1,1],["safety.alert_channel","재난 안내 수신 채널","safety","목록","제도","광·기",1,1],["safety.night_er","야간·휴일 응급의료기관","safety","기관+주소","정기","기",1,1],["safety.holiday_pharmacy","휴일 약국 확인 경로","safety","경로","일시","기·동",1,1],["safety.civil_defense","민방위 대피시설","safety","주소","고정","동",0,1],["safety.hazard_notice","산불·태풍 통제 공지","safety","경로","일시","광·기",0,1]],
"sido":[["seoul","서울특별시","서울"],["busan","부산광역시","부산"],["daegu","대구광역시","대구"],["incheon","인천광역시","인천"],["daejeon","대전광역시","대전"],["ulsan","울산광역시","울산"],["sejong","세종특별자치시","세종"],["gyeonggi","경기도","경기"],["gangwon","강원특별자치도","강원"],["chungbuk","충청북도","충북"],["chungnam","충청남도","충남"],["jeonbuk","전북특별자치도","전북"],["jeonnamgwangju","전남광주통합특별시","전남광주"],["gyeongbuk","경상북도","경북"],["gyeongnam","경상남도","경남"],["jeju","제주특별자치도","제주"]],
"old":[
 {"slug":"gwangju-old","name":"광주광역시","level":"광역","validTo":"2026-06-30","to":["jeonnamgwangju"],"note":"2026년 7월 1일 전라남도와 통합되어 전남광주통합특별시가 되었어요."},
 {"slug":"jeonnam-old","name":"전라남도","level":"광역","validTo":"2026-06-30","to":["jeonnamgwangju"],"note":"2026년 7월 1일 광주광역시와 통합되어 전남광주통합특별시가 되었어요."},
 {"slug":"incheon-junggu","name":"인천 중구","level":"기초","validTo":"2026-06-30","to":["incheon/jemulpo","incheon/yeongjong"],"note":"2026년 7월 1일 내륙은 제물포구, 섬 지역은 영종구가 되었어요."},
 {"slug":"incheon-donggu","name":"인천 동구","level":"기초","validTo":"2026-06-30","to":["incheon/jemulpo"],"note":"2026년 7월 1일 중구 내륙과 함께 제물포구가 되었어요."},
 {"slug":"incheon-seogu","name":"인천 서구","level":"기초","validTo":"2026-06-30","to":["incheon/seohae","incheon/geomdan"],"note":"2026년 7월 1일 아라뱃길 남쪽은 서해구, 북쪽은 검단구가 되었어요."}],
"sido_meta":{"jeonnamgwangju":{"since":"2026-07-01","from":["광주광역시","전라남도"]}},
"sigungu":[
 {"slug":"seoul/gangnam","parent":"seoul","name":"강남구","type":"자치구","cov":74,"pilot":True,"hero":["강남구, AI는 우리 구를 얼마나 정확히 알고 있을까요?","2026-R1 시범 회차에서 120문항을 측정할 예정이에요. 질문 세트와 주민 참여 현황을 먼저 공개해요."]},
 {"slug":"jeju/seogwipo","parent":"jeju","name":"서귀포시","type":"행정시","contract":True,"cov":92,"hero":["서귀포에 대해 AI가 다르게 말한 것, 함께 고쳐요.","오늘 문을 연 곳부터 축제 일정까지, 확인된 정답을 모았어요."]},
 {"slug":"incheon/yeongjong","parent":"incheon","name":"영종구","type":"자치구","since":"2026-07-01","from":["인천 중구"],"cov":71,"hero":["영종구, AI는 새 이름을 알고 있을까요?","2026년 7월 1일에 생긴 구예요. AI는 아직 ‘인천 중구’라고 말하기도 해요."]},
 {"slug":"incheon/jemulpo","parent":"incheon","name":"제물포구","type":"자치구","since":"2026-07-01","from":["인천 중구","인천 동구"],"basic":True,"cov":48},
 {"slug":"incheon/seohae","parent":"incheon","name":"서해구","type":"자치구","since":"2026-07-01","from":["인천 서구"],"basic":True,"cov":40},
 {"slug":"incheon/geomdan","parent":"incheon","name":"검단구","type":"자치구","since":"2026-07-01","from":["인천 서구"],"basic":True,"cov":38},
 {"slug":"chungbuk/hanbit","parent":"chungbuk","name":"[가상] 한빛군","type":"군","virtual":True,"contract":True,"cov":95,"hero":["한빛군에 대해 AI가 다르게 말한 것, 함께 고쳐요.","가상 지역입니다. 지자체 시연용 예시예요."]}],
"dong":[
 {"slug":"seoul/gangnam/yeoksam1","parent":"seoul/gangnam","name":"역삼1동","cov":68},{"slug":"seoul/gangnam/samseong1","parent":"seoul/gangnam","name":"삼성1동","cov":61},{"slug":"seoul/gangnam/apgujeong","parent":"seoul/gangnam","name":"압구정동","cov":57},
 {"slug":"jeju/seogwipo/daejeong","parent":"jeju/seogwipo","name":"대정읍","cov":80},
 {"slug":"jeju/seogwipo/seongsan","parent":"jeju/seogwipo","name":"성산읍","cov":55},
 {"slug":"incheon/yeongjong/unseo1","parent":"incheon/yeongjong","name":"운서1동","cov":60},
 {"slug":"incheon/yeongjong/yongyu","parent":"incheon/yeongjong","name":"용유동","cov":45},
 {"slug":"chungbuk/hanbit/hanbiteup","parent":"chungbuk/hanbit","name":"[가상] 한빛읍","cov":90},
 {"slug":"chungbuk/hanbit/sanseong","parent":"chungbuk/hanbit","name":"[가상] 산성면","cov":70}],
"qa":{
 "jeju/seogwipo/daejeong":[
  {"id":"q1","slot":"A","attr":"life.office_hours","area":"life","q":"대정읍 행정복지센터는 몇 시까지 열어요?","ai":"평일 오전 9시부터 오후 6시까지 운영합니다.","label":"ok","res":["ok","ok","old","ok","ok","ok"],"fact":"평일 09:00–18:00 (점심시간에도 민원 처리)","key":{"ok":"평일 09:00–18:00","var":["평일 9시–6시","오전 9시부터 오후 6시"],"old":[],"mix":["서귀포시청 민원실 09:00–18:00 (다른 기관)"]},"hist":[["평일 09:00–18:00","2019-01-01–","L3 공식 고시"]],"ev":"서귀포시 공식 안내 (예시 정본)","at":"2026-09-28"},
  {"id":"q2","slot":"C","attr":"tour.market_days","area":"tour","q":"대정 오일장은 언제 열려요?","ai":"매주 토요일에 열립니다.","label":"nofact","res":["nofact","nofact","unk","ok","nofact","ok"],"fact":"매달 1·6이 들어가는 날 (1·6·11·16·21·26일)","key":{"ok":"1·6·11·16·21·26일","var":["1, 6일장","끝자리 1·6"],"old":[],"mix":["제주시 민속오일장 2·7일 (다른 장)"]},"hist":[["1·6·11·16·21·26일","2010-01-01–","L2 읍사무소 확인"]],"ev":"읍사무소 확인 (예시 정본)","at":"2026-09-28"},
  {"id":"q3","slot":"C","attr":"traffic.ferry","area":"traffic","q":"마라도 가는 배는 어디서 타요?","ai":"송악산 선착장에서만 출발합니다.","label":"mix","risk":True,"res":["mix","mix","mix","ok","unk","mix"],"fact":"운진항(모슬포)과 송악산 선착장에서 각각 운항 — 회사·시간이 달라요","key":{"ok":"운진항·송악산 선착장 두 곳","var":["모슬포 운진항과 송악산"],"old":[],"mix":["송악산 선착장만 (일부만 말함)"]},"hist":[["운진항·송악산 두 곳","2021-01-01–","L2 운항사 확인"]],"ev":"운항사 공지 (예시 정본)","at":"2026-09-20"},
  {"id":"q4","slot":"A","attr":"life.library_closed","area":"life","q":"대정 공공도서관은 무슨 요일에 쉬어요?","ai":"일요일에 쉽니다.","label":"old","res":["old","old","old","ok","old","old"],"fact":"매주 월요일 휴관 (2025년부터)","key":{"ok":"월요일","var":["매주 월","월요일마다"],"old":["일요일 (2024년까지)"],"mix":[]},"hist":[["월요일","2025-01-01–","L3 공식 고시"],["일요일","–2024-12-31","L3 공식 고시"]],"ev":"도서관 안내 (예시 정본)","at":"2026-09-28"},
  {"id":"q5","slot":"A","attr":"welfare.health_center_hours","area":"welfare","q":"대정 보건지소 토요일에도 진료해요?","ai":"그 정보는 알지 못합니다.","label":"unk","res":["unk","unk","unk","ok","unk","unk"],"fact":"토요일 진료 없음, 평일 09:00–18:00","key":{"ok":"토요일 진료 없음","var":["주말 휴진"],"old":[],"mix":[]},"hist":[["평일만 진료","2018-01-01–","L2 담당 확인"]],"ev":"보건소 안내 (예시 정본)","at":"2026-09-25"},
  {"id":"q6","slot":"D","attr":"welfare.senior_center","area":"welfare","q":"대정읍 하모리 경로당은 어디예요?","ai":"하모리 마을회관 2층에 있습니다.","label":"ok","res":["ok","ok","unk","ok","ok","ok"],"fact":"하모리 마을회관 2층 (예시)","key":{"ok":"하모리 마을회관 2층","var":[],"old":[],"mix":[]},"hist":[["하모리 마을회관 2층","2015-01-01–","L1 주민 확인"]],"ev":"주민 확인 (예시 정본)","at":"2026-09-26"}],
 "jeju/seogwipo":[
  {"id":"s1","slot":"C","attr":"tour.festival_dates","area":"tour","q":"서귀포 칠십리 축제는 언제예요?","ai":"매년 10월 초에 열립니다.","label":"old","res":["old","old","old","ok","old","ok"],"fact":"2026년은 10월 16–18일 (예시)","key":{"ok":"2026-10-16–18","var":["10월 16일부터 18일"],"old":["10월 초 (지난해 기준)"],"mix":[]},"hist":[["2026-10-16–18","2026-10-16–2026-10-18","L2 담당 확인 (예고)"],["2025-10-03–05","종료","L3"]],"ev":"서귀포시 공지 (예시 정본)","at":"2026-09-30"},
  {"id":"s2","slot":"B","attr":"foreign.tourist_hotline","area":"foreign","q":"Where can I get tourist interpretation help in Seogwipo?","ai":"Call the city hall main line.","label":"nofact","res":["nofact","nofact","unk","ok","nofact","nofact"],"fact":"관광 통역 안내 전화 (1330, 예시) · 관광안내소","key":{"ok":"1330 관광 통역 안내","var":["Korea Travel Hotline 1330"],"old":[],"mix":[]},"hist":[["1330","상시","L3"]],"ev":"관광 안내 (예시 정본)","at":"2026-09-30"},
  {"id":"s3","slot":"A","attr":"safety.shelter_lookup","area":"safety","q":"서귀포 태풍 대피소는 어디서 확인해요?","ai":"서귀포시 홈페이지와 공식 재난 앱에서 확인할 수 있습니다.","label":"ok","res":["ok","ok","ok","ok","ok","ok"],"fact":"시 홈페이지 재난 안내·공식 재난 앱","key":{"ok":"시 홈페이지·공식 재난 앱","var":[],"old":[],"mix":[]},"hist":[["시 홈페이지·공식 재난 앱","상시","L3"]],"ev":"시 안전 안내 (예시 정본)","at":"2026-09-30"},
  {"id":"s4","slot":"A","attr":"life.office_address","area":"life","q":"서귀포시청 제1청사 주소는?","ai":"제주시 연동에 있습니다.","label":"mix","res":["mix","ok","mix","ok","ok","ok"],"fact":"서귀포시 중앙로 105 (예시 정본)","key":{"ok":"서귀포시 중앙로 105","var":[],"old":[],"mix":["제주시 연동 (제주시청 혼동)"]},"hist":[["서귀포시 중앙로 105","상시","L3"]],"ev":"시청 안내 (예시 정본)","at":"2026-09-30"},
  {"id":"s5","slot":"E","attr":"life.admin_name","area":"life","q":"서귀포시는 자치단체예요?","ai":"서귀포시는 제주특별자치도의 행정시로, 자치단체가 아닙니다.","label":"ok","res":["ok","ok","ok","ok","ok","ok"],"fact":"제주특별자치도 행정시 (카나리)","key":{"ok":"행정시","var":[],"old":[],"mix":[]},"hist":[["행정시","2006-07-01–","L3"]],"ev":"법령 (카나리 질문)","at":"2026-09-30"}],
 "incheon/yeongjong":[
  {"id":"y1","slot":"A","attr":"life.office_address","area":"life","q":"영종구청 주소가 어디예요?","ai":"인천광역시 중구 영종대로에 있습니다.","label":"old","res":["old","old","old","ok","old","ok"],"fact":"인천광역시 영종구 하늘중앙로 201","key":{"ok":"영종구 하늘중앙로 201","var":[],"old":["인천 중구 (2026-06-30까지)"],"mix":[]},"hist":[["영종구 하늘중앙로 201","2026-07-01–","L3 공식 고시"],["(중구 영종출장소)","–2026-06-30","L3"]],"ev":"인천광역시 행정구역 안내","at":"2026-09-29"},
  {"id":"y2","slot":"E","attr":"life.admin_name","area":"life","q":"영종도는 어느 구예요?","ai":"인천광역시 중구에 속합니다.","label":"old","res":["old","old","old","old","old","ok"],"fact":"2026년 7월 1일부터 영종구","key":{"ok":"영종구","var":["인천 영종구"],"old":["인천 중구"],"mix":["제물포구"]},"hist":[["영종구","2026-07-01–","L3 공식 고시"],["중구","–2026-06-30","L3"]],"ev":"인천광역시 행정구역 안내","at":"2026-09-29"},
  {"id":"y3","slot":"A","attr":"traffic.terminal","area":"traffic","q":"영종도에서 인천 시내 가는 버스는?","ai":"노선 정보를 찾을 수 없습니다.","label":"unk","res":["unk","unk","unk","ok","unk","ok"],"fact":"공항철도·광역버스 노선 안내 (예시)","key":{"ok":"공항철도·광역버스","var":[],"old":[],"mix":[]},"hist":[["공항철도·광역버스","상시","L2"]],"ev":"교통 안내 (예시 정본)","at":"2026-09-29"}],
 "jeonnamgwangju":[
  {"id":"j1","slot":"E","attr":"life.admin_name","area":"life","q":"광주광역시는 지금도 있어요?","ai":"네, 광주광역시는 대한민국의 광역시입니다.","label":"old","res":["old","old","old","old","old","ok"],"fact":"2026년 7월 1일 전라남도와 통합되어 전남광주통합특별시","key":{"ok":"전남광주통합특별시로 통합","var":["광주특별시(약칭)"],"old":["광주광역시"],"mix":[]},"hist":[["전남광주통합특별시","2026-07-01–","L3 법률"],["광주광역시","–2026-06-30","L3"]],"ev":"특별법·행정안전부 (공개 사실)","at":"2026-09-29"},
  {"id":"j2","slot":"A","attr":"life.civil_contact","area":"life","q":"전남광주통합특별시 누리집 주소는?","ai":"광주광역시 홈페이지를 이용하세요.","label":"old","res":["old","old","unk","ok","old","ok"],"fact":"통합 임시 누리집 운영 (출범 안내 기준, 예시)","key":{"ok":"통합 누리집","var":[],"old":["광주광역시 홈페이지","전라남도 홈페이지"],"mix":[]},"hist":[["통합 누리집","2026-07-01–","L2"]],"ev":"출범 안내 (예시 정본)","at":"2026-09-29"}],
 "chungbuk/hanbit":[
  {"id":"h1","slot":"A","attr":"life.library_closed","area":"life","q":"한빛군립도서관 휴관일은?","ai":"일요일에 쉽니다.","label":"old","res":["old","old","old","ok","old","old"],"fact":"매주 월요일 휴관","key":{"ok":"월요일","var":[],"old":["일요일"],"mix":[]},"hist":[["월요일","2025-03-01–","L3"],["일요일","–2025-02-28","L3"]],"ev":"군 공식 안내 (가상)","at":"2026-09-30"},
  {"id":"h2","slot":"C","attr":"tour.festival_dates","area":"tour","q":"한빛 국화축제 일정은?","ai":"10월 23일부터 11월 1일까지 군민공원에서 열립니다.","label":"ok","res":["ok","ok","old","ok","ok","ok"],"fact":"2026-10-23 – 11-01, 군민공원","key":{"ok":"10-23 – 11-01, 군민공원","var":[],"old":["10-24 – 11-02 (지난해)"],"mix":[]},"hist":[["2026-10-23–11-01","행사","L2"]],"ev":"군 공식 안내 (가상)","at":"2026-09-30"},
  {"id":"h3","slot":"A","attr":"traffic.mobility_support","area":"welfare","q":"장애인 콜택시 등록은 어디서 해요?","ai":"주민센터에서 바로 이용할 수 있습니다.","label":"mix","risk":True,"res":["mix","mix","nofact","ok","mix","ok"],"fact":"교통행정과 등록 후 이용 (전화·방문)","key":{"ok":"교통행정과 등록","var":[],"old":[],"mix":["주민센터 (다른 창구)"]},"hist":[["교통행정과 등록","상시","L3"]],"ev":"군 공식 안내 (가상)","at":"2026-09-30"},
  {"id":"h4","slot":"A","attr":"traffic.bus_change","area":"traffic","q":"11-1번 버스 노선 바뀌어요?","ai":"변경 계획이 없습니다.","label":"old","res":["old","old","unk","ok","old","ok"],"fact":"10월 12일부터 시장 정류장이 군청 앞으로 이동","key":{"ok":"10-12부터 정류장 이동","var":[],"old":["변경 없음"],"mix":[]},"hist":[["10-12부터 이동","2026-10-12–","L2 예고"]],"ev":"군 공식 안내 (가상)","at":"2026-09-30"}]},
"cases":[
 {"region":"chungbuk/hanbit","area":"life","before":"한빛군립도서관은 일요일에 쉽니다.","after":"매주 월요일 휴관","how":"군 홈페이지의 옛 안내를 정리하고 정본을 게시","at":"2026-09-12","result":"재측정에서 서비스 3곳 중 2곳 정답 (예시)"},
 {"region":"jeju/seogwipo/daejeong","area":"tour","before":"대정 오일장은 매주 토요일에 열립니다.","after":"매달 1·6·11·16·21·26일","how":"주민 확인단이 장날을 확인, 읍 정본에 추가","at":"2026-09-20","result":"재측정 예정 2026-R1"},
 {"region":"incheon/yeongjong","area":"life","before":"영종도는 인천광역시 중구에 속합니다.","after":"2026년 7월 1일부터 영종구","how":"개편 안내 페이지 게시·구조화 데이터 반영","at":"2026-09-29","result":"재측정 예정 2026-R1"}],
"inbox":[
 {"id":"c1","q":"마라도 가는 배는 어디서 타요?","label":"mix","risk":True,"type":"출처 문제","note":"오래된 관광 안내 페이지가 한 선착장만 소개","dept":"","due":"","status":"배정 대기"},
 {"id":"c2","q":"서귀포 칠십리 축제는 언제예요?","label":"old","type":"정본 문제","note":"올해 일정이 공식 정본에 늦게 등록됨","dept":"관광진흥과","due":"2026-10-08","status":"처리 중"},
 {"id":"c4","q":"（日本語）天地淵瀑布は何時まで見学できますか？","label":"old","type":"정본 문제 (다국어)","note":"일본어로만 옛 관람 종료 시간을 답함 — 일본어 정본·사실 페이지 없음","dept":"","due":"","status":"배정 대기"},
 {"id":"c3","q":"서귀포시청 제1청사 주소는?","label":"mix","type":"수집 문제","note":"정본은 맞음. AI가 제주시청과 섞음 — 재수집 유도","dept":"정보화담당관","due":"2026-10-06","status":"재측정 예약"}],
"facts":[
 ["대정 공공도서관","휴관일","월요일","2025-01-01–","L3","확정","2026-12-31"],["대정 오일장","장날","1·6·11·16·21·26일","2010–","L2","확정","2027-03-31"],["칠십리 축제","일정","2026-10-16–18","행사","L2","예고","2026-10-18"],["서귀포 매일올레시장 공영주차장","요금","출처 2곳 다름 (30분 1,000원 / 1,200원)","—","후보","상충","—"],["대정 보건지소","진료 시간","평일 09:00–18:00","2018–","L2","확정","2026-10-15"],["마라도 여객선","출발지","운진항·송악산 두 곳","2021–","L2","확정","2026-11-30"],["서귀포시청 제1청사","주소","중앙로 105","상시","L3","확정","2027-09-30"]],
"part":{
 "seoul":[["질문 제안","시민 (마포구)","‘서울 공공 수영장 자유수영 예약은 어디서?’ · 152표","D칸 선정 → 정본 공백 → 서울시 체육시설 담당 확인 요청","2026-09-27"],["오답 신고","시민","AI가 ‘북촌 한옥마을은 언제든 방문 가능’이라고 답함","확인단 확인 → C칸 질문 편입 (방문 시간 제한)","2026-09-25"],["번역 검수","외국인 주민 자원봉사자 (영어·중국어)","서울 광역 질문 18문항 현지 표현 검수","검색어체 표현 반영","2026-09-29"],["제외 안내","시민","‘서울에서 가장 맛있는 냉면집은?’","의견·추천 질문이라 측정 제외, 사실 질문으로 바꾸는 방법 안내","2026-09-28"]],
 "seoul/gangnam":[["점검의 날","역삼1동 동네 정답 지킴이 6명 (주민자치회)","동 정본 12개 현장 확인 계획 (경로당·무더위쉼터·민방위 대피시설 등)","확인 결과는 L1로 등록, 주민센터 확인 후 L2 — 바뀐 값은 예고된 변화로 반영","2026-10-25 (예정)"],["오답 신고","직장인 (강남역)","AI가 ‘강남고속버스터미널은 강남구에 있다’고 답함","혼동 확인 (서초구) → C칸 혼동 질문 편입","2026-09-30"],["질문 제안","주민 (개포동)","‘강남구 폐의약품 수거함 위치’ · 64표","속성 사전에 없음 → 속성 후보 life.drug_disposal 검토 (사전 v0.2)","2026-09-26"],["번역 검수","강남글로벌빌리지센터 자원봉사자","외국인 정보 9문항 영어·일본어 검수","현지 표현 3건 수정","2026-10-02"],["확인단","청년 확인단 4명 (일자리 연계 검토)","공영주차장 요금 14곳 확인","출처 2곳 상충 3건 → 주차관리과 확인 대기","2026-10-01"],["보류","학부모 모임","‘대치동 학원가 셔틀 정차 금지 구역은?’","공식 고시 출처 확인 전까지 보류 (판정 가능성 검토)","2026-09-29"]],
 "jeju":[["오답 신고","관광객 (영어)","AI said Udo Island is in Seogwipo","혼동 확인 → C칸 질문 ‘우도는 제주시예요, 서귀포시예요?’","2026-09-24"],["질문 제안","렌터카 이용 관광객","‘제주공항 렌터카 반납은 어디서?’ · 97표","D칸 선정, 정본 후보 (공항 안내)","2026-09-27"],["협력","성산읍 해녀회·어촌계","우도 도항선 출발지·운항 확인","성산항·종달항 정본 L2","2026-09-30"],["번역 검수","제주 외국인 주민 (베트남어·중국어)","외국인 정보 6문항","베트남어 표현 2건 수정","2026-09-28"]],
 "jeju/seogwipo":[["점검의 날","대정읍 하모리 지킴이 4명","경로당·보건지소·장날 확인","경로당 위치 L1 확정","2026-09-26"],["오답 신고","주민","AI가 ‘마라도 배는 송악산에서만 출발’이라고 답함","혼동·위험 확인 → 정정 처리함 배정","2026-09-20"],["질문 제안","주민 (동홍동)","‘매일올레시장 휴무일’ · 41표","2026-R2 D칸 선정, 정본 공백 → 상인회 확인","2026-09-27"],["확인단","서귀포 확인단 5명","공영주차장·관광지 요금 23건","상충 1건 (올레시장 주차 요금) 해결","2026-10-01"],["번역 검수","중문 관광안내소 통역 자원봉사자","관광 질문 12문항 영어·중국어","검색어체 표현 반영","2026-09-30"],["판정단","장애 당사자 판정단 (대화노트 연계)","교통약자 이동지원 안내 대화 평가","쉬운 말 안내 개선 요청 2건","2026-10-02"]]},

"proposals":[
 {"id":"p5","r":"seoul","q":"서울 공공 수영장 자유수영 예약은 어디서 해요?","area":"life","votes":152,"status":"측정 예정 (2026-R2 D칸)"},
 {"id":"p6","r":"seoul/gangnam","q":"강남구 폐의약품 수거함은 어디에 있어요?","area":"life","votes":64,"status":"정본 공백 → 확인 미션"},
 {"id":"p7","r":"seoul/gangnam","q":"대치동 학원가 셔틀 정차 금지 구역은?","area":"traffic","votes":38,"status":"검토 중"},
 {"id":"p8","r":"jeju","q":"제주공항 렌터카 반납은 어디서 해요?","area":"traffic","votes":97,"status":"측정 예정 (2026-R2 D칸)"},
 {"id":"p1","r":"jeju/seogwipo","q":"서귀포 매일올레시장 휴무일은?","area":"tour","votes":41,"status":"측정 예정 (2026-R2 D칸)"},
 {"id":"p2","r":"jeju/seogwipo/daejeong","q":"모슬포 수협 위판장 견학 가능해요?","area":"tour","votes":12,"status":"정본 공백 → 확인 미션"},
 {"id":"p3","r":"jeju","q":"제주에서 가장 맛있는 고기국수 집은?","area":"tour","votes":88,"status":"제외: 의견·추천 질문"},
 {"id":"p4","r":"incheon/yeongjong","q":"영종구 주민센터에서 여권 발급돼요?","area":"life","votes":23,"status":"검토 중"}],
"adjud":[
 ["q2","서비스 C · 검색 끔","자동: 없는 사실","사람 1: 모름 · 사람 2: 모름","→ 모름 (답이 ‘확인 어렵다’ 취지)"],
 ["s1","서비스 B · 검색 켬","자동: 정확","사람 1: 정확 · 사람 2: 옛 정보","→ 조정자: 정확 (2026 일정 명시)"],
 ["y2","서비스 C · 검색 켬","자동: 정확","사람 1: 정확 · 사람 2: 정확","→ 일치"]],
"crew":[["감귤나무","확인단",312,96,True],["모슬포바람","확인단",188,91,True],["오일장지기","확인단",95,88,True],["새별오름","확인단(교육 중)",0,0,False],["푸른바다","판정단",140,93,True]]
}
SEED["ml"]=ML;SEED["gloss"]=GLOSS;SEED["visit"]=VISIT
SEED["sets"]={"seoul":SEOUL,"seoul/gangnam":GANGNAM,"jeju":JEJU,"jeju/seogwipo":SEOGWIPO}
DATA=json.dumps(SEED,ensure_ascii=False)
JS=open('app2.js',encoding='utf-8').read()
html='''<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>모두의 정답노트 — 지역 브랜드 데모 v0.5</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&family=Nanum+Pen+Script&display=swap" rel="stylesheet">
<style>'''+css+extra+'''</style></head><body>
<script type="application/json" id="seed">'''+DATA+'''</script>
<div class="demo" role="region" aria-label="데모 조작">
<b>데모 v0.5</b><span>화면:</span>
<button data-mode="public" aria-pressed="true">공개 사이트</button><button data-mode="crew" aria-pressed="false">참여자 앱</button><button data-mode="portal" aria-pressed="false">지자체 포털</button><button data-mode="ops" aria-pressed="false">운영</button>
<span class="sp"></span><span>측정값·정본 값은 예시 (2026-R0 사전 탐색 가정)</span><button id="resetBtn">처음으로</button>
</div>
<header class="gnb"><div class="in" id="gnb"></div></header>
<main id="main" tabindex="-1"></main>
<div class="toast" id="toast" role="status"></div>
<script>'''+JS+'''</script></body></html>'''
open('index.html','w',encoding='utf-8').write(html);print(len(html))
