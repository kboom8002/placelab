// app/api/studio/webhooks/toss/route.ts
// Toss Payments 웹훅 수신 엔드포인트 (HMAC 서명 검증 + 멱등성 + 판정 엔진 완전 격리)
// 근거: ADR-0027, FR-103, MAPS-INV-05

import { NextRequest, NextResponse } from 'next/server';
import {
  processTossWebhookIdempotent,
  verifyTossWebhookSignature,
  type RecordedBillingPayment,
  type TossWebhookPayload,
} from '@/lib/maps/billing/toss';

const memoryWebhookLedger: RecordedBillingPayment[] = [];

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-toss-signature');
    const secretKey =
      process.env.TOSS_WEBHOOK_SECRET ?? 'maps-dev-webhook-secret';

    const validSig = verifyTossWebhookSignature({
      rawBody,
      signatureHeader,
      secretKey,
    });

    if (!validSig) {
      return NextResponse.json(
        { error: 'Invalid Toss webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as TossWebhookPayload;
    const result = processTossWebhookIdempotent({
      existingPayments: memoryWebhookLedger,
      payload,
      rawBody,
    });

    if (!result.duplicated) {
      memoryWebhookLedger.push(result.processedRecord);
    }

    return NextResponse.json({
      ok: true,
      duplicated: result.duplicated,
      payment: result.processedRecord,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
