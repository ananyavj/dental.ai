import AppLayout from '../components/AppLayout'
import { MessageSquare, Lock, CheckCircle2 } from 'lucide-react'

export default function PeerReview() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text flex items-center gap-2">
            <MessageSquare size={15} className="text-dental-blue" /> Peer Review Feed
          </h1>
          <p className="text-xs text-dental-text-secondary">Anonymised case sharing for DCI-verified dentists</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <div className="w-16 h-16 bg-dental-blue-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-dental-blue" />
            </div>
            <h2 className="text-base font-bold text-dental-text">DCI Verification Required</h2>
            <p className="text-xs text-dental-text-secondary mt-2 leading-relaxed">
              The peer review feed is accessible only to DCI-registered dentists. Your registration number will be verified before access is granted.
            </p>
            <div className="mt-4 space-y-2">
              {[
                'Automated patient de-identification',
                'Structured second opinion format',
                'Specialty-tagged case sharing',
                'Verified dentist-only access',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-dental-text-secondary">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />{f}
                </div>
              ))}
            </div>
            <button className="btn-primary mt-6 mx-auto">Request Access</button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
