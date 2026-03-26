require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Base = require('./models/Base');
const Purchase = require('./models/Purchase');
const Transfer = require('./models/Transfer');
const Assignment = require('./models/Assignment');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Base.deleteMany({}),
    Purchase.deleteMany({}),
    Transfer.deleteMany({}),
    Assignment.deleteMany({}),
  ]);

  console.log('🗑️  Cleared existing data');

  // Create Bases
  const bases = await Base.insertMany([
    { name: 'Alpha Base', code: 'ALPHA', location: 'Northern Region' },
    { name: 'Bravo Base', code: 'BRAVO', location: 'Southern Region' },
    { name: 'Charlie Base', code: 'CHARLIE', location: 'Eastern Region' },
  ]);

  const [alphaBase, bravoBase, charlieBase] = bases;
  console.log('🏠 Bases created:', bases.map(b => b.name).join(', '));

  // Create Users
  const users = [
    { username: 'admin', password: 'admin123', name: 'System Administrator', role: 'admin', baseId: null },
    { username: 'commander_alpha', password: 'pass123', name: 'Col. James Alpha', role: 'base_commander', baseId: alphaBase._id },
    { username: 'commander_bravo', password: 'pass123', name: 'Col. Sarah Bravo', role: 'base_commander', baseId: bravoBase._id },
    { username: 'commander_charlie', password: 'pass123', name: 'Col. Robert Charlie', role: 'base_commander', baseId: charlieBase._id },
    { username: 'logistics1', password: 'pass123', name: 'Lt. Mike Logistics', role: 'logistics_officer', baseId: alphaBase._id },
    { username: 'logistics2', password: 'pass123', name: 'Lt. Anna Supply', role: 'logistics_officer', baseId: bravoBase._id },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
  }
  console.log('👥 Users created:', createdUsers.map(u => u.username).join(', '));

  const admin = createdUsers[0];

  // Seed Purchases
  const purchases = await Purchase.insertMany([
    { assetName: 'M4 Carbine', assetType: 'weapon', quantity: 50, baseId: alphaBase._id, purchaseDate: new Date('2024-01-05'), supplier: 'DefenseCorp', notes: 'Initial stock', createdBy: admin._id },
    { assetName: 'Humvee', assetType: 'vehicle', quantity: 10, baseId: alphaBase._id, purchaseDate: new Date('2024-01-10'), supplier: 'AM General', notes: 'Q1 procurement', createdBy: admin._id },
    { assetName: '5.56mm Ammo', assetType: 'ammunition', quantity: 10000, baseId: bravoBase._id, purchaseDate: new Date('2024-01-15'), supplier: 'AmmoSupply Ltd', notes: 'Bulk order', createdBy: admin._id },
    { assetName: 'Night Vision Goggles', assetType: 'equipment', quantity: 30, baseId: bravoBase._id, purchaseDate: new Date('2024-02-01'), supplier: 'OptiTech', createdBy: admin._id },
    { assetName: 'APC', assetType: 'vehicle', quantity: 5, baseId: charlieBase._id, purchaseDate: new Date('2024-02-10'), supplier: 'BAE Systems', createdBy: admin._id },
    { assetName: 'M9 Pistol', assetType: 'weapon', quantity: 100, baseId: charlieBase._id, purchaseDate: new Date('2024-02-20'), supplier: 'DefenseCorp', createdBy: admin._id },
    { assetName: 'Body Armor', assetType: 'equipment', quantity: 200, baseId: alphaBase._id, purchaseDate: new Date('2024-03-01'), supplier: 'ArmorTech', createdBy: admin._id },
    { assetName: '9mm Ammo', assetType: 'ammunition', quantity: 5000, baseId: alphaBase._id, purchaseDate: new Date('2024-03-05'), supplier: 'AmmoSupply Ltd', createdBy: admin._id },
  ]);
  console.log(`📦 ${purchases.length} purchases seeded`);

  // Seed Transfers
  const transfers = await Transfer.insertMany([
    { assetName: 'M4 Carbine', assetType: 'weapon', quantity: 10, fromBase: alphaBase._id, toBase: bravoBase._id, transferDate: new Date('2024-01-20'), notes: 'Rebalancing stock', status: 'completed', createdBy: admin._id },
    { assetName: 'Humvee', assetType: 'vehicle', quantity: 3, fromBase: alphaBase._id, toBase: charlieBase._id, transferDate: new Date('2024-02-05'), notes: 'Operational support', status: 'completed', createdBy: admin._id },
    { assetName: '5.56mm Ammo', assetType: 'ammunition', quantity: 2000, fromBase: bravoBase._id, toBase: alphaBase._id, transferDate: new Date('2024-02-15'), notes: 'Training exercise supply', status: 'completed', createdBy: admin._id },
    { assetName: 'Night Vision Goggles', assetType: 'equipment', quantity: 10, fromBase: bravoBase._id, toBase: charlieBase._id, transferDate: new Date('2024-03-01'), notes: 'Mission support', status: 'completed', createdBy: admin._id },
  ]);
  console.log(`🔄 ${transfers.length} transfers seeded`);

  // Seed Assignments
  const assignments = await Assignment.insertMany([
    { assetName: 'M4 Carbine', assetType: 'weapon', quantity: 5, baseId: alphaBase._id, assignedTo: 'Sgt. John Doe', assignmentDate: new Date('2024-01-25'), isExpended: false, notes: 'Patrol duty', createdBy: admin._id },
    { assetName: 'Humvee', assetType: 'vehicle', quantity: 2, baseId: alphaBase._id, assignedTo: 'Alpha Platoon', assignmentDate: new Date('2024-01-28'), isExpended: false, notes: 'Patrol mission', createdBy: admin._id },
    { assetName: '5.56mm Ammo', assetType: 'ammunition', quantity: 500, baseId: bravoBase._id, assignedTo: 'Bravo Squad', assignmentDate: new Date('2024-02-10'), isExpended: true, expendedDate: new Date('2024-02-12'), notes: 'Training range', createdBy: admin._id },
    { assetName: 'Body Armor', assetType: 'equipment', quantity: 20, baseId: alphaBase._id, assignedTo: 'Alpha Company', assignmentDate: new Date('2024-03-05'), isExpended: false, notes: 'Field deployment', createdBy: admin._id },
    { assetName: 'M9 Pistol', assetType: 'weapon', quantity: 10, baseId: charlieBase._id, assignedTo: 'Lt. Williams', assignmentDate: new Date('2024-02-25'), isExpended: false, createdBy: admin._id },
    { assetName: '9mm Ammo', assetType: 'ammunition', quantity: 200, baseId: alphaBase._id, assignedTo: 'Security Detail', assignmentDate: new Date('2024-03-08'), isExpended: true, expendedDate: new Date('2024-03-10'), notes: 'Live fire exercise', createdBy: admin._id },
  ]);
  console.log(`📋 ${assignments.length} assignments seeded`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('  admin / admin123 → Admin (all bases)');
  console.log('  commander_alpha / pass123 → Base Commander (Alpha Base)');
  console.log('  commander_bravo / pass123 → Base Commander (Bravo Base)');
  console.log('  commander_charlie / pass123 → Base Commander (Charlie Base)');
  console.log('  logistics1 / pass123 → Logistics Officer (Alpha Base)');
  console.log('  logistics2 / pass123 → Logistics Officer (Bravo Base)');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
