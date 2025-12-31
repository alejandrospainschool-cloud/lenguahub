// src/modules/legal/PrivacyPolicy.jsx
import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#02040a] text-slate-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-500" /> Privacy Policy
          </h1>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-lg text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h3>1. Introduction</h3>
          <p>
            Welcome to Olé Learning. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights.
          </p>

          <h3>2. Data We Collect</h3>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Identity Data:</strong> Includes first name, last name, username or similar identifier (via Google Login).</li>
            <li><strong>Contact Data:</strong> Includes email address.</li>
            <li><strong>Usage Data:</strong> Includes information about how you use our website, products and services (e.g., words learned, quiz scores).</li>
          </ul>

          <h3>3. How We Use Your Data</h3>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>To register you as a new customer (via Firebase Auth).</li>
            <li>To process and deliver your subscription (via Stripe).</li>
            <li>To serve relevant advertisements (via Google AdSense).</li>
          </ul>

          <h3>4. Google AdSense & Cookies</h3>
          <p>
            We use Google AdSense to display ads. Google uses cookies to serve ads based on your prior visits to our website 
            or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based 
            on your visit to our sites and/or other sites on the Internet.
          </p>
          <p>
            You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Ads Settings</a>.
          </p>

          <h3>5. Third-Party Links</h3>
          <p>
            This website may include links to third-party websites, plug-ins and applications (e.g., Stripe for payments). 
            Clicking on those links or enabling those connections may allow third parties to collect or share data about you. 
            We do not control these third-party websites and are not responsible for their privacy statements.
          </p>

          <h3>6. Contact Us</h3>
          <p>If you have any questions about this privacy policy, please contact us at: <strong>support@olelearning.vip</strong></p>
        </div>
      </div>
    </div>
  );
}