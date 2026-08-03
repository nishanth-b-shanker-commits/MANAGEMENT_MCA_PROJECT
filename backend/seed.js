const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Vessel = require('./models/Vessel');
const Journey = require('./models/Journey');
const AuditTrail = require('./models/AuditTrail');

const DB_URI = "mongodb+srv://Project:Welcome%401234@cluster0.liljhzc.mongodb.net/portsystem?retryWrites=true&w=majority";

mongoose.connect(DB_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully!');
    
    // Clear all existing data in all collections
    await Promise.all([
      User.deleteMany({}),
      Vessel.deleteMany({}),
      Journey.deleteMany({}),
      AuditTrail.deleteMany({})
    ]);
    console.log("All existing data (Users, Vessels, Journeys, Audit Trails) cleared.");

    // Seed default users
    const hashedPassword = await bcrypt.hash('Welcome@1234', 10);
    const usersToSeed = [
        { username: 'Admin', role: 'System Administrator', email: 'admin-nmpa@gov.in' },
        { username: 'Agent', role: 'Ship Agent Account', email: 'agent-nmpa@gov.in' },
        { username: 'Hel', role: 'Health Department', email: 'hel-nmpa@gov.in' }
    ];

    const seededUsers = {};
    for (const u of usersToSeed) {
        const base32_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let rawSecret = '';
        for(let i = 0; i < 16; i++) {
            rawSecret += base32_chars.charAt(Math.floor(Math.random() * 32));
        }
        const newUser = new User({
            username: u.username,
            password: hashedPassword,
            email: u.email,
            role: u.role,
            status: 'approved',
            twoFactorSecret: rawSecret,
            is2FAEnabled: false
        });
        const saved = await newUser.save();
        seededUsers[u.username] = saved;
        console.log(`Created pre-seeded user: ${u.username} (${saved._id})`);
    }

    // Seed duplicate dummy vessels associated with the Agent account
    const agentUserId = String(seededUsers['Agent']._id);
    const vesselsToSeed = [
      { name: 'MV Narmada', imoNumber: '9123456', flagState: 'IN', vesselType: 'Container Ship', ownerDetails: 'India Shipping Line', grt: 28450, nrt: 16100, userId: agentUserId },
      { name: 'MV Narmada', imoNumber: '9123457', flagState: 'PA', vesselType: 'Container Ship', ownerDetails: 'Panama Ocean Ltd', grt: 28450, nrt: 16100, userId: agentUserId }, // Duplicate name
      { name: 'MT Swarajya', imoNumber: '9876543', flagState: 'IN', vesselType: 'Oil Tanker', ownerDetails: 'Indian Oil Corp', grt: 85000, nrt: 51000, userId: agentUserId },
      { name: 'MT Swarajya', imoNumber: '9876544', flagState: 'SG', vesselType: 'Oil Tanker', ownerDetails: 'Singapore Tankers Ltd', grt: 85000, nrt: 51000, userId: agentUserId } // Duplicate name
    ];

    const seededVessels = [];
    for (const v of vesselsToSeed) {
      const newVessel = new Vessel(v);
      const saved = await newVessel.save();
      seededVessels.push(saved);
      console.log(`Created dummy vessel: ${v.name} (IMO: ${v.imoNumber})`);
    }

    // Seed journeys with dummy voyage data, referencing the vessels
    const journeysToSeed = [
      {
        vessel: seededVessels[0].toObject(),
        lastPortOfCall: 'Singapore',
        eta: new Date('2026-07-20T10:00:00Z'),
        etd: new Date('2026-07-25T18:00:00Z'),
        status: 'In Progress',
        clearances: { customs: 'Pending', health: 'Approved', traffic: 'Pending' },
        notes: { customs: '', health: 'All crew vaccination cards verified.', traffic: '' },
        documents: ['IGM_File.pdf', 'Crew_List.pdf', 'Receipt_ILH.pdf'],
        captainName: 'Capt. R. K. Singh',
        destinationPort: 'Mangalore Port',
        cargoType: 'CONTAINER',
        crewCount: 24,
        passengerCount: 0,
        ilhReceiptNo: 'ILH-2026-0091',
        ilhPaidDate: new Date('2026-07-10T12:00:00Z'),
        ilhAmount: 48900,
        ilhValidFrom: new Date('2026-07-10T00:00:00Z'),
        ilhValidTo: new Date('2026-10-10T23:59:59Z'),
        userId: agentUserId
      },
      {
        vessel: seededVessels[1].toObject(), // Duplicate name "MV Narmada" but different IMO
        lastPortOfCall: 'Colombo',
        eta: new Date('2026-07-21T08:30:00Z'),
        etd: new Date('2026-07-26T20:00:00Z'),
        status: 'In Progress',
        clearances: { customs: 'Pending', health: 'Pending', traffic: 'Pending' },
        notes: { customs: '', health: '', traffic: '' },
        documents: ['IGM_File.pdf', 'Crew_List.pdf'],
        captainName: 'Capt. S. Jayawardene',
        destinationPort: 'Mangalore Port',
        cargoType: 'CONTAINER',
        crewCount: 22,
        passengerCount: 0,
        ilhReceiptNo: '',
        ilhAmount: 0,
        userId: agentUserId
      },
      {
        vessel: seededVessels[2].toObject(),
        lastPortOfCall: 'Jebel Ali',
        eta: new Date('2026-07-15T06:00:00Z'),
        etd: new Date('2026-07-18T12:00:00Z'),
        status: 'Cleared',
        clearances: { customs: 'Approved', health: 'Approved', traffic: 'Approved' },
        notes: { 
          customs: 'Duty fees and ILH dues fully paid.', 
          health: 'PHO sanitation checklist complete.', 
          traffic: 'Berth 11 assigned.' 
        },
        documents: ['Manifest.pdf', 'Sanitation_Cert.pdf', 'Receipt_ILH.pdf'],
        captainName: 'Capt. Ahmed Al-Mansoori',
        destinationPort: 'Mangalore Port',
        cargoType: 'CRUDE',
        crewCount: 28,
        passengerCount: 2,
        ilhReceiptNo: 'ILH-2026-0044',
        ilhPaidDate: new Date('2026-07-12T14:30:00Z'),
        ilhAmount: 125000,
        ilhValidFrom: new Date('2026-07-12T00:00:00Z'),
        ilhValidTo: new Date('2026-10-12T23:59:59Z'),
        userId: agentUserId
      }
    ];

    for (const j of journeysToSeed) {
      const newJourney = new Journey(j);
      await newJourney.save();
      console.log(`Created dummy journey for vessel: ${j.vessel.name} (IMO: ${j.vessel.imoNumber})`);
    }

    // Seed audit trails
    const auditTrailsToSeed = [
      { action: 'Database fully cleared and seeded with duplicate test data', user: 'System Administrator', timestamp: new Date(Date.now() - 120000) },
      { action: 'Seed configuration initialised', user: 'System Administrator', timestamp: new Date(Date.now() - 60000) }
    ];

    for (const a of auditTrailsToSeed) {
      const newAudit = new AuditTrail(a);
      await newAudit.save();
    }
    console.log("Seeded default system audit logs.");

    console.log("Database seeding completed successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.log('MongoDB Error:', err);
    process.exit(1);
  });
