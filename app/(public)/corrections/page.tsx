'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CorrectionsForm() {
  const searchParams = useSearchParams();
  const unitParam = searchParams.get('unit') || '';

  const [unitId, setUnitId] = useState(unitParam);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          description,
          contact_email: contactEmail,
          evidence_url: evidenceUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed');
      }

      setIsSuccess(true);
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">정정 요청이 접수되었습니다.</h1>
        <p className="text-gray-600 mb-8">
          접수된 요청은 내부 검토를 거쳐 반영됩니다. (영업일 기준 3~5일 소요)
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">정정 요청 (Trust Mechanism)</h1>
      <p className="text-sm text-gray-600 mb-8 bg-blue-50 p-4 rounded-lg">
        실제 상황과 불일치하거나 억울한 판정에 대해 언제든 이의 제기가 가능합니다. 
        단, 처리에는 영업일 기준 3~5일이 소요될 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">단위 식별자 (Unit ID) *</label>
          <input
            type="text"
            required
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="예: lg-11000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">정정 요청 내용 *</label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="자세한 사유를 10자 이상 적어주세요."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연락처 이메일</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="선택사항"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">증빙 자료 URL</label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="선택사항 (예: https://...)"
          />
        </div>

        {errorMsg && (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '제출 중...' : '정정 요청 제출하기'}
        </button>
      </form>
    </div>
  );
}

export default function CorrectionsPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-12 px-4">로딩 중...</div>}>
      <CorrectionsForm />
    </Suspense>
  );
}
