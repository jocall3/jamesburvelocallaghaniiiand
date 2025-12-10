import React, { useState, useEffect, useMemo } from 'react';

// --- Interfaces ---
interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g., "15 min", "30 min"
  type: 'video' | 'article' | 'quiz' | 'project';
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  imageUrl?: string;
  estimatedTime?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string; // ISO date string
}

interface ModuleProgress {
  moduleId: string;
  lessonsProgress: LessonProgress[];
}

interface CourseProgress {
  courseId: string;
  userId: string;
  modulesProgress: ModuleProgress[];
}

// --- Mock Data (for demonstration) ---
const mockCourseData: Course = {
  id: 'course-101',
  title: 'Introduction to AI Programming',
  description: 'This course provides a comprehensive introduction to Artificial Intelligence programming, covering fundamental concepts, algorithms, and practical applications using modern tools and frameworks.',
  imageUrl: 'https://via.placeholder.com/800x400?text=AI+Programming+Course',
  estimatedTime: '10 hours',
  difficulty: 'Beginner',
  modules: [
    {
      id: 'module-1',
      title: 'Module 1: Foundations of AI',
      lessons: [
        { id: 'lesson-1-1', title: 'What is Artificial Intelligence?', duration: '20 min', type: 'video' },
        { id: 'lesson-1-2', title: 'History and Evolution of AI', duration: '15 min', type: 'article' },
        { id: 'lesson-1-3', title: 'AI Subfields and Applications', duration: '25 min', type: 'video' },
        { id: 'lesson-1-4', title: 'Quiz: AI Fundamentals', duration: '10 min', type: 'quiz' },
      ],
    },
    {
      id: 'module-2',
      title: 'Module 2: Python for AI',
      lessons: [
        { id: 'lesson-2-1', title: 'Python Basics Refresher', duration: '30 min', type: 'video' },
        { id: 'lesson-2-2', title: 'NumPy for Numerical Computing', duration: '45 min', type: 'video' },
        { id: 'lesson-2-3', title: 'Pandas for Data Manipulation', duration: '40 min', type: 'video' },
        { id: 'lesson-2-4', title: 'Exercise: Data Preprocessing', duration: '60 min', type: 'project' },
      ],
    },
    {
      id: 'module-3',
      title: 'Module 3: Machine Learning Basics',
      lessons: [
        { id: 'lesson-3-1', title: 'Introduction to Machine Learning', duration: '30 min', type: 'video' },
        { id: 'lesson-3-2', title: 'Supervised vs. Unsupervised Learning', duration: '20 min', type: 'article' },
        { id: 'lesson-3-3', title: 'Linear Regression Explained', duration: '45 min', type: 'video' },
        { id: 'lesson-3-4', title: 'Building Your First ML Model', duration: '60 min', type: 'project' },
      ],
    },
  ],
};

const mockCourseProgress: CourseProgress = {
  courseId: 'course-101',
  userId: 'user-123',
  modulesProgress: [
    {
      moduleId: 'module-1',
      lessonsProgress: [
        { lessonId: 'lesson-1-1', completed: true, completedAt: '2023-10-26T10:00:00Z' },
        { lessonId: 'lesson-1-2', completed: true, completedAt: '2023-10-26T10:30:00Z' },
        { lessonId: 'lesson-1-3', completed: false },
        { lessonId: 'lesson-1-4', completed: false },
      ],
    },
    {
      moduleId: 'module-2',
      lessonsProgress: [
        { lessonId: 'lesson-2-1', completed: true, completedAt: '2023-10-27T11:00:00Z' },
        { lessonId: 'lesson-2-2', completed: false },
        { lessonId: 'lesson-2-3', completed: false },
        { lessonId: 'lesson-2-4', completed: false },
      ],
    },
    {
      moduleId: 'module-3',
      lessonsProgress: [
        { lessonId: 'lesson-3-1', completed: false },
        { lessonId: 'lesson-3-2', completed: false },
        { lessonId: 'lesson-3-3', completed: false },
        { lessonId: 'lesson-3-4', completed: false },
      ],
    },
  ],
};

