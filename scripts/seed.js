require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conference-booking';

// Sample data
const locations = [
  {
    name: 'London Office',
    address: '123 Business Street',
    city: 'London',
    country: 'UK',
    description: 'Main office in Central London'
  },
  {
    name: 'New York Office',
    address: '456 Manhattan Avenue',
    city: 'New York',
    country: 'USA',
    description: 'USA headquarters in Manhattan'
  },
  {
    name: 'Tokyo Office',
    address: '789 Shibuya',
    city: 'Tokyo',
    country: 'Japan',
    description: 'Asia Pacific headquarters'
  },
  {
    name: 'Berlin Office',
    address: '321 Tech Boulevard',
    city: 'Berlin',
    country: 'Germany',
    description: 'European tech hub'
  },
  {
    name: 'Sydney Office',
    address: '555 Harbor View',
    city: 'Sydney',
    country: 'Australia',
    description: 'Oceania regional office'
  }
];

// Rooms will be created per location (3 rooms each)
const getRoomsForLocation = (locationId, locationName) => [
  {
    name: `Conference Room A - ${locationName}`,
    locationId,
    capacity: 20,
    basePrice: 250,
    amenities: ['Projector', 'Whiteboard', 'Video Conference', 'WiFi'],
    description: 'Large conference room with modern amenities',
    floor: 3
  },
  {
    name: `Meeting Room B - ${locationName}`,
    locationId,
    capacity: 10,
    basePrice: 150,
    amenities: ['TV Screen', 'Whiteboard', 'WiFi'],
    description: 'Medium meeting room for team discussions',
    floor: 2
  },
  {
    name: `Executive Boardroom - ${locationName}`,
    locationId,
    capacity: 30,
    basePrice: 500,
    amenities: ['4K Display', 'Video Conference', 'Catering Service', 'WiFi', 'Sound System'],
    description: 'Premium boardroom for executive meetings',
    floor: 5
  }
];

// Sample users
const users = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Doe',
    role: 'user'
  }
];

// Define schemas directly in seed script
const locationSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  country: String,
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const roomSchema = new mongoose.Schema({
  name: String,
  locationId: mongoose.Schema.Types.ObjectId,
  capacity: Number,
  basePrice: Number,
  amenities: [String],
  description: String,
  floor: Number,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: { type: String, default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Models
const Location = mongoose.model('Location', locationSchema);
const Room = mongoose.model('Room', roomSchema);
const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Location.deleteMany({});
    await Room.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create locations
    console.log('📍 Creating locations...');
    const createdLocations = await Location.insertMany(locations);
    console.log(`✅ Created ${createdLocations.length} locations:`);
    createdLocations.forEach(loc => {
      console.log(`   - ${loc.name} (${loc.city}, ${loc.country})`);
    });
    console.log('');

    // Create rooms for each location
    console.log('🏢 Creating rooms...');
    let totalRooms = 0;
    for (const location of createdLocations) {
      const rooms = getRoomsForLocation(location._id, location.city);
      const createdRooms = await Room.insertMany(rooms);
      totalRooms += createdRooms.length;
      console.log(`   - ${createdRooms.length} rooms for ${location.name}`);
    }
    console.log(`✅ Created ${totalRooms} rooms total\n`);

    // Create users
    console.log('👥 Creating users...');
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      await User.create({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role
      });
      
      console.log(`   - ${userData.name} (${userData.email}) - Role: ${userData.role}`);
    }
    console.log(`✅ Created ${users.length} users\n`);

    // Display credentials
    console.log('🔐 Login Credentials:');
    console.log('   Admin:');
    console.log('     Email: admin@example.com');
    console.log('     Password: admin123');
    console.log('');
    console.log('   Regular User:');
    console.log('     Email: john@example.com');
    console.log('     Password: password123');
    console.log('');

    // Summary
    console.log('📊 Database Summary:');
    console.log(`   - Locations: ${createdLocations.length}`);
    console.log(`   - Rooms: ${totalRooms}`);
    console.log(`   - Users: ${users.length}`);
    console.log('');

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('🚀 You can now start the services and test the system.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
  }
}

// Run seed function
seed();

