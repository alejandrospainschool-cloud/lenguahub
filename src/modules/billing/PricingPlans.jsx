// src/modules/billing/PricingPlans.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Users, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

export default function PricingPlans({ user }) {
  const navigate = useNavigate()
  const [billingPeriod, setBillingPeriod] = useState('monthly') // Future: annual support

  const plans = [
    {
      id: 'personal',
      name: 'Personal',
      description: 'For individual Spanish learners',
      price: '£9.99',
      period: '/month',
      color: 'blue',
      features: [
        'Personal word bank',
        'Study & practice modules',
        'AI translation tools',
        'Progress tracking',
        'Streak gamification',
        'Mobile optimized',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      id: 'tutor-lite',
      name: 'Tutor Lite',
      description: 'For independent tutors',
      price: '£50',
      period: '/month',
      color: 'purple',
      students: 'Up to 10 students',
      features: [
        'Everything in Personal',
        'Student roster management',
        'Progress dashboards',
        'Lesson tracking',
        'Class organization',
        'Priority email support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      id: 'tutor-pro',
      name: 'Tutor Pro',
      description: 'For tutoring businesses',
      price: '£100',
      period: '/month',
      color: 'indigo',
      students: 'Unlimited students',
      features: [
        'Everything in Tutor Lite',
        'Unlimited student accounts',
        'Advanced analytics',
        'Custom lesson templates',
        'Team collaboration',
        'API access (beta)',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      id: 'school',
      name: 'School Plan',
      description: 'For schools & language centers',
      price: '£5',
      period: '/student/month',
      color: 'emerald',
      features: [
        'All individual features',
        'Unlimited teachers',
        'Class management',
        'Bulk student import',
        'Advanced reporting',
        'GDPR compliance',
        'Dedicated support',
        'Custom integrations',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  const handleCTA = (plan) => {
    if (plan.cta === 'Start Free') {
      navigate('/dashboard')
    } else if (plan.cta === 'Contact Sales') {
      // TODO: Open contact form or email support
      window.open('mailto:support@lenguahub.com?subject=School%20Plan%20Inquiry')
    } else {
      // Navigate to create org or checkout
      navigate('/create-team')
    }
  }

  return (
    <div className="w-full py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include access to core Spanish learning features.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={clsx(
                'rounded-lg border p-6 flex flex-col transition-all hover:shadow-lg',
                plan.highlighted
                  ? `border-${plan.color}-500 bg-${plan.color}-50 dark:bg-${plan.color}-900/20 ring-2 ring-${plan.color}-500 transform scale-105`
                  : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800`
              )}
            >
              {plan.highlighted && (
                <div className="mb-3">
                  <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold', `bg-${plan.color}-500 text-white`)}>
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm ml-1">
                  {plan.period}
                </span>
              </div>

              {plan.students && (
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-6">
                  {plan.students}
                </p>
              )}

              {/* CTA Button */}
              <button
                onClick={() => handleCTA(plan)}
                className={clsx(
                  'w-full py-2 rounded-lg font-medium mb-6 transition-colors',
                  plan.highlighted
                    ? `bg-${plan.color}-500 hover:bg-${plan.color}-600 text-white`
                    : `bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white`
                )}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-4xl mx-auto border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I switch plans?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                We accept all major credit cards via Stripe. Schools can also pay via invoice.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Coming soon! Sign up for our newsletter to be notified when annual pricing is available.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Personal plan includes full freemium access. Team plans offer a 14-day free trial.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can schools negotiate custom pricing?</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Absolutely! For institutions with 500+ students, we offer volume discounts. Contact our sales team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
