export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">Terms and Conditions</h1>

        <div className="prose max-w-none">
          <p className="mb-4">
            Welcome to ThaiBoxingHub. By accessing and using our website and
            services, you agree to be bound by these Terms and Conditions.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing or using our website, booking events, or purchasing
            tickets, you agree to be bound by these Terms and Conditions and our
            Privacy Policy. If you do not agree with any part of these terms,
            please do not use our services.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">
            2. Booking and Payment
          </h2>
          <p className="mb-4">
            All bookings are subject to availability. Payment is required at the
            time of booking. We accept various payment methods including credit
            cards and PayPal. All prices are in Thai Baht unless otherwise
            stated.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">
            3. Cancellation Policy
          </h2>
          <p className="mb-2">
            <strong>Standard Events:</strong> Cancellations must meet both of
            these conditions for a full refund:
          </p>
          <ul className="mb-2 list-disc pl-6">
            <li>Made at least 72 hours before the event start time</li>
            <li>Submitted before 8:00 PM on the same date of booking</li>
          </ul>
          <p className="mb-4">
            Cancellations made after 9:00 PM on the booking date will incur a
            10% processing fee (to cover credit card transaction charges).
            Cancellations made less than 72 hours before the event are not
            eligible for a refund under any circumstances.
          </p>
          <p className="mb-4">
            <strong>Muay Thai Learning Courses:</strong> All Muay Thai learning
            course bookings are final and non-refundable under any
            circumstances. No refunds will be issued regardless of cancellation
            timing.
          </p>
          <p className="mb-4">
            In case of event cancellation by the organizer, a full refund will
            be provided for standard events only.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">4. User Conduct</h2>
          <p className="mb-4">
            Users agree not to use the service for any illegal purposes or to
            conduct activities that may damage, disable, or impair the service.
            Users are responsible for maintaining the confidentiality of their
            account information.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">
            5. Limitation of Liability
          </h2>
          <p className="mb-4">
            ThaiBoxingHub shall not be liable for any direct, indirect,
            incidental, special, or consequential damages resulting from the use
            or inability to use our services or participation in events.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold">
            6. Changes to Terms
          </h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. Changes will
            be effective immediately upon posting on the website. Your continued
            use of the service after any changes indicates your acceptance of
            the modified terms.
          </p>

          <p className="mt-8 text-sm text-gray-600">
            Last updated: April 5, 2024
          </p>
        </div>
      </div>
    </main>
  );
}
