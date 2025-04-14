export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4">
            At ThaiBoxingHub, we are committed to protecting your privacy and ensuring the security of your personal information.
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect the following types of information:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Personal information (name, email address, phone number) when you create an account or make a booking</li>
            <li className="mb-2">Payment information when you purchase tickets (processed securely through our payment providers)</li>
            <li className="mb-2">Usage data and cookies to improve our website functionality and user experience</li>
            <li className="mb-2">Information you provide when contacting our support team</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use your information for the following purposes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Processing ticket purchases and bookings</li>
            <li className="mb-2">Sending booking confirmations and e-tickets</li>
            <li className="mb-2">Providing customer support</li>
            <li className="mb-2">Sending event updates and important notifications</li>
            <li className="mb-2">Improving our website and services</li>
            <li className="mb-2">Marketing communications (with your consent)</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. Your payment information is processed through secure payment gateways
            that comply with industry standards for data protection.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing</h2>
          <p className="mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Payment processors to complete transactions</li>
            <li className="mb-2">Event organizers for event management purposes</li>
            <li className="mb-2">Service providers who assist in operating our website and business</li>
            <li className="mb-2">Legal authorities when required by law</li>
          </ul>
          <p className="mb-4">
            We do not sell or rent your personal information to third parties for marketing purposes.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights</h2>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">Access the personal information we hold about you</li>
            <li className="mb-2">Request correction of inaccurate information</li>
            <li className="mb-2">Request deletion of your information (subject to legal requirements)</li>
            <li className="mb-2">Opt out of marketing communications</li>
            <li className="mb-2">Lodge a complaint with a supervisory authority</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies</h2>
          <p className="mb-4">
            Our website uses cookies to enhance your browsing experience. You can adjust your browser settings
            to refuse cookies, but this may limit some functionality of our website.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for individuals under the age of 16. We do not knowingly collect
            personal information from children. If you believe we have collected information from a child,
            please contact us immediately.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting
            the new policy on this page and updating the "Last updated" date. We encourage you to review this
            Privacy Policy periodically.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
            <br />
            <a href="mailto:privacy@thaiboxinghub.com" className="text-red-600 hover:underline">
              privacy@thaiboxinghub.com
            </a>
          </p>
          
          <p className="mt-8 text-sm text-gray-600">
            Last updated: April 14, 2025
          </p>
        </div>
      </div>
    </main>
  );
}
