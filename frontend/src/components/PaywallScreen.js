import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PaywallScreen = () => {
  const { user, subscribe } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [processing, setProcessing] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$4.99',
      period: '/month',
      features: [
        'Unlimited tasks & scheduling',
        'All 5 AI personas',
        'Local event discovery',
        'Smart reminders',
        'Timeline planning'
      ]
    },
    {
      id: 'annual',
      name: 'Annual',
      price: '$39.99',
      period: '/year',
      savings: 'Save 33%',
      features: [
        'Everything in Monthly',
        'Priority support',
        'Early access to new features',
        'Advanced analytics',
        'Export capabilities'
      ]
    }
  ];

  const handleSubscribe = async () => {
    setProcessing(true);
    
    // Simulate PayPal payment flow
    try {
      const result = await subscribe(selectedPlan);
      if (result.success) {
        // Payment successful, user will be redirected to main app
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <div className="cc-logo-container cc-logo-large mb-6">
            <div className="cc-logo"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Your trial has ended, {user?.name}!
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Ready to unlock the full Cc experience?
          </p>
          <div className="inline-flex items-center space-x-2 bg-cc-gradient px-4 py-2 rounded-full text-white text-sm font-semibold">
            <span>🎉</span>
            <span>Join thousands of organized users</span>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 fade-in-delayed">
          {plans.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-cc-card rounded-2xl p-8 cursor-pointer transition-all border-2 ${
                selectedPlan === plan.id
                  ? 'border-cc-blue scale-105'
                  : 'border-transparent hover:border-cc-pink/50'
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {plan.savings && (
                <div className="absolute -top-3 right-4 bg-cc-gradient px-4 py-1 rounded-full text-sm font-semibold text-white">
                  {plan.savings}
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-4xl font-bold text-cc-gradient">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3 text-gray-300">
                    <div className="w-5 h-5 bg-cc-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              {selectedPlan === plan.id && (
                <div className="absolute inset-0 bg-cc-blue/5 rounded-2xl pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>

        {/* Payment Button */}
        <div className="text-center fade-in-delayed">
          <button
            onClick={handleSubscribe}
            disabled={processing}
            className="btn-cc-primary text-lg px-12 py-4 mb-6"
            data-testid="subscribe-btn"
          >
            {processing ? (
              <div className="flex items-center space-x-3">
                <div className="loading-spinner"></div>
                <span>Processing Payment...</span>
              </div>
            ) : (
              <>
                Subscribe to {plans.find(p => p.id === selectedPlan)?.name} Plan
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>🔒 Secure payment via PayPal</span>
            <span>•</span>
            <span>Cancel anytime</span>
            <span>•</span>
            <span>30-day money-back guarantee</span>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 fade-in">
          <div className="text-center">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Personas</h3>
            <p className="text-gray-400">
              Choose from 5 unique personalities to make your calendar experience truly yours.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Discovery</h3>
            <p className="text-gray-400">
              Find local events, cafes, and cultural activities based on your location and interests.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-2">One-Click Planning</h3>
            <p className="text-gray-400">
              Generate your daily timeline instantly with our intelligent task ordering system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallScreen;