// import { NextResponse } from "next/server"; // Unused
// import { redirect } from "next/navigation"; // Unused

import { db } from "~/server/db";
import { bookings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Type-safe function to convert FormData values to strings
const safeToString = (value: FormDataEntryValue | null): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof File) {
    return value.name;
  }
  // For other types, safely convert to string
  try {
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  } catch (_) {
    return undefined;
  }
};

// ChillPay Customer Redirect Endpoint
// This endpoint handles when customers are redirected from ChillPay back to our site
export async function GET(request: Request) {
  // Get URL parameters from ChillPay redirect
  const url = new URL(request.url);
  const params = url.searchParams;

  // Extract payment result parameters
  const status = params.get("Status"); // 0 for success, non-zero for failure
  const code = params.get("Code");
  const message = params.get("Message");
  const transactionId = params.get("TransactionId");
  const amount = params.get("Amount");
  const orderNo = params.get("OrderNo"); // This is our bookingId
  const customerId = params.get("CustomerId");
  const bookingId = params.get("bookingId") ?? orderNo;

  console.log("ChillPay Payment Redirect:", {
    status,
    code,
    message,
    transactionId,
    amount,
    orderNo,
    customerId,
    bookingId,
  });

  // Validate the payment was successful
  const isSuccess = status === "0" && code === "200";

  try {
    // Note: We update the status here, but the webhook should be considered authoritative
    // This is just for user experience so they don't have to wait for the webhook
    if (bookingId) {
      await db
        .update(bookings)
        .set({
          paymentStatus: isSuccess ? "COMPLETED" : "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      console.log(
        `[Redirect] Updated booking ${bookingId} status to ${isSuccess ? "COMPLETED" : "FAILED"}`,
      );
    }

    // Check if this is a callback from an external system integration
    const externalReturnUrl = params.get("externalReturnUrl");

    let redirectUrl;

    if (externalReturnUrl) {
      // If we have an external return URL, redirect back to the external system
      // with the payment result parameters
      const externalUrl = new URL(externalReturnUrl);

      // Add payment result parameters to the external URL
      externalUrl.searchParams.set("status", isSuccess ? "success" : "failed");
      externalUrl.searchParams.set("bookingId", bookingId ?? "");
      externalUrl.searchParams.set("transactionId", transactionId ?? "");
      externalUrl.searchParams.set("amount", amount ?? "");
      if (!isSuccess && message) {
        externalUrl.searchParams.set("message", message);
      }

      redirectUrl = externalUrl.toString();
      console.log(`[Redirect] Redirecting to external system: ${redirectUrl}`);
    } else {
      // Normal flow - redirect to our dedicated ChillPay callback page
      const redirectBase = `${url.origin}/checkout/chillpay-callback`;
      // Pass all the original parameters to our dedicated page
      redirectUrl = `${redirectBase}?Status=${status}&Code=${code}&Message=${encodeURIComponent(message ?? "")}&TransactionId=${transactionId ?? ""}&Amount=${amount ?? ""}&OrderNo=${orderNo ?? ""}&bookingId=${bookingId ?? ""}`;
    }

    // Return a redirect response
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error("[Redirect] Error processing ChillPay redirect:", error);

    // Check if this is a callback from an external system integration
    const externalReturnUrl = params.get("externalReturnUrl");

    if (externalReturnUrl) {
      // If we have an external return URL, redirect back to the external system with error status
      const externalUrl = new URL(externalReturnUrl);
      externalUrl.searchParams.set("status", "error");
      externalUrl.searchParams.set("message", "Internal server error");
      if (bookingId) {
        externalUrl.searchParams.set("bookingId", bookingId);
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: externalUrl.toString(),
        },
      });
    } else {
      // Normal flow - redirect to our dedicated page with error status
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${url.origin}/checkout/chillpay-callback?Status=error&Message=Internal+server+error&bookingId=${bookingId}`,
        },
      });
    }
  }
}

// For backward compatibility: handle simple status notifications
// This should not be used for background notifications; use webhook endpoint instead
export async function POST(request: Request) {
  console.warn(
    "⚠️ Received POST to /callback endpoint - should use /webhook endpoint instead",
  );

  try {
    // Parse the POST data
    const formData = await request.formData();
    console.log(
      "Received POST to callback endpoint:",
      Object.fromEntries(formData.entries()),
    );

    // Extract status and orderNo with safe type handling
    const status = safeToString(formData.get("status"));
    const orderNo = safeToString(formData.get("orderNo"));

    if (!orderNo) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing orderNo parameter",
        },
        { status: 400 },
      );
    }

    if (status === "cancel") {
      // If customer cancelled, update booking status
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.paymentOrderNo, orderNo),
      });

      if (booking) {
        await db
          .update(bookings)
          .set({
            paymentStatus: "CANCELLED",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));

        console.log(
          `[Callback] Updated booking ${booking.id} status to CANCELLED`,
        );
      }
    } else if (status === "complete" || formData.get("respCode") === "0") {
      // Handle successful payment
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.paymentOrderNo, orderNo),
      });

      if (booking) {
        const transactionId = safeToString(formData.get("transNo")) || null;

        await db
          .update(bookings)
          .set({
            paymentStatus: "COMPLETED",
            paymentTransactionId: transactionId,
            paymentMethod: "credit-card",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));

        console.log(
          `[Callback] Updated booking ${booking.id} status to COMPLETED${transactionId ? ` with transaction ID: ${transactionId}` : ""}`,
        );
      }
    }

    // Redirect to the customer-facing page instead of returning JSON
    const url = new URL(request.url);
    const redirectBase = `${url.origin}/checkout/chillpay-callback`;

    // Create redirect URL with appropriate parameters
    let redirectUrl = "";
    let bookingId = "";

    // Find the booking to get the bookingId
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.paymentOrderNo, orderNo),
    });

    if (booking) {
      bookingId = booking.id;
    }

    if (status === "complete" || formData.get("respCode") === "0") {
      // Successful payment
      redirectUrl = `${redirectBase}?Status=0&Code=200&OrderNo=${orderNo}&bookingId=${bookingId}&TransactionId=${safeToString(formData.get("transNo")) || ""}`;
    } else if (status === "cancel") {
      // Cancelled payment
      redirectUrl = `${redirectBase}?Status=cancel&Message=Payment+cancelled&OrderNo=${orderNo}&bookingId=${bookingId}`;
    } else {
      // Failed payment
      redirectUrl = `${redirectBase}?Status=error&Message=Payment+failed&OrderNo=${orderNo}&bookingId=${bookingId}`;
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
      },
    });
  } catch (error) {
    console.error("[Callback] Error handling fallback notification:", error);
    // Even on error, redirect to the customer-facing page with error status
    const url = new URL(request.url);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/checkout/chillpay-callback?Status=error&Message=Internal+server+error`,
      },
    });
  }
}
