# ADR-0027 · MAPS 결제·청구 격리 및 가격 가정 게이트 (`MAPS-INV-05`, `INV-12`)

- **상태**: 승인 (2026-10-23)
- **관련 요구사항**: `FR-97`, `FR-103`, `FR-106`
- **관련 불변식**: `INV-3`, `INV-12`, `INV-17`, `MAPS-INV-05`, `MAPS-INV-06`, `MAPS-INV-10`

---

## 1. 배경

MAPS 스튜디오는 진단(Pulse · Deep Audit), 개입(Align · Close Pack), 증명(Proof), 상시 감시(Radar), 로컬 패키지(Local Pack) 등 유상 SKU를 제공한다. 만약 고객사의 결제 여부, 구독 티어, 청구 금액이 측정·판정·간극 산출이나 리포트 수치에 조금이라도 영향을 미치면 측정 도구로서의 신뢰가 즉시 무너진다(`MAPS-INV-05`). 또한 아직 시장 검증 전인 가격 가정을 확정 정가처럼 공표하거나 결제받으면 증거 대장 불변식(`INV-12`)을 위반하게 된다.

---

## 2. 결정

### 2.1 결제·판정 완전 격리 (`MAPS-INV-05`)
1. 결제·주문·구독·청구 테이블(`maps_billing_products`, `maps_billing_orders`, `maps_billing_payments`, `maps_billing_subscriptions`, `maps_billing_invoices`)은 코어 측정·판정·간극 테이블(`maps_runs`, `maps_observations`, `maps_judgments`, `maps_gap_tasks`, `maps_reports`)과 외래키(FK)나 조인을 맺지 않는다.
2. `lib/maps/core/**` 의 모든 함수(`judgeObservationAsOf`, `computeMapsMetrics`, `computeGaps`, `diagnoseCause6Stage`, `estimateMapsEffect`)는 결제 상태·금액·구독 플랜을 인자로 받지 않으며 `lib/maps/billing/**` 모듈을 import 하지 않는다.
3. 결제는 오직 작업 큐(`maps_jobs`) 실행 권한(쿼터) 활성화 여부에만 관여하며, 실행된 측정의 판정 기준과 산출 공식은 무료 점검이든 유료 감사든 100% 동일하다.

### 2.2 가격 확정 상태(`price_status`) 게이트 (`INV-12`, `MAPS-INV-10`)
1. 모든 상품(`maps_billing_products`)은 `price_status IN ('assumption', 'confirmed')` 컬럼을 가진다.
2. `price_status = 'assumption'` 인 SKU는 스토어프론트(`/studio`)에서 가격 숫자나 즉시 결제 버튼을 노출하지 않고 `[가정 · 맞춤 견적 문의]` 배지와 범위 안내만 표시하며, 결제 주문 생성 요청 시 거부한다.
3. 운영 어드민(`/ops/maps`)에서 가격 검증 후 `price_status = 'confirmed'` 로 승격된 SKU만 정가 표시 및 PG 결제(또는 확정 청구서 발행)가 가능하다.

### 2.3 Toss Payments 웹훅 서명 검증 및 멱등성
1. PG 웹훅(`/api/studio/webhooks/toss`)은 HMAC-SHA256 서명 검증(`verifyTossWebhookSignature`)을 통과한 요청만 처리한다.
2. 동일 `paymentKey` + `orderId` + `status` 조합의 중복 웹훅은 멱등 키(`idempotency_key`)로 감지하여 중복 결제 기록이나 중복 잡 생성을 방지한다.
3. 모든 상품 설명과 스토어프론트 화면에는 **보증 한계 고지**("제3자 AI 서비스의 답변 변경이나 특정 순서·노출을 보증하지 않으며, 본 서비스의 범위는 귀사 공식 정본 대장 구축·구조화 배포와 통제된 재측정 기록까지입니다")를 의무 표시한다(`MAPS-INV-06`).

---

## 3. 결과

- 결제 데이터가 판정·간극 엔진에 유입될 경로가 스키마와 모듈 양쪽에서 원천 차단되고, 미검증 가격 가정이 확정 가격처럼 오인되는 위험을 코드 수준에서 방지한다.