// --- Helper Functions ---
const getLessonIcon = (type: Lesson['type']) => {
  switch (type) {
    case 'video':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'article':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'quiz':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9.247a1 1 0 01.791-.403l3.197 1.192a1 1 0 01.622.848V16.5a1 1 0 01-1.5.866l-2.5-1.443z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'project':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// --- Component Props ---
interface CourseOverviewProps {
  courseId: string;
  userId: string;
}

const CourseOverview: React.FC<CourseOverviewProps> = ({ courseId, userId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        if (courseId === mockCourseData.id && userId === mockCourseProgress.userId) {
          setCourse(mockCourseData);
          setProgress(mockCourseProgress);
        } else {
          throw new Error('Course or user not found.');
        }
      } catch (err) {
        setError((err as Error).message || 'Failed to load course data.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, userId]);

  const { totalLessons, completedLessons, progressPercentage } = useMemo(() => {
    if (!course || !progress) {
      return { totalLessons: 0, completedLessons: 0, progressPercentage: 0 };
    }

    let total = 0;
    let completed = 0;

    course.modules.forEach(module => {
      total += module.lessons.length;
      const moduleProgress = progress.modulesProgress.find(mp => mp.moduleId === module.id);
      if (moduleProgress) {
        moduleProgress.lessonsProgress.forEach(lp => {
          if (lp.completed) {
            completed++;
          }
        });
      }
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalLessons: total, completedLessons: completed, progressPercentage: percentage };
  }, [course, progress]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading course overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg shadow-sm">
        <p className="font-semibold text-xl">Error loading course:</p>
        <p className="mt-2">{error}</p>
        <p className="mt-4 text-gray-700">Please try again later or contact support.</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center p-8 text-gray-600 bg-gray-50 rounded-lg shadow-sm">
        <p className="font-semibold text-xl">Course not found.</p>
        <p className="mt-2">The course you are looking for might not exist or is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-xl">
      {/* Course Header */}
      <div className="mb-8">
        {course.imageUrl && (
          <img src={course.imageUrl} alt={course.title} className="w-full h-64 object-cover rounded-lg mb-6 shadow-md" />
        )}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{course.title}</h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-4">{course.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
          {course.estimatedTime && (
            <span className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {course.estimatedTime}
            </span>
          )}
          {course.difficulty && (
            <span className="flex items-center bg-green-50 px-3 py-1 rounded-full text-green-700 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {course.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Progress</h2>
        <div className="flex items-center mb-3">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="ml-4 text-lg font-semibold text-gray-800">{progressPercentage}%</span>
        </div>
        <p className="text-gray-600">
          You have completed {completedLessons} out of {totalLessons} lessons. Keep up the great work!
        </p>
      </div>

      {/* Curriculum Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
        <div className="space-y-6">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-100 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
                <span className="text-sm text-gray-600">
                  {module.lessons.length} Lessons
                </span>
              </div>
              <ul className="divide-y divide-gray-200">
                {module.lessons.map((lesson, lessonIndex) => {
                  const moduleProgress = progress?.modulesProgress.find(mp => mp.moduleId === module.id);
                  const lessonProgress = moduleProgress?.lessonsProgress.find(lp => lp.lessonId === lesson.id);
                  const isCompleted = lessonProgress?.completed || false;

                  return (
                    <li
                      key={lesson.id}
                      className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${isCompleted ? 'bg-green-50' : ''}`}
                    >
                      <div className="flex items-center">
                        {isCompleted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <span className="text-gray-500 mr-3">{getLessonIcon(lesson.type)}</span>
                        )}
                        <span className={`text-lg ${isCompleted ? 'text-gray-600 line-through' : 'text-gray-800'}`}>
                          {lessonIndex + 1}. {lesson.title}
                        </span>
                      </div>
                      <span className={`text-sm ${isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                        {lesson.duration}
                        {isCompleted && <span className="ml-2 font-medium">Completed</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action (Example) */}
      <div className="text-center mt-10 p-6 bg-blue-50 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-blue-800 mb-3">Ready to continue?</h3>
        <p className="text-blue-700 mb-5">Click on any lesson above to start or resume your learning journey.</p>
        <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
          Continue Learning
        </button>
      </div>
    </div>
  );
};

export default CourseOverview;