// lib/maps/billing/toss.ts
// MAPS 결제·청구 격리 모듈 (Toss Payments 웹훅 HMAC 검증 · 멱등 처리 · 가격 가정 게이트)
// 근거: ADR-0027, INV-12, MAPS-INV-05, MAPS-INV-10
// 중요(MAPS-INV-05): 이 모듈은 lib/maps/core 의 판정·간극·지표 함수에 절대 주입되지 않는다.

import crypto from 'crypto';
import type { MapsSkuProduct } from '../core/types';

export interface TossWebhookPayload {
  eventType: 'PAYMENT_STATUS_CHANGED';
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED';
    totalAmount: number;
    method?: string;
    receiptUrl?: string;
  };
}

export interface RecordedBillingPayment {
  paymentId: string;
  orderId: string;
  paymentKey: string;
  idempotencyKey: string;
  amountKrw: number;
  status: 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED';
  rawWebhookHash: string;
}

/**
 * Toss Payments 웹훅 HMAC-SHA256 서명 검증
 */
export function verifyTossWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  secretKey: string;
}): boolean {
  const { rawBody, signatureHeader, secretKey } = params;
  if (!signatureHeader || !secretKey) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody, 'utf8')
    .digest('hex');

  const cleanHeader = signatureHeader.trim().replace(/^sha256=/i, '');
  if (expected.length !== cleanHeader.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(cleanHeader, 'utf8')
  );
}

/**
 * INV-12, MAPS-INV-10: price_status === 'assumption' 인 미확정 가격 SKU는
 * 즉시 결제 주문(pg_checkout)을 생성할 수 없으며 맞춤 견적 문의(b2b_quote)로만 접수한다.
 */
export function validateOrderCreation(params: {
  sku: MapsSkuProduct;
  orderMode: 'pg_checkout' | 'b2b_quote';
}): {
  allowed: boolean;
  reasonKo: string;
  amountKrw: number;
} {
  const { sku, orderMode } = params;

  if (orderMode === 'pg_checkout') {
    if (sku.priceStatus !== 'confirmed' || sku.confirmedPriceKrw === null) {
      return {
        allowed: false,
        reasonKo: `SKU(${sku.skuCode})는 현재 가격 가정([가정]) 단계이므로 즉시 결제(PG Checkout)가 차단됩니다. 맞춤 견적 문의를 이용해 주십시오 (INV-12, MAPS-INV-10).`,
        amountKrw: 0,
      };
    }
    return {
      allowed: true,
      reasonKo: '확정 가격 SKU 결제 주문 생성 가능',
      amountKrw: sku.confirmedPriceKrw,
    };
  }

  return {
    allowed: true,
    reasonKo: 'B2B 맞춤 견적 요청 접수 가능',
    amountKrw: sku.confirmedPriceKrw ?? 0,
  };
}

/**
 * 동일 웹훅 재전송 시 중복 결제 기록을 방지하는 멱등 처리기
 */
export function processTossWebhookIdempotent(params: {
  existingPayments: readonly RecordedBillingPayment[];
  payload: TossWebhookPayload;
  rawBody: string;
}): {
  duplicated: boolean;
  payments: RecordedBillingPayment[];
  processedRecord: RecordedBillingPayment;
} {
  const { existingPayments, payload, rawBody } = params;
  const idempotencyKey = `${payload.data.orderId}::${payload.data.paymentKey}::${payload.data.status}`;

  const existing = existingPayments.find(
    (p) => p.idempotencyKey === idempotencyKey
  );
  if (existing) {
    return {
      duplicated: true,
      payments: [...existingPayments],
      processedRecord: existing,
    };
  }

  const rawWebhookHash = crypto
    .createHash('sha256')
    .update(rawBody, 'utf8')
    .digest('hex');

  const newRecord: RecordedBillingPayment = {
    paymentId: `pay_${payload.data.orderId}_${existingPayments.length + 1}`,
    orderId: payload.data.orderId,
    paymentKey: payload.data.paymentKey,
    idempotencyKey,
    amountKrw: payload.data.totalAmount,
    status: payload.data.status,
    rawWebhookHash,
  };

  return {
    duplicated: false,
    payments: [...existingPayments, newRecord],
    processedRecord: newRecord,
  };
}
