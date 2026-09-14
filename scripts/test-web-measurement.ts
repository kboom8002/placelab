// scripts/test-web-measurement.ts
import { runMeasurement } from '../lib/measurement/runner';

async function main() {
  console.log('=== Web Measurement Engine Test (Simulation) ===');
  const result = await runMeasurement({
    agencyKey: '수원시',
    providers: ['gemini', 'openai'],
    repetitions: 1,
    simulation: true,
    onProgress: (p) => {
      if (p.currentQuestionIndex % 10 === 0 || p.phase === 'reporting' || p.phase === 'done') {
        console.log(`[Progress ${p.provider || ''}] ${p.phase} - ${p.detail || ''}`);
      }
    },
  });

  console.log('\n--- Result Summary ---');
  console.log('Agency:', result.agency);
  console.log('Providers tested:', result.providers);
  console.log('Total API calls:', result.totalApiCalls);
  console.log('Duration:', result.durationMs, 'ms');
  console.log('Summaries count:', result.summaries.length);
  for (const s of result.summaries) {
    console.log(`- ${s.provider.toUpperCase()} (${s.modelId}): Match ${s.matchCount}/${s.totalQuestions} (${s.accuracyRate}%), Public source: ${s.publicSourceRate}%`);
  }

  console.log('\n--- VIP Report Preview (First 300 chars) ---');
  console.log(result.vipReport.slice(0, 300) + '...\n');

  console.log('--- Technical Report Preview (First 300 chars) ---');
  console.log(result.technicalReport.slice(0, 300) + '...\n');

  console.log('✅ ALL TEST PASSED!');
}

main().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
