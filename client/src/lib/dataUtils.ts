/**
 * Utility functions for data transformation between API and UI
 */

/**
 * Convert a string from camelCase to snake_case
 * Example: "courseId" -> "course_id"
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert a string from snake_case to camelCase
 * Example: "course_id" -> "courseId"
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all keys in an object from camelCase to snake_case
 * Example: { courseId: 1 } -> { course_id: 1 }
 */
export const convertKeysToSnakeCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = obj[key];
  });
  
  return result;
}

/**
 * Convert all keys in an object from snake_case to camelCase
 * Example: { course_id: 1 } -> { courseId: 1 }
 */
export const convertKeysToCamelCase = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    const camelKey = snakeToCamel(key);
    result[camelKey] = obj[key];
  });
  
  return result;
}

/**
 * Map an exam for form usage
 * Takes an exam object with snake_case keys and returns with camelCase keys for form fields
 */
export const mapExamToFormData = (exam: any) => {
  // Ensure we're working with the right field names from backend to frontend
  return {
    title: exam.title || '',
    description: exam.description || '',
    type: exam.type,
    status: exam.status || 'active',
    // Convert snake_case fields to camelCase for form usage
    gradingMode: exam.grading_mode || 'auto',
    courseId: exam.course_id,
    maxScore: exam.max_score,
    passingScore: exam.passing_score,
    timeLimit: exam.time_limit,
    sectionId: exam.section_id,
    semesterId: exam.semester_id,
    gradeAThreshold: exam.grade_a_threshold || 90,
    gradeBThreshold: exam.grade_b_threshold || 80,
    gradeCThreshold: exam.grade_c_threshold || 70,
    gradeDThreshold: exam.grade_d_threshold || 60,
    availableFrom: exam.available_from,
    availableTo: exam.available_to
  };
}

/**
 * Map form data for API usage with camelCase to snake_case conversion
 * We need this conversion because backend expects snake_case
 */
export const mapFormDataToExam = (formData: any) => {
  // Handle null/undefined values before sending
  const {
    sectionId = null, 
    semesterId = null,
    courseId, // Explicitly extract courseId
    maxScore, // Extract maxScore (previously totalPoints)
    passingScore, // Extract passingScore (previously passingPoints)
    timeLimit, // Extract timeLimit (previously duration)
    gradingMode = 'auto', // Extract gradingMode with default 'auto'
    gradeAThreshold = 90,
    gradeBThreshold = 80,
    gradeCThreshold = 70,
    gradeDThreshold = 60,
    availableFrom = null,
    availableTo = null,
    ...restData
  } = formData;
  
  // Create a combined data object with proper snake_case field names for backend
  return {
    ...restData,
    course_id: courseId, // Convert courseId to course_id
    section_id: sectionId,
    semester_id: semesterId,
    max_score: maxScore, // Convert maxScore to max_score
    passing_score: passingScore, // Convert passingScore to passing_score
    time_limit: timeLimit, // Convert timeLimit to time_limit
    grading_mode: gradingMode, // Convert gradingMode to grading_mode
    grade_a_threshold: gradeAThreshold,
    grade_b_threshold: gradeBThreshold,
    grade_c_threshold: gradeCThreshold,
    grade_d_threshold: gradeDThreshold,
    available_from: availableFrom,
    available_to: availableTo
  };
}

/**
 * Map question form data for API usage with proper field name conversion
 */
export const mapQuestionFormDataForApi = (questionData: any) => {
  const {
    correctAnswer, // Extract correctAnswer
    options, // Extract options array
    ...restData
  } = questionData;
  
  // Create a properly formatted question data object for the API
  return {
    ...restData,
    correct_answer: correctAnswer, // Convert correctAnswer to correct_answer
    options: options, // Keep options as is - will be automatically converted to jsonb by the API
    question_text: questionData.question, // Make sure we map question to question_text for DB
    question_type: questionData.type, // Make sure we map type to question_type for DB
    sort_order: questionData.order || 1 // Map order to sort_order for DB
  };
}