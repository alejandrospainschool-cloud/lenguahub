// src/modules/legal/TermsOfService.jsx
import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-500" /> Terms of Service
          </h1>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-lg text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h3>1. Agreement to Terms</h3>
          <p>
            By accessing or using Olé Learning, you agree to be bound by these Terms of Service. 
            If you disagree with any part of the terms, then you may not access the Service.
          </p>

          <h3>2. Accounts</h3>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>

          <h3>3. Purchases & Subscriptions</h3>
          <p>
            If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply 
            certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date 
            of your credit card, and your billing address.
          </p>
          <p>
            Payments are processed securely via Stripe. We do not store your payment card details.
          </p>

          <h3>4. Termination</h3>
          <p>
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms.
          </p>

          <h3>5. Limitation of Liability</h3>
          <p>
            In no event shall Olé Learning, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for 
            any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, 
            data, use, goodwill, or other intangible losses.
          </p>

          <h3>6. Changes</h3>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or 
            use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>

          <h3>7. Contact Us</h3>
          <p>If you have any questions about these Terms, please contact us at: <strong>support@olelearning.vip</strong></p>
        </div>
      </div>
    </div>
  );
}