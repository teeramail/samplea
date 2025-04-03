import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '~/trpc/server';
import type { Metadata, ResolvingMetadata } from 'next';

// Define a standard PageProps interface for dynamic route segments
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Include searchParams even if not used
}

// Generate dynamic metadata for SEO
export async function generateMetadata(props: PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;
  const course = await api.trainingCourse.getBySlug({ slug });

  if (!course) {
    // Return default metadata or handle as needed if course not found
    return {
      title: 'Course Not Found',
    };
  }

  // Determine image for metadata
  const imageUrl = course.imageUrls?.[course.primaryImageIndex ?? 0] ?? (await parent).openGraph?.images?.[0];

  return {
    title: `${course.title} | Muay Thai Course`, // Customize site name
    description: course.description ?? `Enroll in the ${course.title} Muay Thai training course.`,
    openGraph: {
      title: course.title,
      description: course.description ?? '',
      images: imageUrl ? [imageUrl] : [],
      type: 'article', // More specific than 'website' for a course/event
    },
    // Add structured data (JSON-LD) here for better SEO
    // See notes below
  };
}

export default async function CourseDetailPage(props: PageProps) {
  const params = await props.params;
  // Use the PageProps interface
  const course = await api.trainingCourse.getBySlug({ slug: params.slug });

  if (!course) {
    notFound(); // Triggers the not-found page
  }

  const primaryImageUrl = course.imageUrls?.[course.primaryImageIndex ?? 0] 
                          ?? '/placeholder-course.png'; // Use the same placeholder

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={primaryImageUrl}
            alt={course.title}
            fill
            priority // Prioritize loading the main image
            sizes="(max-width: 768px) 100vw, 100vw" // Adjust sizes as needed
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">{course.title}</h1>
          
          {/* Price and Enroll Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ${course.price.toFixed(2)}
              </p>
              <button 
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
                  // onClick={() => { /* Handle enrollment click */ }}
                  // Add Link to checkout page later: <Link href={`/checkout/course/${course.id}`}>Enroll Now</Link>
              >
                  Enroll Now
              </button>
          </div>

          {/* Course Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-gray-700 dark:text-gray-300">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Course Details</h2>
              {course.description && <p className="mb-4 whitespace-pre-wrap">{course.description}</p>} 
              {!course.description && <p className="mb-4 italic">No description available.</p>} 
            </div>
            
            <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-gray-800 dark:text-white">Information</h3>
                {course.skillLevel && <div><strong>Skill Level:</strong> {course.skillLevel}</div>}
                {course.duration && <div><strong>Duration:</strong> {course.duration}</div>}
                {course.scheduleDetails && <div><strong>Schedule:</strong> {course.scheduleDetails}</div>}
                {course.capacity && <div><strong>Capacity:</strong> {course.capacity} spots</div>}
                {course.region && (
                    <div>
                        <strong>Region:</strong> 
                        <Link href={`/regions/${course.region.slug}`} className="text-blue-600 hover:underline ml-1">{course.region.name}</Link>
                    </div>
                )}
                 {course.venue && (
                    <div>
                        <strong>Venue:</strong> 
                        {/* Assuming venue has a page later */} 
                        <span className="ml-1">{course.venue.name}</span> 
                        {/* <Link href={`/venues/${course.venue.slug}`} className="text-blue-600 hover:underline ml-1">{course.venue.name}</Link> */} 
                    </div>
                )}
            </div>
          </div>

          {/* Instructor Section */}
          {course.instructor && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Instructor</h2>
              <div className="flex items-center gap-4">
                {course.instructor.imageUrl && (
                  <div className="relative h-16 w-16 rounded-full overflow-hidden">
                    <Image 
                        src={course.instructor.imageUrl}
                        alt={course.instructor.name ?? 'Instructor'}
                        fill
                        sizes="64px"
                        style={{ objectFit: 'cover' }}
                     />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{course.instructor.name}</h3>
                  {/* Link to instructor page if available */} 
                  {/* {course.instructor.bio && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{course.instructor.bio}</p>} */} 
                </div>
              </div>
            </div>
          )}

          {/* Add JSON-LD Structured Data Here */} 
          {/* 
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "CourseInstance", // or EducationEvent
                name: course.title,
                description: course.description,
                image: primaryImageUrl,
                startDate: course.scheduleDetails, // Adjust if you have structured dates
                location: course.venue ? {
                    "@type": "Place",
                    name: course.venue.name,
                    address: course.venue.address // Assuming address is available
                } : undefined,
                organizer: course.instructor ? {
                    "@type": "Person",
                    name: course.instructor.name
                } : undefined,
                offers: {
                    "@type": "Offer",
                    price: course.price.toFixed(2),
                    priceCurrency: "USD", // Specify currency
                    availability: "https://schema.org/InStock", // Adjust based on capacity/status
                    url: `/courses/${course.slug}` // URL to this page
                }
                // Add more properties as relevant: courseMode, duration, etc.
              }),
            }}
          />
          */}
        </div>
      </article>
    </div>
  );
} 