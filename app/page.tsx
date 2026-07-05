'use client';

import { useState } from 'react';
import { analyzeIntent, type HaiIcResult } from '@/app/lib/hai-ic-analyze';

export default function HaiIcDemo() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<HaiIcResult | null>(null);

  const runAnalyze = () => {
    if (!input.trim()) return;
    setResult(analyzeIntent(input));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-2">Hai-ic</h1>
        <p className="text-xl text-gray-400 mb-10">Intent Confidence Analyzer</p>

        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runAnalyze();
            }}
            placeholder="일상어로 입력하세요... (예: 이번 프로젝트 7월 15일까지 예산 5천으로 끝내줘)"
            className="w-full h-32 bg-black border border-gray-700 rounded-xl p-6 text-lg resize-none focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={runAnalyze}
            disabled={!input.trim()}
            className="mt-4 w-full bg-white text-black py-4 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            의도 분석하기
          </button>
          <p className="mt-2 text-xs text-gray-500 text-center">Ctrl+Enter로 즉시 분석</p>
        </div>

        {result && (
          <div className="bg-gray-900 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-7xl font-bold text-green-400">{result.confidence}%</div>
              <div>
                <div className="text-2xl font-semibold">{result.mode}</div>
                <div className="text-gray-400">Intent Confidence</div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-400 mb-2">BREAKDOWN</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">핵심 의도:</span> {result.breakdown.core}</div>
                  <div><span className="text-gray-400">이해한 부분:</span> {result.breakdown.understood}</div>
                  <div><span className="text-gray-400">모호한 부분:</span> {result.breakdown.missing}</div>
                  <div><span className="text-gray-400">위험 요소:</span> {result.breakdown.risk}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-3">답변</h3>
                <div className="bg-black p-6 rounded-xl text-lg leading-relaxed whitespace-pre-line">
                  {result.response}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}