"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface CourseCheckoutData {
  courseId: string;
  title: string;
  price: number;
  duration: string;
  skillLevel: string;
  instructorName?: string;
  venueName?: string;
  schedule?: string;
}

function CourseCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [courseData, setCourseData] = useState<CourseCheckoutData | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    experienceLevel: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Get course ID from URL params
  const courseId = searchParams.get("courseId");
  const title = searchParams.get("title");
  const priceParam = searchParams.get("price");

  // Fetch course details
  const { data: course } = api.trainingCourse.getById.useQuery(
    { id: courseId ?? "" },
    { enabled: !!courseId }
  );

  // Create enrollment mutation
  const createEnrollment = api.courseEnrollment.create.useMutation({
    onSuccess: (enrollment) => {
      toast.success("Enrollment submitted successfully!");
      router.push(`/courses/confirmation?enrollmentId=${enrollment.id}`);
    },
    onError: (error) => {
      toast.error("Failed to submit enrollment: " + error.message);
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    if (course) {
      setCourseData({
        courseId: course.id,
        title: course.title,
        price: course.price,
        duration: course.duration,
        skillLevel: course.skillLevel,
        instructorName: course.instructor?.name,
        venueName: course.venue?.name,
        schedule: course.scheduleDetails,
      });
    } else if (courseId && title && priceParam) {
      // Fallback to URL params if course fetch fails
      setCourseData({
        courseId,
        title: decodeURIComponent(title),
        price: parseFloat(priceParam),
        duration: "",
        skillLevel: "",
      });
    }
  }, [course, courseId, title, priceParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseData) {
      toast.error("Course information not found");
      return;
    }

    if (!agreed) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsProcessing(true);

    try {
      await createEnrollment.mutateAsync({
        courseId: courseData.courseId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        emergencyContactName: customerInfo.emergencyContact,
        emergencyContactPhone: customerInfo.emergencyPhone,
        medicalConditions: customerInfo.medicalConditions,
        experienceLevel: customerInfo.experienceLevel,
        paymentMethod,
        pricePaid: courseData.price,
        notes: `Enrolled via online form. Payment method: ${paymentMethod}`,
      });
    } catch (error) {
      console.error("Enrollment error:", error);
    }
  };

  if (!courseData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg">Loading course information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/courses" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Courses
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Course Enrollment</h1>
          <p className="mt-1 text-sm text-gray-600">
            Complete your enrollment for {courseData.title}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Course Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Course Summary</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">{courseData.title}</h3>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    {courseData.skillLevel && (
                      <div className="flex justify-between">
                        <span>Skill Level:</span>
                        <span className="font-medium">{courseData.skillLevel}</span>
                      </div>
                    )}
                    {courseData.duration && (
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{courseData.duration}</span>
                      </div>
                    )}
                    {courseData.instructorName && (
                      <div className="flex justify-between">
                        <span>Instructor:</span>
                        <span className="font-medium">{courseData.instructorName}</span>
                      </div>
                    )}
                    {courseData.venueName && (
                      <div className="flex justify-between">
                        <span>Venue:</span>
                        <span className="font-medium">{courseData.venueName}</span>
                      </div>
                    )}
                    {courseData.schedule && (
                      <div>
                        <span className="block font-medium">Schedule:</span>
                        <span className="text-gray-600">{courseData.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>฿{courseData.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Experience Level
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.experienceLevel}
                      onChange={(e) => setCustomerInfo({...customerInfo, experienceLevel: e.target.value})}
                    >
                      <option value="">Select your experience</option>
                      <option value="Complete Beginner">Complete Beginner</option>
                      <option value="Some Experience">Some Experience</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      rows={2}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-900">Emergency Contact</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.emergencyContact}
                      onChange={(e) => setCustomerInfo({...customerInfo, emergencyContact: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.emergencyPhone}
                      onChange={(e) => setCustomerInfo({...customerInfo, emergencyPhone: e.target.value})}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Medical Conditions or Injuries
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Please list any medical conditions, injuries, or physical limitations we should know about..."
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customerInfo.medicalConditions}
                      onChange={(e) => setCustomerInfo({...customerInfo, medicalConditions: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    {[
                      { value: "CREDIT_CARD", label: "Credit Card", desc: "Pay securely with credit card" },
                      { value: "BANK_TRANSFER", label: "Bank Transfer", desc: "Transfer to our bank account" },
                      { value: "CASH", label: "Cash", desc: "Pay in person at the venue" },
                      { value: "PAYPAL", label: "PayPal", desc: "Pay with your PayPal account" },
                    ].map((method) => (
                      <label key={method.value} className="flex cursor-pointer items-start space-x-3 rounded-lg border p-4 hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={paymentMethod === method.value}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{method.label}</div>
                          <div className="text-sm text-gray-500">{method.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-sm text-gray-600">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-800">
                        terms and conditions
                      </Link>
                      {" "}and{" "}
                      <Link href="/waiver" className="text-blue-600 hover:text-blue-800">
                        liability waiver
                      </Link>
                      . I understand that Muay Thai training involves physical contact and risk of injury.
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isProcessing || !agreed}
                    className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? "Processing..." : `Enroll Now - ฿${courseData.price.toLocaleString()}`}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Your enrollment will be reviewed and confirmed within 24 hours.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <CourseCheckoutContent />
    </Suspense>
  );
} 