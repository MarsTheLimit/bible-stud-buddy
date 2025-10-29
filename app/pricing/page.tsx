// app/pricing/page.tsx
"use client";
import { useUserAccount } from "@/lib/hooks/useUserAccount";
import { useState, useEffect } from "react";
import { redirectToSubscription, cancelSubscription } from "@/lib/stripeApi";

const CancellationModal = ({ isVisible, onClose }: {isVisible: boolean, onClose: any}) => {
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
        supabase,
        user, 
        accountData, 
        loading, 
        accessLevel, 
        hasActiveTrial,
        hasProAccess,
        updateAccount,
        refresh
    } = useUserAccount();

    const [freeButtonText, setFreeButtonText] = useState("Get Started");
    const [freeTrialButtonText, setFreeTrialButtonText] = useState("Start Free Trial");
    const [proButtonText, setProButtonText] = useState("Upgrade to Pro");
    
    const [freeButtonDisabled, setFreeButtonDisabled] = useState(false);
    const [freeTrialButtonDisabled, setFreeTrialButtonDisabled] = useState(false);
    const [proButtonDisabled, setProButtonDisabled] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const [freeButtonStyle, setFreeButtonStyle] = useState("btn-outline-secondary");
    const [freeTrialButtonStyle, setFreeTrialButtonStyle] = useState("btn-primary");
    const [proButtonStyle, setProButtonStyle] = useState("btn-success");

    const [mostPopular, setMostPopular] = useState<'free' | 'trial' | 'pro'>('trial');

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    useEffect(() => {
        if (!accountData) return;

        // Determine button states based on user's current plan
        if (accessLevel === 'pro') {
            // Check if they have an active Stripe subscription ID
            setFreeButtonText(accountData.stripe_subscription_id ? "Cancel Subscription" : "Downgrade to Free");
            setFreeButtonStyle("btn-outline-danger");
            setFreeButtonDisabled(false);

            setFreeTrialButtonText("Not Available");
            setFreeTrialButtonStyle("btn-outline-secondary");
            setFreeTrialButtonDisabled(true);

            setProButtonText("Current Plan");
            setProButtonStyle("btn-outline-secondary");
            setProButtonDisabled(true);

            setMostPopular('pro');
        } else if (hasActiveTrial) {
            // User is on active trial
            setFreeButtonText("Cancel Trial");
            setFreeButtonStyle("btn-outline-danger");
            setFreeButtonDisabled(false);

            setFreeTrialButtonText("Active Trial");
            setFreeTrialButtonStyle("btn-outline-secondary");
            setFreeTrialButtonDisabled(true);

            setProButtonText("Upgrade to Pro");
            setProButtonStyle("btn-success");
            setProButtonDisabled(false);

            setMostPopular('trial');
        } else if (accountData.trial_used) {
            // User already used their trial
            setFreeButtonText("Current Plan");
            setFreeButtonStyle("btn-outline-secondary");
            setFreeButtonDisabled(true);

            setFreeTrialButtonText("Trial Already Used");
            setFreeTrialButtonStyle("btn-outline-secondary");
            setFreeTrialButtonDisabled(true);

            setProButtonText("Upgrade to Pro");
            setProButtonStyle("btn-success");
            setProButtonDisabled(false);

            setMostPopular('pro');
        } else {
            // User is on free and hasn't used trial
            setFreeButtonText("Current Plan");
            setFreeButtonStyle("btn-outline-secondary");
            setFreeButtonDisabled(true);

            setFreeTrialButtonText("Start Free Trial");
            setFreeTrialButtonStyle("btn-primary");
            setFreeTrialButtonDisabled(false);

            setProButtonText("Upgrade to Pro");
            setProButtonStyle("btn-success");
            setProButtonDisabled(false);

            setMostPopular('trial');
        }
    }, [accountData, hasActiveTrial, accessLevel]);

    async function handlePlanAction(plan: string) {
        if (!user || !accountData) return;
        
        if (plan === "pro") {
            await redirectToSubscription(user.id);
        }
        else if (plan === "trial") {
            await updateAccount({ account_type: 'pro', trial_used: true, trial_ends_at: trialEndDate.toISOString() })
            window.location.reload();
        }
        else if (plan === "free") {
            if (accountData.stripe_subscription_id) {
                // Call the utility function to cancel the Stripe subscription
                const cancelled = await cancelSubscription(accountData.stripe_subscription_id);

                if (cancelled) {
                    setIsCancelModalOpen(true);
                }
            } else {
                // For users on the trial or free plan without a Stripe ID
                await updateAccount({ account_type: 'free', trial_used: true, trial_ends_at: null })
                window.location.reload();
            }
        }
    }

    const handleModalClose = () => {
        setIsCancelModalOpen(false);
        window.location.reload();
    };

    const plans = [
        // ... (Your existing plans array)
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
                // { text: "AI calendar helper", included: false },
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
                // { text: "Can add events to Google, Samsung, Outlook, and Apple calendars", included: true },
                { text: "AI study plans", included: true },
                // { text: "AI calendar helper", included: true },
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
                // { text: "Can add events to Google, Samsung, Outlook, and Apple calendars", included: true },
                { text: "AI study plans", included: true },
                // { text: "AI calendar helper", included: true },
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
                            className={`card h-100 shadow-lg border-0 rounded-4 position-relative ${
                                plan.popular ? 'border-primary' : ''
                            }`}
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
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <h2 className="h3 fw-bold mb-2">{plan.name}</h2>
                                    <div className="mb-2">
                                        <span className="display-4 fw-bold">{plan.price}</span>
                                        <span className="text-muted">/{plan.period}</span>
                                    </div>
                                    <p className="text-muted small">{plan.description}</p>
                                </div>

                                {/* Features List */}
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

                                {/* CTA Button */}
                                {user && (
                                    <button 
                                        className={`btn ${plan.buttonStyle} w-100 py-3 fw-semibold rounded-3`}
                                        disabled={plan.buttonDisabled} 
                                        onClick={() => {handlePlanAction(plan.planType)}}
                                    >
                                        {plan.buttonText}
                                    </button>
                                )}
                                {!user && (
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