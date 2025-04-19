import { Suspense } from "react";
import { api } from "~/trpc/server";
import CourseCard from "~/app/_components/CourseCard";
// import { Metadata } from 'next'; // Uncomment if setting metadata

// Optional: Add metadata for SEO
// export const metadata: Metadata = {
//   title: 'Muay Thai Training Courses | [Your Site Name]',
//   description: 'Browse and enroll in Muay Thai training courses for all skill levels.',
// };

async function CourseList() {
  // Fetch initial batch of courses
  // We'll add infinite loading/pagination later if needed
  const initialCourses = await api.trainingCourse.list({ limit: 20 });

  if (!initialCourses || initialCourses.items.length === 0) {
    return (
      <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
        No courses available at the moment. Please check back later.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {initialCourses.items.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
      {/* Placeholder for loading more button/indicator */}
      {initialCourses.nextCursor && (
        <div className="col-span-full mt-6 text-center">
          {/* Button to load more will go here */}
          {/* <LoadMoreCourses initialCursor={initialCourses.nextCursor} /> */}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
        Muay Thai Training Courses
      </h1>
      {/* Add filtering options here later if needed */}
      {/* <CourseFilters /> */}

      <Suspense
        fallback={<div className="p-8 text-center">Loading courses...</div>}
      >
        <CourseList />
      </Suspense>
    </div>
  );
}
