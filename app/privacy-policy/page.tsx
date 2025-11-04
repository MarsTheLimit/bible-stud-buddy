interface PrivacyPolicyProps {
  companyName: string;
  websiteName: string;
  lastUpdated: string;
  contactEmail: string;
  contactPageUrl: string;
}

const defaultProps: PrivacyPolicyProps = {
  companyName: "Mars the Limit",
  websiteName: "Bible Study Buddy",
  lastUpdated: "October 27, 2025",
  contactEmail: "marsthelimit890@gmail.com",
  contactPageUrl: "/#contact",
};

/**
 * Updated Privacy Policy Component
 */
const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  companyName,
  websiteName,
  lastUpdated,
  contactEmail,
  contactPageUrl,
}) => {
  const subheadingStyle: React.CSSProperties = {
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: "'Saira Extra Condensed', sans-serif",
    fontSize: '1.5rem',
  };

  return (
    <div className="container-fluid p-0">
      <section className="p-4 p-lg-5" id="privacy-policy">
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <h1 className="mb-5 display-3 fw-bold text-primary">Privacy Policy</h1>
          <p className="mb-5 lead"><strong>Last updated: {lastUpdated}</strong></p>

          {/* 1. Introduction */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>1. Introduction</h2>
            <p>
              {companyName} (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates the {websiteName} website (the &quot;Service&quot;). 
              This Privacy Policy explains how we collect, use, and protect your personal information when you use the Service. 
              By using {websiteName}, you agree to the practices described below.
            </p>
          </div>

          {/* 2. Information Collection and Use */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>2. Information We Collect</h2>

            <h3 className="mb-2 text-primary">Personal Data</h3>
            <p>
              We may collect personally identifiable information, including:
            </p>
            <ul>
              <li>Email address</li>
              <li>Usage data (e.g., IP address, browser type, time on site)</li>
            </ul>

            <h3 className="mb-2 mt-4 text-primary">Calendar Data</h3>
            <p>
              If you connect your Google Calendar to {websiteName}, we request permission to:
            </p>
            <ul>
              <li>Create and edit a dedicated calendar for your Bible study plan.</li>
              <li>Read events from your other calendars in order to intelligently schedule your study sessions without conflicts.</li>
            </ul>
            <p>
              <strong>Important:</strong> We only create/edit one dedicated calendar. Reading other calendars is solely used to prevent scheduling conflicts and personalize your plan. We do not make any changes to your existing calendars or events.
            </p>

            <h3 className="mb-2 mt-4 text-primary">AI Data Processing (OpenAI)</h3>
            <p>
              {websiteName} uses an AI assistant to generate a personalized Bible study plan based on your progress and preferences. 
              The AI receives:
            </p>
            <ul>
              <li>Existing events from your connected calendar (to avoid conflicts)</li>
              <li>Your study name, target end date, and scheduling preferences</li>
            </ul>
            <p>
              The AI generates a structured study schedule and returns it to the app. 
              We <strong>do not store this data outside of your session</strong> except for the study plan added to your dedicated calendar. 
              No other personal information is shared with OpenAI.
            </p>
          </div>

          {/* 3. Use of Data */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>3. How We Use Your Data</h2>
            <ul>
              <li>To create and maintain your personalized Bible study plan.</li>
              <li>To schedule study events without conflicting with your existing calendar events.</li>
              <li>To provide support and notify you about changes to the Service.</li>
              <li>To analyze anonymized usage data for improving {websiteName}.</li>
            </ul>
          </div>

          {/* 4. Cookies and Tracking */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>4. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies for website functionality and analytics. 
              We use Vercel Analytics to monitor website performance; this data is aggregated and anonymized. 
              We also use Stripe for secure payment processing; payment details are handled by Stripe and not stored by us.
            </p>
          </div>

          {/* 5. Sharing Your Data */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>5. Sharing Your Data</h2>
            <p>
              We do not share your personal data, calendar events, or study plan data with third parties except:
            </p>
            <ul>
              <li>With OpenAI, solely to generate your Bible study plan, as described above.</li>
              <li>With Stripe for payment processing (if applicable).</li>
              <li>As required by law or to protect our rights.</li>
            </ul>
          </div>

          {/* 6. Data Security */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>6. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your data. However, no system is completely secure; we cannot guarantee absolute security.
            </p>
          </div>

          {/* 7. Contact */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul>
              <li>Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
              <li>Contact page: <a href={contactPageUrl}>{contactPageUrl}</a></li>
            </ul>
          </div>

        </div>
      </section>
    </div>
  );
};

export default function PrivacyPage() {
  return <PrivacyPolicy {...defaultProps} />;
}
