"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

// Define expected API response types
interface ChillPaySuccessResponse {
  paymentUrl: string;
}

interface ChillPayErrorResponse {
  error: string;
  details?: string;
  code?: number;
  status?: number;
}

type ChillPayApiResponse = ChillPaySuccessResponse | ChillPayErrorResponse;

export default function CreditCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    code?: number;
    status?: number;
  } | null>(null);
  const [orderNo, setOrderNo] = useState<string>("");
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const bookingId = searchParams.get("bookingId");
  const amount = Number(searchParams.get("amount") ?? "0");
  const email = searchParams.get("email") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const customerName = searchParams.get("customerName") ?? "";
  const eventTitle = searchParams.get("eventTitle") ?? "";

  useEffect(() => {
    if (!bookingId || !amount || !email || !customerName) {
      setError("Missing booking information. Please return to checkout.");
      setIsLoading(false);
      return;
    }

    // Generate a unique order ID using the booking ID and timestamp
    const alphaNumericId = bookingId
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6);
    const timestamp = Date.now().toString().slice(-10);
    const orderId = `CP${alphaNumericId}${timestamp}`;
    setOrderNo(orderId);

    // Initiate ChillPay payment process
    console.log(
      `Initiating ChillPay payment process for booking ${bookingId}:`,
      {
        bookingId,
        amount,
        email,
        phone,
        customerName,
        eventTitle,
      },
    );

    const initiatePayment = async () => {
      try {
        // First ensure customer information is saved and then process payment
        const response = await fetch("/api/checkout/chillpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            amount,
            customerName,
            email,
            phone,
            eventTitle,
          }),
        });

        // Get the raw response text for better error handling
        const responseText = await response.text();
        let data: ChillPayApiResponse;

        try {
          // Try to parse JSON response
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          // Show part of the raw response for debugging
          const responsePreview =
            responseText.length > 100
              ? responseText.substring(0, 100) + "..."
              : responseText;
          throw new Error(`Invalid response from server: ${responsePreview}`);
        }

        if (!response.ok) {
          // Check if there's an error object
          if ("error" in data) {
            const errorResponse = data;

            // Set error details if available
            setErrorDetails({
              code: errorResponse.code,
              status: errorResponse.status,
            });

            // Format a detailed error message
            let detailedError = errorResponse.error;
            if (errorResponse.details) {
              detailedError += `: ${errorResponse.details}`;
            }

            throw new Error(detailedError);
          } else {
            throw new Error(
              `Payment initiation failed with status ${response.status}`,
            );
          }
        }

        // If we got here, we have a success response with a payment URL
        if ("paymentUrl" in data) {
          const paymentUrl = data.paymentUrl;
          console.log("Redirecting to ChillPay payment URL:", paymentUrl);
          window.location.href = paymentUrl;
        } else {
          throw new Error("Payment response missing payment URL");
        }
      } catch (err) {
        console.error("Payment initiation error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to initiate payment",
        );
        setIsLoading(false);
      }
    };

    void initiatePayment();
  }, [bookingId, amount, email, phone, customerName, eventTitle]);

  // Initialize the ChillPay widget when the script loads
  const initializeWidget = () => {
    if (
      typeof window !== "undefined" &&
      window.modernpay &&
      widgetContainerRef.current
    ) {
      // The widget is loaded through a global modernpay object
      console.log("Initializing ChillPay widget");
      try {
        // Force initial render of the widget
        window.modernpay.initWidget();
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing widget:", err);
        setError(
          "Failed to initialize payment widget. Please try again later.",
        );
        setIsLoading(false);
      }
    }
  };

  // Script load handler
  const handleScriptLoad = () => {
    console.log("ChillPay widget script loaded");
    // Add a slight delay to ensure script is fully initialized
    setTimeout(() => {
      initializeWidget();
    }, 500);
  };

  // Script error handler
  const handleScriptError = () => {
    setError(
      "Failed to load payment widget. Please try again or contact support.",
    );
    setIsLoading(false);
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        {isLoading && (
          <>
            <h1 className="mb-4 text-xl font-semibold">
              Preparing Payment Form...
            </h1>
            <p className="text-gray-600">
              Please wait while we set up the payment gateway for{" "}
              {eventTitle ?? "your booking"}.
            </p>
            <div className="mt-6 flex items-center justify-center">
              <svg
                className="h-8 w-8 animate-spin text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </>
        )}

        {!isLoading && !error && (
          <>
            <h1 className="mb-4 text-xl font-semibold">
              Complete Your Payment
            </h1>
            <p className="mb-6 text-gray-600">
              Please complete the payment form below to finalize your booking
              for {eventTitle ?? "your event"}.
            </p>

            <form
              id="payment-form"
              action="https://cdn.chillpay.co/Payment/"
              method="post"
              role="form"
              className="form-horizontal"
            >
              <div
                ref={widgetContainerRef}
                id="modernpay-widget-container"
                data-merchantid="M033598"
                data-amount={amount * 100}
                data-orderno={orderNo}
                data-customerid={bookingId}
                data-clientip="127.0.0.1"
                data-routeno="1"
                data-currency="764"
                data-description={eventTitle ?? "Booking payment"}
                data-apikey="7ynsXqBl3e0vFPfI1fivU9VSAZ8UZTQmta7vz4b6heptCXrrEja8ub1Z8YW6VnDX"
              ></div>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              You will be redirected to the secure ChillPay payment gateway.
            </div>
          </>
        )}

        {error && (
          <>
            <h1 className="mb-4 text-xl font-semibold text-red-600">
              Payment Error
            </h1>
            <p className="mb-4 text-gray-600">{error}</p>

            {errorDetails && (
              <div className="mb-4 rounded-md bg-gray-100 p-4 text-left">
                <h2 className="font-medium text-gray-800">
                  Technical Details:
                </h2>
                {errorDetails.status && (
                  <p className="text-sm">Status: {errorDetails.status}</p>
                )}
                {errorDetails.code && (
                  <p className="text-sm">Error Code: {errorDetails.code}</p>
                )}
                {errorDetails.code === 1005 && (
                  <p className="mt-2 text-sm">
                    Note: Error code 1005 &quot;Invalid Route No&quot; often
                    indicates an issue with the merchant configuration for this
                    payment method.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => router.back()} // Go back to previous page (likely checkout)
              className="w-full rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Return to Checkout
            </button>
          </>
        )}
      </div>

      {/* Add a window type definition for TypeScript */}
      {!error && (
        <Script
          src="https://cdn.chillpay.co/js/widgets.js?v=1.00"
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
          onError={handleScriptError}
        />
      )}
    </main>
  );
}

// Add TypeScript declaration for the window object with modernpay property
declare global {
  interface Window {
    modernpay: {
      initWidget: () => void;
    };
  }
}
