import Link from "next/link";
import Image from "next/image";
import type { api } from "~/trpc/server";

// Define the expected shape of a course item based on the API response
// We get this from the 'list' procedure's return type including the 'with' clause
type CourseItem = Awaited<ReturnType<typeof api.trainingCourse.list>>['items'][number];

function CourseCard({ course }: { course: CourseItem }) {
  // Determine the primary image URL
  const primaryImageUrl = course.imageUrls?.[course.primaryImageIndex ?? 0] 
                          ?? '/placeholder-course.png'; // Provide a default placeholder

  return (
    <Link href={`/courses/${course.slug}`} className="block overflow-hidden rounded-lg shadow-lg transition-shadow duration-300 ease-in-out hover:shadow-xl">
      <div className="relative h-48 w-full">
        <Image
          src={primaryImageUrl}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          // Consider adding placeholder="blur" if using static imports or generated blurDataURL
        />
      </div>
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold leading-tight text-gray-900 dark:text-white">{course.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{course.duration}</p>
        {/* Optionally display instructor or region */}
        {course.instructor && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Instructor: {course.instructor.name}</p>
        )}
        {course.region && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Region: {course.region.name}</p>
        )}
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          ${course.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

export default CourseCard; 