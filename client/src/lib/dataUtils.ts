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
 * Map an exam from snake_case to camelCase for form usage
 * Takes an exam object with snake_case keys and returns an object with camelCase keys
 */
export const mapExamToFormData = (exam: any) => {
  // Convert the exam object to camelCase
  const camelCaseExam = convertKeysToCamelCase(exam);
  
  // Return the mapped object with all the expected form fields
  return {
    title: exam.title || '',
    description: exam.description || '',
    type: exam.type,
    status: exam.status || 'active',
    maxScore: camelCaseExam.maxScore,
    passingScore: camelCaseExam.passingScore,
    timeLimit: camelCaseExam.timeLimit,
    courseId: camelCaseExam.courseId,
    sectionId: camelCaseExam.sectionId,
    semesterId: camelCaseExam.semesterId,
    gradeAThreshold: camelCaseExam.gradeAThreshold || 90,
    gradeBThreshold: camelCaseExam.gradeBThreshold || 80,
    gradeCThreshold: camelCaseExam.gradeCThreshold || 70,
    gradeDThreshold: camelCaseExam.gradeDThreshold || 60,
    availableFrom: camelCaseExam.availableFrom,
    availableTo: camelCaseExam.availableTo
  };
}

/**
 * Map form data to snake_case for API usage
 * Takes form data with camelCase keys and returns an object with snake_case keys
 */
export const mapFormDataToExam = (formData: any) => {
  // Handle null/undefined values before conversion
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
  const combinedData = {
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
  
  // Convert to snake_case
  return convertKeysToSnakeCase(combinedData);
}