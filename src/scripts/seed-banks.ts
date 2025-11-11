import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Seed Chilean Banks Data
 * Based on web research conducted on 2025-11-11
 */
const chileanBanks = [
  {
    name: 'Banco de Chile',
    code: 'BCHILE',
    loginUrl: 'https://login.portal.bancochile.cl',
    description: 'One of Chile\'s oldest and most prestigious banks, established in 1893',
    active: true,
  },
  {
    name: 'BancoEstado',
    code: 'BESTADO',
    loginUrl: 'https://www.bancoestado.cl',
    description: 'The only public bank in Chile, largest mortgage lender and debit card issuer',
    active: true,
  },
  {
    name: 'Banco Santander Chile',
    code: 'SANTANDER',
    loginUrl: 'https://banco.santander.cl',
    description: 'Largest bank in Chile by loans and deposits, 504 branch network',
    active: true,
  },
  {
    name: 'Banco BCI',
    code: 'BCI',
    loginUrl: 'https://www.bci.cl',
    description: 'Banco de Crédito e Inversiones, one of the most innovative banks in digital services',
    active: true,
  },
  {
    name: 'Banco Itau Chile',
    code: 'ITAU',
    loginUrl: 'https://banco.itau.cl',
    description: 'Brazilian bank focused on technology to improve customer experience',
    active: true,
  },
  {
    name: 'Scotiabank Chile',
    code: 'SCOTIABANK',
    loginUrl: 'https://www.scotiabank.cl/mfe-login-web-cl/',
    description: 'Canadian bank focusing on new banking products and digital banking',
    active: true,
  },
  {
    name: 'Banco Security',
    code: 'SECURITY',
    loginUrl: 'https://www.bancosecurity.cl',
    description: 'Chilean bank fostering transparency in the banking sector',
    active: true,
  },
];

async function seedBanks() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
    console.error('❌ RULE 47 Violation: Must use MongoDB Atlas URI, not localhost!');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db: Db = client.db('chilean-banks-audit');
    const banksCollection = db.collection('banks');

    // Clear existing banks
    await banksCollection.deleteMany({});
    console.log('🗑️  Cleared existing banks');

    // Insert Chilean banks
    const result = await banksCollection.insertMany(
      chileanBanks.map((bank) => ({
        ...bank,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    console.log(`✅ Seeded ${result.insertedCount} Chilean banks:`);
    chileanBanks.forEach((bank) => {
      console.log(`   🏦 ${bank.code}: ${bank.name}`);
    });

    console.log('\n🐾✨ Database ready for educational auditing!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedBanks();
