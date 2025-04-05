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
 * Takes an exam object and returns with all expected form fields
 */
export const mapExamToFormData = (exam: any) => {
  // Return the mapped object with all the expected form fields
  // Using consistent field names without conversion between camelCase and snake_case
  return {
    title: exam.title || '',
    description: exam.description || '',
    type: exam.type,
    status: exam.status || 'active',
    courseId: exam.courseId,
    maxScore: exam.maxScore,
    passingScore: exam.passingScore,
    timeLimit: exam.timeLimit,
    sectionId: exam.sectionId,
    semesterId: exam.semesterId,
    gradeAThreshold: exam.gradeAThreshold || 90,
    gradeBThreshold: exam.gradeBThreshold || 80,
    gradeCThreshold: exam.gradeCThreshold || 70,
    gradeDThreshold: exam.gradeDThreshold || 60,
    availableFrom: exam.availableFrom,
    availableTo: exam.availableTo
  };
}

/**
 * Map form data for API usage without conversion
 * We're removing the camelCase to snake_case conversion to use consistent naming
 */
export const mapFormDataToExam = (formData: any) => {
  // Handle null/undefined values before sending
  const {
    sectionId = null, 
    semesterId = null,
    gradeAThreshold = 90,
    gradeBThreshold = 80,
    gradeCThreshold = 70,
    gradeDThreshold = 60,
    availableFrom = null,
    availableTo = null,
    ...restData
  } = formData;
  
  // Create a combined data object with all fields
  // No longer converting to snake_case to maintain consistency
  return {
    ...restData,
    sectionId,
    semesterId,
    gradeAThreshold,
    gradeBThreshold,
    gradeCThreshold,
    gradeDThreshold,
    availableFrom,
    availableTo
  };
}