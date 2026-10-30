import json
SEED={
"areas":[["life","생활·행정","생활 정보"],["tour","관광·축제","놀러 갈 곳"],["traffic","교통","다니는 길"],["welfare","복지","도움 받는 법"],["foreign","외국인 정보","외국인 안내"],["safety","재난·안전","안전 정보"]],
"sido":[["seoul","서울특별시","서울"],["busan","부산광역시","부산"],["daegu","대구광역시","대구"],["incheon","인천광역시","인천"],["daejeon","대전광역시","대전"],["ulsan","울산광역시","울산"],["sejong","세종특별자치시","세종"],["gyeonggi","경기도","경기"],["gangwon","강원특별자치도","강원"],["chungbuk","충청북도","충북"],["chungnam","충청남도","충남"],["jeonbuk","전북특별자치도","전북"],["jeonnamgwangju","전남광주통합특별시","전남광주"],["gyeongbuk","경상북도","경북"],["gyeongnam","경상남도","경남"],["jeju","제주특별자치도","제주"]],
"old":[
 {"slug":"gwangju-old","name":"광주광역시","level":"광역","validTo":"2026-06-30","to":["jeonnamgwangju"],"note":"2026년 7월 1일 전라남도와 통합되어 전남광주통합특별시가 되었어요."},
 {"slug":"jeonnam-old","name":"전라남도","level":"광역","validTo":"2026-06-30","to":["jeonnamgwangju"],"note":"2026년 7월 1일 광주광역시와 통합되어 전남광주통합특별시가 되었어요."},
 {"slug":"incheon-junggu","name":"인천 중구","level":"기초","validTo":"2026-06-30","to":["incheon/jemulpo","incheon/yeongjong"],"note":"2026년 7월 1일 내륙은 제물포구, 섬 지역은 영종구가 되었어요."},
 {"slug":"incheon-donggu","name":"인천 동구","level":"기초","validTo":"2026-06-30","to":["incheon/jemulpo"],"note":"2026년 7월 1일 중구 내륙과 함께 제물포구가 되었어요."},
 {"slug":"incheon-seogu","name":"인천 서구","level":"기초","validTo":"2026-06-30","to":["incheon/seohae","incheon/geomdan"],"note":"2026년 7월 1일 아라뱃길 남쪽은 서해구, 북쪽은 검단구가 되었어요."}],
"sigungu":[
 {"slug":"jeju/seogwipo","parent":"jeju","name":"서귀포시","type":"행정시","contract":True,"hero":["서귀포에 대해 AI가 다르게 말한 것, 함께 고쳐요.","오늘 문을 연 곳부터 축제 일정까지, 확인된 정답을 모았어요."]},
 {"slug":"incheon/yeongjong","parent":"incheon","name":"영종구","type":"자치구","since":"2026-07-01","from":["인천 중구"],"hero":["영종구, AI는 새 이름을 알고 있을까요?","2026년 7월 1일에 생긴 구예요. AI는 아직 ‘인천 중구’라고 말하기도 해요."]},
 {"slug":"incheon/jemulpo","parent":"incheon","name":"제물포구","type":"자치구","since":"2026-07-01","from":["인천 중구","인천 동구"],"basic":True},
 {"slug":"incheon/seohae","parent":"incheon","name":"서해구","type":"자치구","since":"2026-07-01","from":["인천 서구"],"basic":True},
 {"slug":"incheon/geomdan","parent":"incheon","name":"검단구","type":"자치구","since":"2026-07-01","from":["인천 서구"],"basic":True},
 {"slug":"chungbuk/hanbit","parent":"chungbuk","name":"[가상] 한빛군","type":"군","virtual":True,"hero":["한빛군에 대해 AI가 다르게 말한 것, 함께 고쳐요.","가상 지역입니다. 지자체 시연용으로 만든 예시예요."]}],
"dong":[
 {"slug":"jeju/seogwipo/daejeong","parent":"jeju/seogwipo","name":"대정읍"},
 {"slug":"jeju/seogwipo/seongsan","parent":"jeju/seogwipo","name":"성산읍"},
 {"slug":"incheon/yeongjong/unseo1","parent":"incheon/yeongjong","name":"운서1동"},
 {"slug":"incheon/yeongjong/yongyu","parent":"incheon/yeongjong","name":"용유동"},
 {"slug":"chungbuk/hanbit/hanbiteup","parent":"chungbuk/hanbit","name":"[가상] 한빛읍"},
 {"slug":"chungbuk/hanbit/sanseong","parent":"chungbuk/hanbit","name":"[가상] 산성면"}],
"qa":{
 "jeju/seogwipo/daejeong":[
  {"id":"q1","area":"life","q":"대정읍 행정복지센터는 몇 시까지 열어요?","ai":"평일 오전 9시부터 오후 6시까지 운영합니다.","label":"ok","fact":"평일 09:00–18:00 (점심시간에도 민원 처리)","ev":"서귀포시 공식 안내 (예시 정본)","at":"2026-09-28"},
  {"id":"q2","area":"tour","q":"대정 오일장은 언제 열려요?","ai":"매주 토요일에 열립니다.","label":"nofact","fact":"매달 1·6이 들어가는 날 (1·6·11·16·21·26일)","ev":"읍사무소 확인 (예시 정본)","at":"2026-09-28"},
  {"id":"q3","area":"traffic","q":"마라도 가는 배는 어디서 타요?","ai":"송악산 선착장에서만 출발합니다.","label":"mix","risk":True,"fact":"운진항(모슬포)과 송악산 선착장에서 각각 운항 — 회사·시간이 달라요","ev":"운항사 공지 (예시 정본)","at":"2026-09-20"},
  {"id":"q4","area":"life","q":"대정 공공도서관은 무슨 요일에 쉬어요?","ai":"일요일에 쉽니다.","label":"old","fact":"매주 월요일 휴관 (2025년부터)","ev":"도서관 안내 (예시 정본)","at":"2026-09-28"},
  {"id":"q5","area":"welfare","q":"대정 보건지소 토요일에도 진료해요?","ai":"그 정보는 알지 못합니다.","label":"unk","fact":"토요일 진료 없음, 평일 09:00–18:00","ev":"보건소 안내 (예시 정본)","at":"2026-09-25"}],
 "jeju/seogwipo":[
  {"id":"s1","area":"tour","q":"서귀포 칠십리 축제는 언제예요?","ai":"매년 10월 초에 열립니다.","label":"old","fact":"2026년은 10월 16–18일 (예시)","ev":"서귀포시 공지 (예시 정본)","at":"2026-09-30"},
  {"id":"s2","area":"foreign","q":"Where can I get a tourist SIM card in Seogwipo?","ai":"At Seogwipo city hall.","label":"nofact","fact":"시청에서는 판매하지 않아요. 공항·통신사 매장 안내","ev":"관광 안내소 (예시 정본)","at":"2026-09-30"},
  {"id":"s3","area":"safety","q":"서귀포 태풍 대피소는 어디서 확인해요?","ai":"서귀포시 홈페이지와 안전디딤돌 앱에서 확인할 수 있습니다.","label":"ok","fact":"시 홈페이지 재난 안내·공식 재난 앱","ev":"시 안전 안내 (예시 정본)","at":"2026-09-30"},
  {"id":"s4","area":"life","q":"서귀포시청 제1청사 주소는?","ai":"제주시 연동에 있습니다.","label":"mix","fact":"서귀포시 중앙로 105 (예시 정본)","ev":"시청 안내 (예시 정본)","at":"2026-09-30"}],
 "incheon/yeongjong":[
  {"id":"y1","area":"life","q":"영종구청 주소가 어디예요?","ai":"인천광역시 중구 영종대로에 있습니다.","label":"old","fact":"인천광역시 영종구 하늘중앙로 201 (2026년 7월 1일부터 영종구)","ev":"인천광역시 행정구역 안내","at":"2026-09-29"},
  {"id":"y2","area":"life","q":"영종도는 어느 구예요?","ai":"인천광역시 중구에 속합니다.","label":"old","fact":"2026년 7월 1일부터 영종구","ev":"인천광역시 행정구역 안내","at":"2026-09-29"},
  {"id":"y3","area":"traffic","q":"영종도에서 인천 시내 가는 버스는?","ai":"노선 정보를 찾을 수 없습니다.","label":"unk","fact":"공항철도·광역버스 노선 안내 (예시)","ev":"교통 안내 (예시 정본)","at":"2026-09-29"}],
 "chungbuk/hanbit":[
  {"id":"h1","area":"life","q":"한빛군립도서관 휴관일은?","ai":"일요일에 쉽니다.","label":"old","fact":"매주 월요일 휴관","ev":"군 공식 안내 (가상)","at":"2026-09-30"},
  {"id":"h2","area":"tour","q":"한빛 국화축제 일정은?","ai":"10월 23일부터 11월 1일까지 군민공원에서 열립니다.","label":"ok","fact":"2026-10-23 – 11-01, 군민공원","ev":"군 공식 안내 (가상)","at":"2026-09-30"},
  {"id":"h3","area":"welfare","q":"장애인 콜택시 등록은 어디서 해요?","ai":"주민센터에서 바로 이용할 수 있습니다.","label":"mix","risk":True,"fact":"교통행정과 등록 후 이용 (전화·방문)","ev":"군 공식 안내 (가상)","at":"2026-09-30"},
  {"id":"h4","area":"traffic","q":"11-1번 버스 노선 바뀌어요?","ai":"변경 계획이 없습니다.","label":"old","fact":"10월 12일부터 시장 정류장이 군청 앞으로 이동","ev":"군 공식 안내 (가상)","at":"2026-09-30"}]},
"cases":[
 {"region":"chungbuk/hanbit","area":"life","before":"한빛군립도서관은 일요일에 쉽니다.","after":"매주 월요일 휴관","how":"군 홈페이지의 옛 안내를 정리하고 정본을 게시","at":"2026-09-12","result":"재측정에서 AI 3곳 중 3곳 정답 (예시)"},
 {"region":"jeju/seogwipo/daejeong","area":"tour","before":"대정 오일장은 매주 토요일에 열립니다.","after":"매달 1·6·11·16·21·26일","how":"주민 확인단이 장날을 확인, 읍 정본에 추가","at":"2026-09-20","result":"재측정 예정 10월 12일"},
 {"region":"incheon/yeongjong","area":"life","before":"영종도는 인천광역시 중구에 속합니다.","after":"2026년 7월 1일부터 영종구","how":"개편 안내 페이지 게시·구조화 데이터 반영","at":"2026-09-29","result":"재측정 예정 10월 13일"}],
"inbox":[
 {"id":"c1","q":"마라도 가는 배는 어디서 타요?","label":"mix","risk":True,"type":"출처 문제","note":"오래된 관광 안내 페이지가 한 선착장만 소개","dept":"","due":"","status":"배정 대기"},
 {"id":"c2","q":"서귀포 칠십리 축제는 언제예요?","label":"old","type":"정본 문제","note":"올해 일정이 공식 정본에 아직 없음","dept":"관광진흥과","due":"2026-10-08","status":"처리 중"},
 {"id":"c3","q":"서귀포시청 제1청사 주소는?","label":"mix","type":"수집 문제","note":"정본은 맞음. AI가 제주시청과 섞음 — 재수집 유도","dept":"정보화담당관","due":"2026-10-06","status":"재측정 예약"}],
"crew":[["감귤나무","확인단",312,96,True],["모슬포바람","확인단",188,91,True],["오일장지기","확인단",95,88,True],["새별오름","확인단(교육 중)",0,0,False],["푸른바다","판정단",140,93,True]]
}
DATA=json.dumps(SEED,ensure_ascii=False)
html=r'''<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>모두의 정답노트 — 지역 브랜드 데모</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&family=Nanum+Pen+Script&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);
--paper:#FBFBF8;--card:#FFFFFF;--ink:#1C2B4A;--ink2:#4A5873;--line:#DCE2EA;--pen:#127A4B;--blue:#23408E;--soft:#F1F4F7;
--ok:#127A4B;--old:#8A5A00;--nofact:#B42318;--mix:#6941C6;--unk:#475467;--risk:#B42318;--fs:16px;--focus:#F2B705;--rule:rgba(28,43,74,.07)}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#11161F;--card:#18202C;--ink:#E8EDF5;--ink2:#A8B3C5;--line:#2B3546;--pen:#4CC38A;--blue:#8AA6F0;--soft:#1E2734;--ok:#4CC38A;--old:#E3B04B;--nofact:#F07167;--mix:#B39DFA;--unk:#A8B3C5;--risk:#F07167;--rule:rgba(232,237,245,.06)}}
:root[data-theme="dark"]{--paper:#11161F;--card:#18202C;--ink:#E8EDF5;--ink2:#A8B3C5;--line:#2B3546;--pen:#4CC38A;--blue:#8AA6F0;--soft:#1E2734;--ok:#4CC38A;--old:#E3B04B;--nofact:#F07167;--mix:#B39DFA;--unk:#A8B3C5;--risk:#F07167;--rule:rgba(232,237,245,.06)}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Noto Sans KR",system-ui,sans-serif;font-size:var(--fs);line-height:1.6}
body.easy{--fs:19px}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
a{color:var(--blue)}
button{font:inherit;cursor:pointer}
.demo{background:#1C2B4A;color:#F4F6FA;font-size:.8rem;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 12px}
.demo b{margin-right:6px}
.demo button,.demo select{font-size:.8rem;border:1px solid rgba(255,255,255,.35);background:transparent;color:#F4F6FA;border-radius:999px;padding:3px 10px}
.demo button[aria-pressed="true"]{background:#F4F6FA;color:#1C2B4A}
.demo .sp{flex:1}
header.gnb{position:sticky;top:0;z-index:5;background:var(--paper);border-bottom:1px solid var(--line)}
header.gnb .in{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:10px 16px;flex-wrap:wrap}
.logo{font-weight:800;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:8px}
.logo .mk{width:26px;height:26px;border-radius:6px;background:var(--pen);color:#fff;display:grid;place-items:center;font-size:.9rem}
nav.menu{display:flex;gap:4px;flex-wrap:wrap}
nav.menu a{text-decoration:none;color:var(--ink);padding:6px 10px;border-radius:8px;font-size:.92rem}
nav.menu a[aria-current="page"]{background:var(--soft);font-weight:700}
.util{margin-left:auto;display:flex;gap:6px}
.util button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:4px 10px;font-size:.85rem}
.util button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
main{max-width:1080px;margin:0 auto;padding:18px 16px 70px}
.crumb{font-size:.88rem;color:var(--ink2);margin-bottom:6px}
.crumb a{color:var(--ink2)}
.hero{border-radius:16px;padding:22px 18px;background:var(--card);border:1px solid var(--line);background-image:repeating-linear-gradient(transparent,transparent 31px,var(--rule) 31px,var(--rule) 32px);background-size:100% 32px}
.hero h1{font-size:clamp(1.45rem,4.5vw,2.1rem);line-height:1.3;margin:0 0 6px}
.hero p{margin:0;color:var(--ink2)}
.ex{display:inline-block;font-size:.72rem;font-weight:700;color:var(--old);border:1px dashed var(--old);border-radius:6px;padding:0 6px;margin-left:6px;vertical-align:middle}
h2{font-size:1.2rem;margin:26px 0 10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.bars .row{display:grid;grid-template-columns:7.2em minmax(0,1fr) 6.2em;gap:8px;align-items:center;padding:4px 0;font-size:.92rem}
.bar{height:12px;background:var(--soft);border-radius:6px;overflow:hidden;border:1px solid var(--line)}
.bar i{display:block;height:100%;background:var(--blue)}
.delta{font-size:.8rem;color:var(--pen);font-weight:700}
.tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-top:14px}
.tabs button{border:0;background:transparent;color:var(--ink2);padding:8px 12px;border-bottom:3px solid transparent}
.tabs button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--pen);font-weight:700}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:.8rem;font-weight:700;border-radius:999px;padding:1px 9px;border:1.5px solid currentColor;white-space:nowrap;background:transparent}
.b-ok{color:var(--ok)}.b-old{color:var(--old)}.b-nofact{color:var(--nofact)}.b-mix{color:var(--mix)}.b-unk{color:var(--unk)}
.risk{display:inline-flex;align-items:center;gap:3px;font-size:.78rem;font-weight:800;color:#fff;background:var(--risk);border-radius:6px;padding:0 6px}
.qrow{border:1px solid var(--line);border-radius:12px;background:var(--card);margin-bottom:8px}
.qrow>button{width:100%;text-align:left;background:transparent;border:0;color:var(--ink);padding:12px;display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
.qrow .body{padding:0 12px 12px;display:none}
.qrow.open .body{display:block}
.said{color:var(--ink2);text-decoration:line-through;text-decoration-color:var(--nofact)}
.pen{font-family:"Nanum Pen Script","Noto Sans KR",cursive;color:var(--pen);font-size:1.6em;line-height:1.2}
.fact{color:var(--pen);font-weight:700}
.ev{font-size:.82rem;color:var(--ink2)}
.btn{border:0;border-radius:10px;padding:10px 16px;font-weight:700;background:var(--pen);color:#fff;white-space:nowrap;flex:none}
.btn.ghost{background:transparent;color:var(--pen);border:1.5px solid var(--pen)}
.btn.blue{background:var(--blue)}
.btn[disabled]{opacity:.45;cursor:not-allowed}
.notice{border:1.5px solid var(--old);background:rgba(138,90,0,.08);border-radius:12px;padding:12px;margin:12px 0}
.notice b{color:var(--old)}
.list a.item,.item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);text-decoration:none;color:var(--ink);margin-bottom:6px}
.mute{color:var(--ink2);font-size:.9rem}
input.text,textarea,select.sel{width:100%;font:inherit;padding:10px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);color:var(--ink)}
label.lb{display:block;font-weight:700;margin:12px 0 4px}
.sent{border:1px solid var(--line);border-radius:10px;padding:10px;margin:6px 0;background:var(--card)}
.answercard{border-radius:16px;border:1px solid var(--line);background:var(--card);padding:18px;background-image:repeating-linear-gradient(transparent,transparent 31px,var(--rule) 31px,var(--rule) 32px);background-size:100% 32px;max-width:520px}
.layout2{display:grid;grid-template-columns:220px minmax(0,1fr);gap:16px}
.side a{display:block;padding:8px 10px;border-radius:8px;text-decoration:none;color:var(--ink)}
.side a[aria-current="page"]{background:var(--soft);font-weight:700}
table.t{width:100%;border-collapse:collapse;font-size:.9rem}
table.t th,table.t td{text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top}
.tw{overflow-x:auto}
.kpi{font-size:1.6rem;font-weight:800}
.lock{border:1.5px dashed var(--line);border-radius:12px;padding:12px;color:var(--ink2)}
.toast{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:10px 16px;border-radius:10px;font-size:.92rem;max-width:90vw;z-index:9;display:none}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chips button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:5px 12px;font-size:.88rem}
.chips button[aria-pressed="true"]{border-color:var(--pen);color:var(--pen);font-weight:700}
.cobrand{font-size:.82rem;color:var(--ink2);margin-left:8px}
@media (max-width:760px){.layout2{grid-template-columns:1fr}.util{margin-left:0}}
</style></head><body>
<script type="application/json" id="seed">'''+DATA+r'''</script>
<div class="demo" role="region" aria-label="데모 조작">
<b>데모</b><span>화면:</span>
<button data-mode="public" aria-pressed="true">공개 사이트</button><button data-mode="crew" aria-pressed="false">참여자 앱</button><button data-mode="portal" aria-pressed="false">지자체 포털</button><button data-mode="ops" aria-pressed="false">운영</button>
<span class="sp"></span><span>측정값·정본 값은 모두 예시</span><button id="resetBtn">처음으로</button>
</div>
<header class="gnb"><div class="in" id="gnb"></div></header>
<main id="main" tabindex="-1"></main>
<div class="toast" id="toast" role="status"></div>
<script>
(function(){'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const D=JSON.parse(document.getElementById('seed').textContent);
const KEY='jeongdap-demo-v1';
const fresh=()=>({easy:false,lang:'ko',claims:[],trained:false,quiz:{},minutes:0,tasks:0,inbox:JSON.parse(JSON.stringify(D.inbox)),objections:[],judged:{}});
let S;try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY))||{})}catch(e){S=fresh()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(window.__t);window.__t=setTimeout(()=>t.style.display='none',3200)};
const AREA=Object.fromEntries(D.areas.map(a=>[a[0],a]));
const areaName=id=>S.easy?AREA[id][2]:AREA[id][1];
const LAB={ok:['정확','맞아요','확인된 정답과 같아요.','✓'],old:['옛 정보','예전 이야기예요','예전에는 맞았지만 지금은 달라요.','⟲'],nofact:['없는 사실','사실이 아니에요','확인된 근거가 없는 내용이에요.','✕'],mix:['혼동','다른 곳과 헷갈렸어요','다른 곳이나 다른 것과 섞였어요.','⇄'],unk:['모름','AI가 몰라요','AI가 모른다고 답했어요.','?']};
const badge=l=>`<span class="badge b-${l}" title="${esc(LAB[l][2])}"><span aria-hidden="true">${LAB[l][3]}</span>${S.easy?LAB[l][1]:LAB[l][0]}</span>`;
const riskB=`<span class="risk" title="따르면 안전·건강·이동에 문제가 생길 수 있어요"><span aria-hidden="true">!</span>${'위험'}</span>`;
function hash(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h}
function score(slug,area){return 38+hash(slug+area)%42}
function prev(slug,area){return Math.max(20,score(slug,area)-(4+hash(area+slug)%12))}
/* ----- region helpers ----- */
const SIDO=Object.fromEntries(D.sido.map(s=>[s[0],{slug:s[0],name:s[1],short:s[2],level:'광역'}]));
const SGG=Object.fromEntries(D.sigungu.map(s=>[s.slug,Object.assign({level:'기초'},s)]));
const DONG=Object.fromEntries(D.dong.map(s=>[s.slug,Object.assign({level:'읍면동'},s)]));
function region(slug){return slug===''||slug==='kr'?{slug:'kr',name:'대한민국',level:'국가'}:SIDO[slug]||SGG[slug]||DONG[slug]||null}
function parentOf(r){if(r.level==='광역')return region('kr');if(r.level==='기초')return SIDO[r.parent];if(r.level==='읍면동')return SGG[r.parent];return null}
function crumbs(r){const a=[];let x=r;while(x){a.unshift(x);x=parentOf(x)}return a.map((x,i)=>i<a.length-1?`<a href="#/r/${x.slug==='kr'?'':x.slug}">${esc(x.short||x.name)}</a>`:`<span aria-current="page">${esc(x.short||x.name)}</span>`).join(' › ')}
function children(r){if(r.level==='국가')return D.sido.map(s=>SIDO[s[0]]);if(r.level==='광역')return D.sigungu.filter(s=>s.parent===r.slug).map(s=>SGG[s.slug]);if(r.level==='기초')return D.dong.filter(d=>d.parent===r.slug).map(d=>DONG[d.slug]);return []}
const qaOf=r=>D.qa[r.slug]||[];
/* ----- GNB ----- */
let MODE='public';
const PUB_NAV=[['#/','홈','홈'],['#/find','지역 찾기','우리 동네 찾기'],['#/check','AI 답 확인','AI 답 맞는지 보기'],['#/cases','정정 사례','고친 이야기'],['#/join','참여하기','함께하기'],['#/method','방법','어떻게 재나요']];
const CREW_NAV=[['#/crew','오늘의 미션'],['#/crew/train','교육'],['#/crew/judge','판정 작업대'],['#/crew/me','내 활동']];
const PORTAL_NAV=[['#/portal','대시보드'],['#/portal/review','발표 전 사실 확인'],['#/portal/inbox','정정 처리함'],['#/portal/program','참여 사업']];
function gnb(){const h=location.hash||'#/';let navs,brand;
 if(MODE==='public'){navs=PUB_NAV.map(n=>`<a href="${n[0]}" ${(h===n[0]||(n[0]!=='#/'&&h.indexOf(n[0])===0)||(n[0]==='#/find'&&h.indexOf('#/r/')===0))?'aria-current="page"':''}>${S.easy?n[2]:n[1]}</a>`).join('');brand='모두의 정답노트'}
 else if(MODE==='crew'){navs=CREW_NAV.map(n=>`<a href="${n[0]}" ${h===n[0]?'aria-current="page"':''}>${n[1]}</a>`).join('');brand='정답노트 참여자'}
 else if(MODE==='portal'){navs='';brand='서귀포 정답노트 · 지자체 포털'}
 else{navs='';brand='정답노트 운영 콘솔'}
 $('#gnb').innerHTML=`<a class="logo" href="${MODE==='public'?'#/':MODE==='crew'?'#/crew':MODE==='portal'?'#/portal':'#/ops'}"><span class="mk" aria-hidden="true">✓</span>${brand}</a><nav class="menu" aria-label="주 메뉴">${navs}</nav><div class="util"><button id="easyBtn" aria-pressed="${S.easy}">쉬운 말</button><button id="themeBtn" aria-label="밝기 바꾸기">◐</button></div>`;
 $('#easyBtn').onclick=()=>{S.easy=!S.easy;document.body.classList.toggle('easy',S.easy);save();route()};
 $('#themeBtn').onclick=()=>{const r=document.documentElement;const cur=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');r.dataset.theme=cur==='dark'?'light':'dark'}}
/* ----- public screens ----- */
const V={};
function bars(r){return `<div class="bars">${D.areas.map(a=>{const v=score(r.slug,a[0]),p=prev(r.slug,a[0]);return `<div class="row"><span>${esc(areaName(a[0]))}</span><div class="bar" aria-hidden="true"><i style="width:${v}%"></i></div><span><b>${v}%</b> <span class="delta">▲${v-p}</span></span></div>`}).join('')}</div><p class="mute" style="margin:6px 0 0">정답률(질문 수 기준) · ▲는 지난 측정 대비 개선 폭 · 2026-09 측정<span class="ex">예시</span> · 지역 간 순위를 매기지 않아요</p>`}
V.home=()=>{const kr=region('kr');return `<section class="hero"><h1>${S.easy?'AI가 우리나라를 잘 알까요?':'AI는 대한민국을 얼마나 정확히 알고 있을까요?'}</h1><p>${S.easy?'시민과 함께 AI 답을 확인해요.':'16개 시도, 200여 개 시군구, 3,500여 개 읍면동에 대한 AI의 답을 시민과 함께 확인합니다.'}</p>
 <form id="homeFind" role="search" style="display:flex;gap:6px;margin-top:14px"><label for="hq" class="sr" style="position:absolute;left:-9999px">지역 찾기</label><input id="hq" class="text" placeholder="${S.easy?'동네 이름을 써 주세요':'우리 동네 찾기 — 예: 대정읍, 영종구, 인천 중구'}"><button class="btn">찾기</button></form></section>
 <div class="notice"><b>이름이 바뀐 지역이 있어요.</b> 2026년 7월 1일 전남광주통합특별시가 출범했고, 인천은 제물포구·영종구·서해구·검단구로 바뀌었어요. AI는 아직 옛 이름으로 말하기도 해요. <a href="#/find?q=인천 중구">옛 이름으로 찾아보기</a></div>
 <h2>대한민국 영역 <span class="ex">예시</span></h2><div class="card">${bars(kr)}</div>
 <h2>시도별로 보기</h2><div class="grid">${children(kr).map(s=>`<a class="item" href="#/r/${s.slug}"><span><b>${esc(s.name)}</b><br><span class="mute">생활·행정 ${score(s.slug,'life')}% · 관광 ${score(s.slug,'tour')}%</span></span><span aria-hidden="true">›</span></a>`).join('')}</div>
 <p class="mute">시도는 공식 순서로 보여 줘요. 순위가 아니에요.</p>
 <h2>이번 달 고친 이야기</h2>${D.cases.slice(0,2).map(caseCard).join('')}<a href="#/cases">고친 이야기 더 보기</a>`};
function caseCard(c){const r=region(c.region);return `<div class="card" style="margin-bottom:8px"><div class="mute">${esc(r?r.name:'')} · ${esc(areaName(c.area))} · ${c.at}</div><div class="said" style="margin-top:4px">${esc(c.before)}</div><div class="pen">${esc(c.after)}</div><div class="ev">${esc(c.how)} · ${esc(c.result)}</div></div>`}
V.find=q=>{q=(q||'').trim();let res=[];if(q){const all=[...D.sido.map(s=>SIDO[s[0]]),...D.sigungu.map(s=>SGG[s.slug]),...D.dong.map(d=>DONG[d.slug])];res=all.filter(r=>(r.name+' '+(r.short||'')).indexOf(q.replace(/\s/g,'').length?q:q)>=0||r.name.replace(/\s/g,'').indexOf(q.replace(/\s/g,''))>=0)}
 const olds=q?D.old.filter(o=>o.name.replace(/\s/g,'').indexOf(q.replace(/\s/g,''))>=0||q.replace(/\s/g,'').indexOf(o.name.replace(/\s/g,''))>=0):[];
 return `<div class="crumb"><a href="#/">대한민국</a> › 지역 찾기</div><h1 style="font-size:1.5rem;margin:0 0 10px">${S.easy?'우리 동네 찾기':'지역 찾기'}</h1>
 <form id="findForm" role="search" style="display:flex;gap:6px"><label for="fq" style="position:absolute;left:-9999px">지역 이름</label><input id="fq" class="text" value="${esc(q)}" placeholder="시도, 시군구, 읍면동 이름 (옛 이름도 돼요)"><button class="btn">찾기</button></form>
 <div class="chips" style="margin-top:10px">${['대정읍','서귀포','영종','인천 중구','광주광역시','한빛'].map(x=>`<button type="button" data-q="${x}">${x}</button>`).join('')}</div>
 ${olds.map(o=>`<div class="notice" role="note"><b>“${esc(o.name)}”은(는) ${o.validTo.slice(0,4)}년 ${+o.validTo.slice(5,7)}월까지 쓰던 이름이에요.</b><br>${esc(o.note)}<div style="margin-top:8px">${o.to.map(t=>{const r=region(t);return r?`<a class="btn blue" style="display:inline-block;text-decoration:none;margin:4px 6px 0 0;color:#fff" href="#/r/${t}">${esc(r.name)}로 가기</a>`:''}).join('')}</div></div>`).join('')}
 <div class="list" style="margin-top:12px">${res.map(r=>`<a class="item" href="#/r/${r.slug}"><span><b>${esc(r.name)}</b> <span class="mute">${r.level}${r.level!=='광역'?' · '+esc((parentOf(r)||{}).name||''):''}</span></span><span aria-hidden="true">›</span></a>`).join('')}${q&&!res.length&&!olds.length?'<p class="mute">찾는 지역이 없어요. 다른 이름으로 찾아보거나, 시도부터 차례로 찾아보세요.</p>':''}</div>
 ${q?'':`<h2>시도부터 찾기</h2><div class="grid">${D.sido.map(s=>`<a class="item" href="#/r/${s[0]}"><b>${esc(s[1])}</b><span aria-hidden="true">›</span></a>`).join('')}</div>`}`};
let TAB='sum';
V.region=slug=>{const r=region(slug);if(r&&r.level==='국가')return V.home();if(!r)return `<p>지역을 찾을 수 없어요. <a href="#/find">지역 찾기</a></p>`;const qa=qaOf(r),kids=children(r);
 let title,sub;
 if(r.level==='광역'){title=S.easy?`AI가 ${r.short}을(를) 잘 알까요?`:`AI가 말하는 ${r.short}, 얼마나 맞을까요?`;sub=S.easy?'여러 나라 말로 확인했어요.':'관광·교통·생활 정보를 여러 언어로 확인했어요.'}
 else if(r.level==='기초'){[title,sub]=r.hero||[`${r.name}, AI는 얼마나 정확할까요?`,'이 지역은 아직 기본 페이지예요. 공개 측정 결과가 쌓이면 보여 드릴게요.']}
 else{title=`우리 동네 정답 — ${r.name}`;sub=S.easy?'동네 정보, AI가 맞게 알까요?':'행정복지센터, 장날, 버스. AI가 맞게 알고 있을까요?'}
 const co=r.contract?`<span class="cobrand">서귀포시와 함께</span>`:'';
 const since=r.since?`<div class="notice"><b>이 지역은 ${r.since.slice(0,4)}년 ${+r.since.slice(5,7)}월 ${+r.since.slice(8,10)}일에 생겼어요.</b> 이전 이름: ${r.from.map(esc).join(', ')}. AI는 아직 옛 이름으로 말하기도 해요.</div>`:'';
 const tabs=[['sum','요약'],['area','영역별'],['cases','정정 사례'],['kids',r.level==='읍면동'?'동네 가게':'하위 지역'],['join','참여']].concat(r.contract?[['fix','정정 처리 현황']]:[]);
 let body='';
 if(TAB==='sum'){body=(qa.length?`<h2>${r.level==='읍면동'?'오늘 알아 둘 정답':'AI가 다르게 말한 것'}</h2>${qa.map(qRow).join('')}`:'<p class="mute" style="margin-top:14px">아직 이 지역의 질문이 측정되지 않았어요. 궁금한 질문을 제안해 주세요.</p>')+(r.level!=='읍면동'?`<h2>영역별 결과 <span class="ex">예시</span></h2><div class="card">${bars(r)}</div>`:`<p class="mute">동 단위는 표본이 적어 비율 대신 건수로 보여 줘요: 확인된 정답 ${qa.filter(x=>x.label==='ok').length}건 · 고칠 것 ${qa.filter(x=>x.label!=='ok').length}건<span class="ex">예시</span></p>`)}
 else if(TAB==='area'){body=D.areas.map(a=>{const qs=qa.filter(q=>q.area===a[0]);return `<h2>${esc(areaName(a[0]))}</h2>${qs.length?qs.map(qRow).join(''):'<p class="mute">이 영역의 질문은 아직 없어요.</p>'}`}).join('')}
 else if(TAB==='cases'){const cs=D.cases.filter(c=>c.region===r.slug||c.region.indexOf(r.slug+'/')===0||r.slug==='kr');body=`<h2>고친 이야기</h2>${cs.length?cs.map(caseCard).join(''):'<p class="mute">아직 고친 이야기가 없어요. 첫 번째 정답을 함께 찾아 주세요.</p>'}`}
 else if(TAB==='kids'){body=r.level==='읍면동'?`<h2>동네 가게 (가나다순 · 순위 아님)</h2><div class="item"><span>[예시] 모슬포 국수집 · 음식점</span><a href="#/r/${r.slug}" onclick="return false">AIHompy</a></div><div class="item"><span>[예시] 오일장 꽃집 · 꽃</span><a href="#/r/${r.slug}" onclick="return false">AIHompy</a></div>`:`<h2>하위 지역</h2>${kids.length?kids.map(k=>`<a class="item" href="#/r/${k.slug}"><span><b>${esc(k.name)}</b>${k.basic?' <span class="mute">기본 페이지</span>':''}</span><span aria-hidden="true">›</span></a>`).join(''):'<p class="mute">하위 지역 페이지를 준비하고 있어요.</p>'}`}
 else if(TAB==='join'){body=`<h2>함께하기</h2><div class="grid"><div class="card"><b>AI 답 확인하기</b><p class="mute">받은 AI 답이 맞는지 확인하고 다르면 알려 주세요.</p><a class="btn" style="display:inline-block;text-decoration:none;color:#fff" href="#/check?r=${r.slug}">AI 답 확인</a></div><div class="card"><b>${r.level==='읍면동'?'주민 확인':'확인단'}</b><p class="mute">${r.level==='읍면동'?'동네 시설 정보를 직접 확인해 주세요.':'교육을 받고 지역 정보를 확인하는 활동이에요. 일자리 사업과 연결될 수 있어요.'}</p><button class="btn ghost" data-go="#/join">알아보기</button></div></div>`}
 else if(TAB==='fix'){body=`<h2>정정 처리 현황</h2><p class="mute">서귀포시가 AI 오답을 어떻게 처리하고 있는지 공개해요.</p>${S.inbox.map(c=>`<div class="item"><span>${esc(c.q)}<br><span class="mute">${esc(c.type)} · ${esc(c.dept||'배정 대기')}</span></span><span class="badge b-${c.status==='재측정 예약'?'ok':'old'}">${esc(c.status)}</span></div>`).join('')}`}
 return `<div class="crumb">${crumbs(r)}</div><section class="hero"><h1>${esc(title)}${co}</h1><p>${esc(sub)}</p></section>${since}<div class="tabs" role="tablist">${tabs.map(t=>`<button role="tab" data-tab="${t[0]}" aria-selected="${TAB===t[0]}">${t[1]}</button>`).join('')}</div>${body}`};
function qRow(x){return `<div class="qrow" id="row-${x.id}"><button aria-expanded="false" data-row="${x.id}"><span><b>${esc(x.q)}</b><br><span class="mute">${esc(areaName(x.area))}</span></span><span style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${x.risk?riskB:''}${badge(x.label)}</span></button><div class="body"><div class="mute">AI는 이렇게 말했어요</div><div class="${x.label==='ok'?'':'said'}">${esc(x.ai)}</div><div class="mute" style="margin-top:6px">확인된 정답</div><div class="fact">${esc(x.fact)}</div><div class="ev">근거: ${esc(x.ev)} · 확인일 ${x.at} · ${esc(LAB[x.label][2])}</div>${x.label!=='ok'?`<div style="margin-top:10px"><button class="btn ghost" data-report="${x.id}">다르게 말한 AI 답 알려 주기</button></div>`:''}</div></div>`}
const SAMPLES=[{r:'jeju/seogwipo/daejeong',t:'대정 오일장은 매주 토요일에 열려요. 대정읍 행정복지센터는 평일 9시부터 6시까지예요.'},{r:'incheon/yeongjong',t:'영종도는 인천광역시 중구에 속합니다. 영종도에서 인천 시내 가는 버스 노선은 찾을 수 없습니다.'},{r:'chungbuk/hanbit',t:'한빛군립도서관은 일요일에 쉽니다. 한빛 국화축제는 10월 23일부터 11월 1일까지 군민공원에서 열립니다.'}];
V.check=pre=>{const rs=Object.keys(D.qa);return `<div class="crumb"><a href="#/">대한민국</a> › AI 답 확인</div><h1 style="font-size:1.5rem;margin:0 0 6px">${S.easy?'AI 답 맞는지 보기':'AI 답 확인'}</h1><p class="mute">AI에게 받은 답을 붙여넣어 주세요. 어느 지역 이야기인지도 알려 주세요.</p>
 <label class="lb" for="cr">지역</label><select id="cr" class="sel">${rs.map(s=>`<option value="${s}" ${pre===s?'selected':''}>${esc(region(s).name)} (${region(s).level})</option>`).join('')}</select>
 <label class="lb" for="ct">AI가 한 말</label><textarea id="ct" rows="4"></textarea>
 <div class="chips" style="margin-top:8px"><span class="mute">예시 넣기:</span>${SAMPLES.map((s,i)=>`<button type="button" data-sample="${i}">${esc(region(s.r).name)}</button>`).join('')}</div>
 <div style="margin-top:12px"><button class="btn" id="runCheck">확인하기</button></div><div id="checkOut" aria-live="polite"></div>`};
function judgeText(slug,text){const qa=qaOf(region(slug));const sents=text.split(/(?<=[.요다])\s+/).filter(s=>s.trim());const words=q=>q.split(/\s+/).map(w=>w.replace(/[은는이가을를의에서요?]+$/,'')).filter(w=>w.length>=2);return sents.map(s=>{let best=null,bs=0;qa.forEach(x=>{const n=words(x.q).filter(w=>s.indexOf(w)>=0).length+2*words(x.ai).filter(w=>s.indexOf(w)>=0).length;if(n>bs){bs=n;best=x}});if(!best)return {s,label:null};const lab=best.label==='ok'?'ok':(s.indexOf(best.fact.slice(0,4))>=0?'ok':best.label);return {s,label:lab,hit:best}})}
V.done=()=>{const c=S.claims[S.claims.length-1];if(!c)return `<p>알려 주신 내용이 없어요. <a href="#/check">AI 답 확인</a></p>`;return `<h1 style="font-size:1.5rem">고마워요.</h1><p>확인단이 공식 자료와 맞춰 볼게요. 결과가 나오면 알려 드릴게요.</p>
 <div class="answercard" id="acard"><div class="mute">${esc(region(c.r).name)} · 정답노트</div><div class="mute" style="margin-top:6px">AI는 이렇게 말했어요</div><div class="said">${esc(c.ai)}</div><div class="mute" style="margin-top:6px">확인된 정답</div><div class="pen">${esc(c.fact)}</div><div class="ev">${esc(c.ev||'')}</div></div>
 <p class="mute">AI가 다르게 말한 것을 함께 고쳤어요. 확인된 정답을 나눠 주세요.</p><button class="btn" id="shareBtn">정답 카드 공유하기</button> <a href="#/r/${c.r}">지역 페이지로</a>`};
V.cases=()=>`<div class="crumb"><a href="#/">대한민국</a> › 정정 사례</div><h1 style="font-size:1.5rem;margin:0 0 10px">${S.easy?'고친 이야기':'정정 사례'}</h1>${D.cases.map(caseCard).join('')}`;
V.method=()=>`<div class="crumb"><a href="#/">대한민국</a> › 방법</div><h1 style="font-size:1.5rem;margin:0 0 10px">${S.easy?'어떻게 재나요':'어떻게 확인하나요'}</h1>
 <div class="card"><p>같은 질문을 여러 AI에게 같은 날 묻고, 공식 자료로 확인한 <b>정답(정본)</b>과 비교해요. 두 사람이 따로 판정하고, 판정 기준은 전국이 같아요.</p></div>
 <h2>판정 라벨</h2><div class="tw"><table class="t"><thead><tr><th>라벨</th><th>뜻</th><th>쉬운 말</th></tr></thead><tbody>${Object.keys(LAB).map(k=>`<tr><td>${badge(k)}</td><td>${LAB[k][2]}</td><td>${LAB[k][1]}</td></tr>`).join('')}<tr><td>${riskB}</td><td>따르면 안전·건강·이동에 문제가 생길 수 있어요.</td><td>조심하세요.</td></tr></tbody></table></div>
 <h2>원칙</h2><ul><li>순위를 매기지 않습니다. 함께 고칩니다.</li><li>모든 숫자 옆에 측정일과 질문 수를 적어요.</li><li>지자체도 판정을 바꿀 수 없어요. 이의는 같은 기준으로 다시 판정해요.</li><li>선거 기간에는 지역 비교를 발표하지 않아요.</li></ul>`;
V.join=()=>`<h1 style="font-size:1.5rem">${S.easy?'함께하기':'참여하기'}</h1><div class="grid"><div class="card"><b>시민</b><p class="mute">AI 답을 확인하고 다르면 알려 주세요. 누구나 할 수 있어요.</p><a class="btn" style="display:inline-block;text-decoration:none;color:#fff" href="#/check">AI 답 확인</a></div><div class="card"><b>확인단</b><p class="mute">30분 교육을 마치고 지역 정보를 확인해요. 활동 시간이 기록돼요.</p><button class="btn ghost" data-mode-go="crew">참여자 앱 보기</button></div><div class="card"><b>판정단</b><p class="mute">장애 당사자가 AI 안내를 직접 평가해요. 장애인 단체와 함께 운영해요.</p></div></div><p class="mute">만 14세 미만은 보호자 동의가 필요해요. 신고와 질문 제안은 함께할 수 있어요.</p>`;
/* ----- crew ----- */
V.crew=()=>`<h1 style="font-size:1.5rem">오늘의 미션 <span class="mute" style="font-size:.9rem">감귤나무 님 · 서귀포 확인단</span></h1>${S.trained?'':`<div class="lock">첫 미션 전에 30분 교육을 마쳐 주세요. 확인 기준과 근거 찾는 법을 배워요. <a href="#/crew/train">교육 시작</a></div>`}
 <div class="grid" style="margin-top:12px">${[['대정 오일장 날짜 확인','12분','시민 신고 1건 · 읍사무소 확인'],['대정 공공도서관 휴관일 확인','8분','정본 옛 정보'],['마라도 배편 출발지 확인','15분','위험 표시 · 운항사 공지']].map((m,i)=>`<div class="card"><b>${m[0]}</b><div class="mute">${m[2]} · 예상 ${m[1]}</div><div style="margin-top:8px"><button class="btn" data-mission="${i}" ${S.trained?'':'disabled'}>${S.trained?'시작':'교육 후 열려요'}</button></div></div>`).join('')}</div>`;
const QUIZ=[['“매주 토요일에 열린다”는 AI 답, 정본은 “1·6일 장”이에요. 라벨은?',['정확','없는 사실','모름'],1],['예전 휴관일(일요일)을 말했어요. 지금은 월요일이에요.',['옛 정보','혼동','정확'],0],['정답의 근거로 쓸 수 있는 것은?',['블로그 후기','공식 안내·현장 확인','다른 AI의 답'],1]];
V.train=()=>`<h1 style="font-size:1.5rem">확인단 교육 (30분)</h1><div class="card"><b>1. 정본이란?</b><p class="mute">공식 자료나 현장 확인으로 맞다고 확인한 정보예요. 날짜가 있어요.</p><b>2. 판정 라벨</b><p class="mute">정확 · 옛 정보 · 없는 사실 · 혼동 · 모름, 그리고 위험 표시.</p><b>3. 근거 찾기</b><p class="mute">공식 안내, 담당 부서, 현장 사진. 블로그나 다른 AI 답은 근거가 아니에요.</p></div>
 <h2>확인 문제</h2>${QUIZ.map((q,i)=>`<div class="card" style="margin-bottom:8px"><b>${i+1}. ${esc(q[0])}</b><div class="chips" style="margin-top:6px">${q[1].map((o,j)=>`<button type="button" data-quiz="${i}" data-o="${j}" aria-pressed="${S.quiz[i]===j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
 <button class="btn" id="passBtn">제출하고 수료하기</button> ${S.trained?'<span class="badge b-ok">✓ 수료함</span>':''}`;
V.judge=()=>{const x=D.qa['jeju/seogwipo/daejeong'][2];const j=S.judged[x.id];return `<h1 style="font-size:1.5rem">판정 작업대</h1>${S.trained?'':'<div class="lock">교육을 마치면 판정할 수 있어요.</div>'}
 <div class="layout2" style="grid-template-columns:1fr 1fr"><div class="card"><div class="mute">질문</div><b>${esc(x.q)}</b><div class="mute" style="margin-top:8px">AI 답 (서비스 2)</div><div>${esc(x.ai)}</div></div><div class="card"><div class="mute">정본</div><div class="fact">${esc(x.fact)}</div><div class="ev">${esc(x.ev)}</div></div></div>
 <h2>라벨 고르기</h2><div class="chips">${Object.keys(LAB).map(k=>`<button type="button" data-label="${k}" aria-pressed="${j&&j.l===k}" ${S.trained?'':'disabled'}>${LAB[k][0]}</button>`).join('')}</div>
 <label class="chk" style="display:flex;gap:6px;margin-top:10px"><input type="checkbox" id="jrisk" ${j&&j.r?'checked':''} ${S.trained?'':'disabled'}> 위험 표시 (따르면 이동에 문제가 생길 수 있음)</label>
 <label class="lb" for="jwhy">이유</label><input id="jwhy" class="text" value="${esc(j?j.w:'')}" placeholder="예: 운진항에서도 출발함">
 <div style="margin-top:10px"><button class="btn" id="jsubmit" ${S.trained?'':'disabled'}>판정 보내기</button></div><div id="jout"></div>`};
V.me=()=>`<h1 style="font-size:1.5rem">내 활동</h1><div class="grid"><div class="card"><div class="mute">활동 시간</div><div class="kpi">${312+S.minutes}분</div></div><div class="card"><div class="mute">확인·판정</div><div class="kpi">${41+S.tasks}건</div></div><div class="card"><div class="mute">기준 문항 정답률</div><div class="kpi">96%</div></div></div>
 <h2>일자리 사업 증빙</h2><div class="card tw"><table class="t"><thead><tr><th>날짜</th><th>활동</th><th>시간</th><th>품질</th></tr></thead><tbody><tr><td>2026-09-28</td><td>대정읍 시설 정보 확인 4건</td><td>48분</td><td>기준 충족</td></tr><tr><td>2026-09-29</td><td>판정 6건</td><td>55분</td><td>교차 일치 5/6</td></tr>${S.tasks?`<tr><td>오늘</td><td>판정 ${S.tasks}건</td><td>${S.minutes}분</td><td>검수 대기</td></tr>`:''}</tbody></table><p class="mute">가명으로 기록되며, 증빙 출력은 담당자 승인 후 가능해요 (예시).</p></div>`;
/* ----- portal ----- */
function portalShell(cur,inner){const n=PORTAL_NAV.map(x=>`<a href="${x[0]}" ${cur===x[0]?'aria-current="page"':''}>${x[1]}</a>`).join('');return `<div class="layout2"><nav class="side" aria-label="포털 메뉴">${n}<p class="mute" style="padding:8px 10px">담당: 정보화담당관 (예시)</p></nav><div>${inner}</div></div>`}
V.portal=()=>{const r=region('jeju/seogwipo');const open=S.inbox.filter(c=>c.status!=='재측정 예약').length;return portalShell('#/portal',`<h1 style="font-size:1.4rem">서귀포시 대시보드</h1>
 <div class="grid"><div class="card"><div class="mute">다음에 할 일</div><div class="kpi">${open}건</div><div class="mute">정정 처리함에서 배정·처리</div></div><div class="card"><div class="mute">발표 전 확인 요청</div><div class="kpi">${S.objections.length?'완료':'1건'}</div><div class="mute">11월 대한민국 영역 발표 전</div></div><div class="card"><div class="mute">확인단 활동 (이번 달)</div><div class="kpi">${735+S.minutes}분</div></div></div>
 <h2>서귀포 성적표 <span class="ex">예시</span></h2><div class="card">${bars(r)}</div><p class="mute">숫자보다 “다음에 할 일”을 먼저 보세요. 지역 간 순위는 제공하지 않아요.</p>`)};
V.review=()=>portalShell('#/portal/review',`<h1 style="font-size:1.4rem">발표 전 사실 확인</h1><p>발표 전에 결과를 확인해 주세요. 근거와 함께 남긴 의견은 재판정 기록에 함께 남습니다. 판정은 같은 기준으로 다시 이뤄집니다.</p>
 ${qaOf(region('jeju/seogwipo')).map(x=>{const o=S.objections.find(z=>z.id===x.id);return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(x.q)}</b>${badge(x.label)}</div><div class="mute">AI 답: ${esc(x.ai)}</div><div class="fact">정본: ${esc(x.fact)}</div>${o?`<div class="notice"><b>의견 접수 · 재판정 대기</b><br>${esc(o.t)}</div>`:`<details><summary>의견 남기기</summary><textarea rows="2" id="ob-${x.id}" placeholder="근거와 함께 적어 주세요"></textarea><button class="btn blue" style="margin-top:6px" data-obj="${x.id}">의견 보내기</button></details>`}</div>`}).join('')}`);
V.inbox=()=>portalShell('#/portal/inbox',`<h1 style="font-size:1.4rem">정정 처리함</h1><p class="mute">오답을 정본 문제·수집 문제·출처 문제로 나눠 처리해요.</p>
 ${S.inbox.map(c=>`<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(c.q)}</b><span>${c.risk?riskB:''} ${badge(c.label)}</span></div><div class="mute">${esc(c.type)} — ${esc(c.note)}</div>
 <div class="grid" style="margin-top:8px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))"><label>담당 부서<select class="sel" data-dept="${c.id}"><option value="">선택</option>${['정보화담당관','관광진흥과','교통행정과','대정읍사무소'].map(d=>`<option ${c.dept===d?'selected':''}>${d}</option>`).join('')}</select></label><label>기한<input class="text" type="date" data-due="${c.id}" value="${c.due}"></label><label>상태<select class="sel" data-st="${c.id}">${['배정 대기','처리 중','재측정 예약'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></label></div></div>`).join('')}`);
V.program=()=>portalShell('#/portal/program',`<h1 style="font-size:1.4rem">참여 사업 현황</h1><p class="mute">확인단·판정단 활동 (가명). 일자리 사업 증빙으로 쓸 수 있어요.</p><div class="card tw"><table class="t"><thead><tr><th>가명</th><th>역할</th><th>활동 시간</th><th>품질</th><th>수료</th></tr></thead><tbody>${D.crew.map((c,i)=>`<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td><td>${c[2]+(i===0?S.minutes:0)}분</td><td>${c[3]?c[3]+'%':'—'}</td><td>${c[4]||(i===3&&S.trained)?'✓':'교육 중'}</td></tr>`).join('')}</tbody></table></div><button class="btn ghost" style="margin-top:10px" id="printBtn">이번 달 증빙 미리보기</button>`);
/* ----- ops ----- */
V.ops=()=>{const rows=[...D.sido.map(s=>[s[1],'광역','현행','—','—']),...D.old.map(o=>[o.name,o.level,'~ '+o.validTo,o.to.map(t=>region(t)?region(t).name:t).join(', '),o.note]),...D.sigungu.map(s=>[s.name+' ('+esc(SIDO[s.parent].short)+')','기초',s.since?s.since+' ~':'현행',s.from?'← '+s.from.join(', '):'—',s.virtual?'가상 지역':''])];
 return `<h1 style="font-size:1.4rem">지역 레지스트리</h1><p class="mute">행정구역을 유효 구간이 있는 정본으로 관리해요. 통합·분리·이름 변경은 승계 관계로 이어 과거 결과를 새 구역에 붙여요.</p><div class="card tw"><table class="t"><thead><tr><th>이름</th><th>층</th><th>유효 구간</th><th>승계</th><th>메모</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td class="mute">${esc(r[4])}</td></tr>`).join('')}</tbody></table></div>
 <p class="mute">광역 16 · 기초 약 227 · 읍면동 약 3,500 (2026년 10월 기준 추정, 행정안전부 집계로 확정). 이 데모에는 일부만 담았어요.</p>`};
/* ----- router ----- */
function route(){const h=location.hash||'#/';let [path,qs]=h.slice(1).split('?');const params=new URLSearchParams(qs||'');
 if(path.indexOf('/crew')===0)MODE='crew';else if(path.indexOf('/portal')===0)MODE='portal';else if(path.indexOf('/ops')===0)MODE='ops';else MODE='public';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===MODE)));
 gnb();let html='';
 if(path==='/'||path==='')html=V.home();else if(path==='/find')html=V.find(params.get('q'));else if(path.indexOf('/r/')===0||path==='/r'){html=V.region(decodeURIComponent(path.slice(3))||'kr')}else if(path==='/check')html=V.check(params.get('r'));else if(path==='/done')html=V.done();else if(path==='/cases')html=V.cases();else if(path==='/method')html=V.method();else if(path==='/join')html=V.join();
 else if(path==='/crew')html=V.crew();else if(path==='/crew/train')html=V.train();else if(path==='/crew/judge')html=V.judge();else if(path==='/crew/me')html=V.me();
 else if(path==='/portal')html=V.portal();else if(path==='/portal/review')html=V.review();else if(path==='/portal/inbox')html=V.inbox();else if(path==='/portal/program')html=V.program();else if(path==='/ops')html=V.ops();else html='<p>페이지를 찾을 수 없어요. <a href="#/">처음으로</a></p>';
 $('#main').innerHTML=html;document.title=(document.querySelector('#main h1')||{}).textContent+' · 모두의 정답노트 (데모)';save()}
let lastPath='';
window.addEventListener('hashchange',()=>{const p=(location.hash||'#/').split('?')[0];if(p!==lastPath){TAB='sum';lastPath=p;window.scrollTo(0,0);$('#main').focus({preventScroll:true})}route()});
document.addEventListener('submit',e=>{e.preventDefault();if(e.target.id==='homeFind')location.hash='#/find?q='+encodeURIComponent($('#hq').value);if(e.target.id==='findForm')location.hash='#/find?q='+encodeURIComponent($('#fq').value)});
document.addEventListener('click',e=>{const b=e.target.closest('button,[data-go]');if(!b)return;
 if(b.dataset.mode){location.hash=b.dataset.mode==='public'?'#/':b.dataset.mode==='crew'?'#/crew':b.dataset.mode==='portal'?'#/portal':'#/ops';return}
 if(b.dataset.modeGo){location.hash='#/'+b.dataset.modeGo;return}
 if(b.dataset.go){location.hash=b.dataset.go;return}
 if(b.dataset.q){location.hash='#/find?q='+encodeURIComponent(b.dataset.q);return}
 if(b.dataset.tab){TAB=b.dataset.tab;route();return}
 if(b.dataset.row){const r=document.getElementById('row-'+b.dataset.row);const o=!r.classList.contains('open');r.classList.toggle('open',o);b.setAttribute('aria-expanded',String(o));return}
 if(b.dataset.report){const all=Object.entries(D.qa);for(const [rs,qs] of all){const x=qs.find(q=>q.id===b.dataset.report);if(x){S.claims.push({r:rs,ai:x.ai,fact:x.fact,ev:'근거: '+x.ev+' · 확인일 '+x.at});location.hash='#/done';return}}}
 if(b.dataset.sample){const s=SAMPLES[+b.dataset.sample];$('#cr').value=s.r;$('#ct').value=s.t;return}
 if(b.id==='runCheck'){const r=$('#cr').value,t=$('#ct').value.trim();const out=$('#checkOut');if(!t){out.innerHTML='<p class="mute">AI에게 받은 답을 붙여넣어 주세요.</p>';return}const res=judgeText(r,t);out.innerHTML=`<h2>확인 결과</h2>${res.map((x,i)=>`<div class="sent">${x.label?badge(x.label):'<span class="badge b-unk">확인 중</span>'} ${esc(x.s)}${x.hit?`<div class="ev" style="margin-top:4px">확인된 정답: <span class="fact">${esc(x.hit.fact)}</span> · ${esc(x.hit.ev)}</div>${x.label!=='ok'?`<button class="btn ghost" style="margin-top:6px" data-claim="${i}">이 문장 알려 주기</button>`:''}`:'<div class="ev">이 내용은 아직 확인된 정답이 없어요. 확인단이 살펴볼 수 있게 알려 주세요.</div>'}</div>`).join('')}`;window.__res={r,res};return}
 if(b.dataset.claim!=null&&window.__res){const x=window.__res.res[+b.dataset.claim];S.claims.push({r:window.__res.r,ai:x.s,fact:x.hit.fact,ev:'근거: '+x.hit.ev});location.hash='#/done';return}
 if(b.id==='shareBtn'){const c=S.claims[S.claims.length-1];const txt=`[모두의 정답노트] AI는 “${c.ai}”라고 말했지만, 확인된 정답은 “${c.fact}”예요.`;(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('공유 문구를 복사했어요.')).catch(()=>toast(txt));return}
 if(b.dataset.quiz!=null){S.quiz[+b.dataset.quiz]=+b.dataset.o;route();return}
 if(b.id==='passBtn'){const ok=QUIZ.every((q,i)=>S.quiz[i]===q[2]);if(ok){S.trained=true;toast('수료했어요. 이제 미션을 시작할 수 있어요.');route()}else toast('틀린 문제가 있어요. 다시 골라 보세요.');return}
 if(b.dataset.mission!=null){location.hash='#/crew/judge';return}
 if(b.dataset.label){S.judged['q3']=Object.assign(S.judged['q3']||{},{l:b.dataset.label});route();return}
 if(b.id==='jsubmit'){const j=S.judged['q3']||{};if(!j.l){$('#jout').innerHTML='<p class="mute">라벨을 골라 주세요.</p>';return}j.r=$('#jrisk').checked;j.w=$('#jwhy').value;S.judged['q3']=j;S.minutes+=12;S.tasks+=1;const agree=j.l==='mix';$('#jout').innerHTML=`<div class="notice"><b>확인 1건을 마쳤어요. 오늘 활동 시간에 12분이 기록됐어요.</b><br>${agree?'다른 판정자와 같은 판정이에요.':'다른 판정자와 판정이 달라요. 검수자가 다시 볼게요.'}</div>`;save();return}
 if(b.dataset.obj){const v=($('#ob-'+b.dataset.obj)||{}).value||'';if(!v.trim()){toast('근거와 함께 의견을 적어 주세요.');return}S.objections.push({id:b.dataset.obj,t:v});toast('의견을 받았어요. 같은 기준으로 다시 판정해요.');route();return}
 if(b.id==='printBtn'){toast('증빙 미리보기: 가명·활동 시간·품질이 담긴 월간 표를 출력해요 (데모).');return}
 if(b.id==='resetBtn'){if(confirm('데모를 처음 상태로 되돌릴까요?')){S=fresh();save();location.hash='#/';route()}return}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.dept){S.inbox.find(c=>c.id===t.dataset.dept).dept=t.value;if(t.value&&S.inbox.find(c=>c.id===t.dataset.dept).status==='배정 대기'){S.inbox.find(c=>c.id===t.dataset.dept).status='처리 중'}toast('담당 부서를 정했어요. 기한과 함께 알려 드릴게요.');route()}
 if(t.dataset.due){S.inbox.find(c=>c.id===t.dataset.due).due=t.value;save()}
 if(t.dataset.st){S.inbox.find(c=>c.id===t.dataset.st).status=t.value;if(t.value==='재측정 예약')toast('2주 뒤 같은 질문으로 다시 측정해요.');route()}});
document.body.classList.toggle('easy',S.easy);
lastPath=(location.hash||'#/').split('?')[0];route();
})();
</script></body></html>'''
open('index.html','w',encoding='utf-8').write(html);print(len(html))
