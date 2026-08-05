import type { Metadata } from 'next';
import { IntakeForm } from './intake-form';

export const metadata: Metadata = {
  title: 'Submit Evaluation Request · Hai-ic',
  description: 'Submit your AI command, workflow, or execution for Hai-ic Intent Confidence evaluation.',
};

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-red-400 mb-3">Step 2 of 2</p>
          <h1 className="text-3xl font-bold text-white mb-3">Evaluation Request</h1>
          <p className="text-zinc-400 leading-relaxed">
            Describe the AI command, workflow, or execution you want HAI to evaluate. HAI will measure
            Intent Confidence and contact you with findings.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
          <p className="text-sm text-amber-300 leading-relaxed">
            <strong className="text-amber-200">Security notice:</strong> Do not submit API keys,
            passwords, access tokens, private credentials, or unrelated personal information.
          </p>
        </div>

        <IntakeForm />
      </div>
    </div>
  );
}
