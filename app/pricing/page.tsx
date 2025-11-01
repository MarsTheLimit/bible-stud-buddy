// app/pricing/page.tsx
"use client";
import { useUserAccount } from "@/lib/hooks/useUserAccount";
import { redirectToSubscription, cancelSubscription } from "@/lib/stripeApi";
import React from "react";

const CancellationModal = ({ isVisible, onClose }: {isVisible: boolean, onClose: () => void}) => {
    if (!isVisible) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}
        >
            <div 
                style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    maxWidth: '400px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
            >
                <h3>Cancellation Confirmed</h3>
                <p>
                    Your subscription has been successfully canceled. You will retain Pro access until the end of the current billing period.
                </p>
                <button 
                    onClick={onClose} 
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default function PricingPage() {
    const { 
        user, 
        accountData, 
        loading, 
        accessLevel, 
        hasActiveTrial,
        updateAccount
    } = useUserAccount();

    const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Compute button states based on account info
    const isPro = accessLevel === 'pro';
    const trialUsed = accountData?.trial_used;

    const freeButtonText = isPro
        ? accountData?.stripe_subscription_id ? "Cancel Subscription" : "Downgrade to Free"
        : hasActiveTrial
        ? "Cancel Trial"
        : trialUsed
        ? "Current Plan"
        : "Current Plan";

    const freeButtonStyle = isPro || hasActiveTrial ? "btn-outline-danger" : "btn-outline-secondary";
    const freeButtonDisabled = !(isPro || hasActiveTrial) && trialUsed;

    const freeTrialButtonText = isPro
        ? "Not Available"
        : hasActiveTrial
        ? "Active Trial"
        : trialUsed
        ? "Trial Already Used"
        : "Start Free Trial";

    const freeTrialButtonStyle = isPro || hasActiveTrial || trialUsed ? "btn-outline-secondary" : "btn-primary";
    const freeTrialButtonDisabled = isPro || hasActiveTrial || trialUsed;

    const proButtonText = isPro ? "Current Plan" : "Upgrade to Pro";
    const proButtonStyle = isPro ? "btn-outline-secondary" : "btn-success";
    const proButtonDisabled = isPro;

    const mostPopular = isPro ? 'pro' : hasActiveTrial ? 'trial' : 'pro';

    async function handlePlanAction(plan: string) {
        if (!user || !accountData) return;
        
        if (plan === "pro") {
            await redirectToSubscription(user.id);
        }
        else if (plan === "trial") {
            await updateAccount({ account_type: 'pro', trial_used: true, trial_ends_at: trialEndDate.toISOString() });
            window.location.reload();
        }
        else if (plan === "free") {
            if (accountData.stripe_subscription_id) {
                const cancelled = await cancelSubscription(accountData.stripe_subscription_id);
                if (cancelled) setIsCancelModalOpen(true);
            } else {
                await updateAccount({ account_type: 'free', trial_used: true, trial_ends_at: null });
                window.location.reload();
            }
        }
    }

    const handleModalClose = () => {
        setIsCancelModalOpen(false);
        window.location.reload();
    };

    const plans = [
        {
            name: "Free",
            price: "$0",
            period: "forever",
            description: "Perfect for getting started",
            features: [
                { text: "Join unlimited groups", included: true },
                { text: "Create alerts", included: true },
                { text: "Create 1 group", included: true },
                { text: "Basic calendar features", included: true },
                { text: "AI study plans", included: false },
            ],
            buttonText: freeButtonText,
            buttonStyle: freeButtonStyle,
            buttonDisabled: freeButtonDisabled,
            popular: mostPopular === 'free',
            planType: 'free'
        },
        {
            name: "Free Trial",
            price: "$0",
            period: "14 days",
            description: "Try all Pro features risk-free",
            features: [
                { text: "Join unlimited groups", included: true },
                { text: "Create alerts", included: true },
                { text: "Advanced calendar features", included: true },
                { text: "AI study plans", included: true },
                { text: "Create unlimited groups", included: false },
            ],
            buttonText: freeTrialButtonText,
            buttonStyle: freeTrialButtonStyle,
            buttonDisabled: freeTrialButtonDisabled,
            popular: mostPopular === 'trial',
            planType: 'trial'
        },
        {
            name: "Pro",
            price: "$4.99",
            period: "per month",
            description: "Unlock all features",
            features: [
                { text: "Join unlimited groups", included: true },
                { text: "Create alerts", included: true },
                { text: "Create unlimited groups", included: true },
                { text: "Advanced calendar features", included: true },
                { text: "AI study plans", included: true },
            ],
            buttonText: proButtonText,
            buttonStyle: proButtonStyle,
            buttonDisabled: proButtonDisabled,
            popular: mostPopular === 'pro',
            planType: 'pro'
        },
    ];

    if (loading) return <div className="container py-5 text-center"><h2>Loading...</h2></div>;

    return (
        <div className="container py-5">
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold mb-3">
                    <span className="text-gradient">Choose Your Plan</span>
                </h1>
                <p className="lead text-muted">
                    Select the perfect plan for your needs. Upgrade, downgrade, or cancel anytime.
                </p>
            </div>

            <div className="row g-4 justify-content-center">
                {plans.map((plan, index) => (
                    <div key={index} className="col-12 col-md-6 col-lg-4">
                        <div 
                            className={`card h-100 shadow-lg border-0 rounded-4 position-relative ${plan.popular ? 'border-primary' : ''}`}
                            style={{ 
                                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                                transition: 'transform 0.3s ease'
                            }}
                        >
                            {plan.popular && (
                                <div className="position-absolute top-0 start-50 translate-middle">
                                    <span className="badge bg-primary px-3 py-2 rounded-pill">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <div className="card-body d-flex flex-column p-4">
                                <div className="text-center mb-4">
                                    <h2 className="h3 fw-bold mb-2">{plan.name}</h2>
                                    <div className="mb-2">
                                        <span className="display-4 fw-bold">{plan.price}</span>
                                        <span className="text-muted">/{plan.period}</span>
                                    </div>
                                    <p className="text-muted small">{plan.description}</p>
                                </div>

                                <ul className="list-unstyled mb-4 flex-grow-1">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="mb-3 d-flex align-items-start">
                                            <div className="me-3">
                                                {feature.included ? (
                                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                ) : (
                                                    <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                                                )}
                                            </div>
                                            <span 
                                                className={feature.included ? '' : 'text-muted text-decoration-line-through'}
                                            >
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {user ? (
                                    <button 
                                        className={`btn ${plan.buttonStyle} w-100 py-3 fw-semibold rounded-3`}
                                        disabled={plan.buttonDisabled} 
                                        onClick={() => handlePlanAction(plan.planType)}
                                    >
                                        {plan.buttonText}
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary w-100 py-3 fw-semibold rounded-3"
                                    >
                                        Sign Up to Get Started
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <CancellationModal 
                isVisible={isCancelModalOpen} 
                onClose={handleModalClose} 
            />
        </div>
    );
}
