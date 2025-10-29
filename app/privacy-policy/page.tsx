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
 * Default Privacy Policy Component using Bootstrap 5 classes
 * styled to resemble the startbootstrap-personal template structure.
 */
const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  companyName,
  websiteName,
  lastUpdated,
  contactEmail,
  contactPageUrl,
}) => {

  // --- Utility Styles (Mimicking startbootstrap-personal CSS) ---
  // If you have imported your theme's custom CSS, you can replace these inline styles
  // with your theme's class names (e.g., 'text-primary' or 'subheading').
  const subheadingStyle: React.CSSProperties = {
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: "'Saira Extra Condensed', sans-serif",
    fontSize: '1.5rem',
  };

  return (
    // The p-0 and container-fluid are standard Next.js page wrappers
    <div className="container-fluid p-0">
      <section className="p-4 p-lg-5" id="privacy-policy">
        <div className="container" style={{ maxWidth: '900px' }}>
          
          <h1 className="mb-5 display-3 fw-bold text-primary">
            Privacy Policy
          </h1>
          <p className="mb-5 lead">
            **Last updated: {lastUpdated}**
          </p>

          {/* --- Section 1: Introduction --- */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>1. Introduction</h2>
            <p>
              {companyName} ("us", "we", or "our") operates the {websiteName} website (the "Service").
              This page informs you of our policies regarding the collection, use, and disclosure of Personal Data when you use our Service. By using the Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </div>

          {/* --- Section 2: Information Collection and Use --- */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>2. Information Collection and Use</h2>
            <p>
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            <h3 className="mb-2 text-primary">Personal Data</h3>
            <p>
              While using our Service, we may ask you to provide us with certain personally identifiable information ("Personal Data"), including:
            </p>
            <ul>
              <li>Email address</li>
              <li>Usage Data (See below)</li>
            </ul>

            <h3 className="mb-2 mt-4 text-primary">Usage Data</h3>
            <p>
              We may also collect information that your browser sends whenever you visit our Service, such as your computer's Internet Protocol address (e.g., IP address), browser type, time spent on pages, and other diagnostic data.
            </p>
          </div>

          {/* --- Section 3: Use of Data --- */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>3. Use of Data</h2>
            <p>
              {companyName} uses the collected data for various purposes:
            </p>
            <ul>
              <li>To provide and maintain the Service.</li>
              <li>To notify you about changes to our Service.</li>
              <li>To provide customer care and support.</li>
              <li>To monitor the usage and improve the Service.</li>
            </ul>
          </div>
          
          {/* --- Section 4: Cookies --- */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>4. Tracking & Cookies Data</h2>
            <p>
              We use **cookies** and similar tracking technologies to track the activity on our Service. Cookies are small data files stored on your device.
              You can instruct your browser to refuse all cookies. If you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
            <p>
              We use Vercel Analytics to monitor website performance and traffic. Vercel Analytics collects non-personal, aggregated data such as page views, load times, and referrer URLs to help us understand how users engage with our site and to improve reliability and speed.
            </p>
            <p>
              Vercel Analytics does not use cookies, store personally identifiable information, or track users across sites. All data collected is anonymized and processed in accordance with <a href="https://vercel.com/legal/privacy-policy" target="_blank">Vercel's Privacy Policy</a>.
            </p>
            <p>
              We use Stripe, a third-party payment processor, to handle all transactions securely. When you make a purchase or payment through our website, your payment information is processed directly by Stripe and is subject to <a href="https://stripe.com/privacy" target="_blank">Stripe's Privacy Policy</a>.
            </p><p>
              We do not store or have access to your full payment details, such as your credit card number or bank account information. Stripe may collect and process information such as your name, email address, billing address, and payment method to complete the transaction and prevent fraud.
            </p><p>
              Stripe uses industry-standard encryption and security practices to protect your payment information. Any data shared with Stripe is handled in compliance with applicable laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </p><p>
              By making a payment through our site, you agree to the processing of your information by Stripe in accordance with their terms and privacy practices.
            </p>
          </div>

          {/* --- Section 5: Contact Us --- */}
          <div className="mb-5">
            <h2 className="mb-3" style={subheadingStyle}>5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul>
              <li>By email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
              <li>By visiting our contact page: <a href={contactPageUrl}>{contactPageUrl}</a></li>
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