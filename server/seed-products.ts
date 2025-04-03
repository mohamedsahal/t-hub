// Sample product data seeder script
import { storage } from './storage';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

async function seedProducts() {
  console.log('Starting product seeder...');
  
  const productSamples = [
    {
      name: 'T-Hub Restaurant Management System',
      description: 'A complete solution for restaurant management, featuring order processing, inventory management, customer relationship management, and financial reporting.',
      type: 'restaurant' as const,
      price: 99.99,
      features: [
        'Real-time order tracking',
        'Inventory management with alerts',
        'Table reservation system',
        'Employee scheduling',
        'Customer loyalty program',
        'Sales analytics and reporting',
        'Kitchen display system',
        'Mobile app for waitstaff',
        'Menu management',
        'Digital receipts'
      ],
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
      demoUrl: 'https://restaurant-demo.thub.so',
      isActive: true
    },
    {
      name: 'T-Hub Hotel Management Suite',
      description: 'Comprehensive hotel management software designed for properties of all sizes, from boutique hotels to large resorts, with modules for reservations, housekeeping, front desk, and reporting.',
      type: 'hotel' as const,
      price: 129.99,
      features: [
        'Reservation and booking system',
        'Front desk operations',
        'Housekeeping management',
        'Room allocation and availability',
        'Guest check-in/check-out',
        'Integrated payment processing',
        'Maintenance tracking',
        'Reporting and analytics',
        'Mobile app for staff',
        'Guest communication tools'
      ],
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
      demoUrl: 'https://hotel-demo.thub.so',
      isActive: true
    },
    {
      name: 'T-Hub Hospital Information System',
      description: 'An integrated healthcare management system that streamlines hospital operations, patient care, and administrative processes with robust security and compliance features.',
      type: 'hospital' as const,
      price: 299.99,
      features: [
        'Electronic Medical Records (EMR)',
        'Patient registration and appointment scheduling',
        'Pharmacy management',
        'Laboratory information system',
        'Billing and insurance processing',
        'Inventory management for medical supplies',
        'Staff scheduling and management',
        'Telemedicine integration',
        'Compliance reporting (HIPAA)',
        'Analytics and business intelligence'
      ],
      imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop',
      demoUrl: 'https://hospital-demo.thub.so',
      isActive: true
    },
    {
      name: 'T-Hub Laundry Management System',
      description: 'A specialized solution for laundry businesses, featuring order tracking, customer management, inventory control, and delivery scheduling to optimize operations.',
      type: 'laundry' as const,
      price: 79.99,
      features: [
        'Customer order management',
        'Garment tracking with barcodes/QR codes',
        'Pricing and package management',
        'Inventory management for supplies',
        'Customer database with history',
        'Employee productivity tracking',
        'Delivery route optimization',
        'Mobile app for customers',
        'SMS/Email notifications',
        'Financial reporting'
      ],
      imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=2070&auto=format&fit=crop',
      demoUrl: 'https://laundry-demo.thub.so',
      isActive: true
    },
    {
      name: 'T-Hub School Management System',
      description: 'A comprehensive platform for educational institutions to manage students, teachers, courses, attendance, grading, and communication between all stakeholders.',
      type: 'school' as const,
      price: 149.99,
      features: [
        'Student information management',
        'Teacher and staff administration',
        'Course and curriculum management',
        'Attendance tracking',
        'Grade management and reporting',
        'Examination scheduling and results',
        'Library management',
        'Fee collection and management',
        'Parent-teacher communication portal',
        'Timetable scheduling'
      ],
      imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
      demoUrl: 'https://school-demo.thub.so',
      isActive: true
    }
  ];

  // Check if products already exist
  const existingProducts = await storage.getAllProducts();
  if (existingProducts.length > 0) {
    console.log(`${existingProducts.length} products already exist in the database. Skipping seeding.`);
    return;
  }

  // Add products to the database
  for (const productData of productSamples) {
    try {
      await storage.createProduct(productData);
      console.log(`Created product: ${productData.name}`);
    } catch (error) {
      console.error(`Error creating product ${productData.name}:`, error);
    }
  }

  console.log('Product seeding completed successfully');
}

// Run the seeder
seedProducts()
  .then(() => {
    console.log('Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });