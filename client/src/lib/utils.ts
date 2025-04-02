import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Generate course type label
export function getCourseTypeLabel(type: string): string {
  const types: { [key: string]: string } = {
    multimedia: 'Multimedia',
    accounting: 'Accounting',
    marketing: 'Digital Marketing',
    development: 'Web Development',
    diploma: 'Diploma Program'
  };
  
  return types[type] || type;
}

// Get course type color
export function getCourseTypeColor(type: string): string {
  const colors: { [key: string]: string } = {
    multimedia: 'bg-primary bg-opacity-10 text-primary',
    accounting: 'bg-green-100 text-green-800',
    marketing: 'bg-blue-100 text-blue-800',
    development: 'bg-purple-100 text-purple-800',
    diploma: 'bg-[#d0f0d9] text-[#2a7d4b]'
  };
  
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// Format duration
export function formatDuration(weeks: number): string {
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
}

// Calculate installment amounts
export function calculateInstallments(totalAmount: number, months: number): number[] {
  const installmentAmount = totalAmount / months;
  const installments = [];
  
  for (let i = 0; i < months; i++) {
    installments.push(Number(installmentAmount.toFixed(2)));
  }
  
  // Adjust the last installment to account for rounding errors
  const sum = installments.reduce((a, b) => a + b, 0);
  const difference = totalAmount - sum;
  installments[installments.length - 1] += Number(difference.toFixed(2));
  
  return installments;
}

// Generate certificate ID
export function generateCertificateId(): string {
  const prefix = 'THB';
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  
  return `${prefix}-${year}-${random}`;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
