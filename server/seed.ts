import { db } from './db';
import { 
  users, courses, 
  userRoleEnum, courseStatusEnum, courseTypeEnum
} from '@shared/schema';

async function seedDatabase() {
  console.log('Seeding database...');
  
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log('Database already has data. Skipping seeding.');
      return;
    }

    // Insert admin user
    const [adminUser] = await db.insert(users).values({
      name: "Admin User",
      email: "admin@t-hub.so",
      password: "admin123",
      role: "admin",
      phone: "+2525251111",
      createdAt: new Date()
    }).returning();
    
    console.log('Admin user created:', adminUser.email);

    // Insert teacher user
    const [teacherUser] = await db.insert(users).values({
      name: "Teacher User",
      email: "teacher@t-hub.so",
      password: "teacher123",
      role: "teacher",
      phone: "+2525251112",
      createdAt: new Date()
    }).returning();
    
    console.log('Teacher user created:', teacherUser.email);

    // Insert student user
    const [studentUser] = await db.insert(users).values({
      name: "Student User",
      email: "student@t-hub.so",
      password: "student123",
      role: "student",
      phone: "+2525251113",
      createdAt: new Date()
    }).returning();
    
    console.log('Student user created:', studentUser.email);

    // Insert courses
    await db.insert(courses).values([
      {
        title: "Photoshop for Graphic Designers",
        description: "Learn professional graphic design skills with Adobe Photoshop. Master selection tools, layer management, filters, and design principles.",
        type: "short",
        duration: 8,
        price: 120,
        status: "published",
        imageUrl: "https://images.unsplash.com/photo-1587440871875-191322ee64b0",
        teacherId: teacherUser.id,
        createdAt: new Date()
      },
      {
        title: "QuickBooks Accounting",
        description: "Master QuickBooks for small business accounting. Set up company files, manage customers and vendors, reconcile accounts, and generate reports.",
        type: "specialist",
        duration: 6,
        price: 90,
        status: "published",
        imageUrl: "https://images.unsplash.com/photo-1566837945700-30057527ade0",
        teacherId: teacherUser.id,
        createdAt: new Date()
      },
      {
        title: "Full Stack Web Development",
        description: "Comprehensive 24-week bootcamp covering MERN stack development with AI integration. Project-based learning with real-world applications.",
        type: "bootcamp",
        duration: 24,
        price: 1200,
        status: "published",
        imageUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4",
        teacherId: teacherUser.id,
        createdAt: new Date()
      }
    ]);
    
    console.log('Sample courses created');
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('Seeding process finished');
  process.exit(0);
}).catch(error => {
  console.error('Seeding process failed:', error);
  process.exit(1);
});