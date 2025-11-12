import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Add/Update Chilean Financial Institutions
 * Based on web research conducted on 2025-11-11
 *
 * This script adds new institutions and updates existing ones with verified URLs
 */

interface BankUpdate {
  name: string;
  code: string;
  loginUrl: string;
  description: string;
  active: boolean;
  type: 'bank' | 'insurance' | 'financial-group';
  verified: boolean;
  verifiedDate: Date;
}

const newInstitutions: BankUpdate[] = [
  {
    name: 'Consorcio Financiero',
    code: 'CONSORCIO',
    loginUrl: 'https://portal-corredores.consorcio.cl/login-tradicional/',
    description:
      'Chilean financial conglomerate including Banco Consorcio, 100+ years of experience',
    active: true,
    type: 'financial-group',
    verified: true,
    verifiedDate: new Date('2025-11-11'),
  },
  {
    name: 'Bice Vida Compañía de Seguros',
    code: 'BICEVIDA',
    loginUrl: 'https://bicevida.portalclientes.cl',
    description: 'Life and health insurance company, part of BICE financial group',
    active: true,
    type: 'insurance',
    verified: true,
    verifiedDate: new Date('2025-11-11'),
  },
];

const urlUpdates: BankUpdate[] = [
  {
    name: 'BancoEstado',
    code: 'BESTADO',
    loginUrl: 'https://us.bancoestado.cl/Backoffice/login',
    description: 'The only public bank in Chile, largest mortgage lender and debit card issuer',
    active: true,
    type: 'bank',
    verified: true,
    verifiedDate: new Date('2025-11-11'),
  },
  {
    name: 'Banco Santander Chile',
    code: 'SANTANDER',
    loginUrl: 'https://app.santander.cl',
    description: 'Largest bank in Chile by loans and deposits, 504 branch network',
    active: true,
    type: 'bank',
    verified: true,
    verifiedDate: new Date('2025-11-11'),
  },
];

async function addNewBanks() {
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

    console.log('\n📊 Adding New Institutions...\n');

    // Add new institutions
    for (const institution of newInstitutions) {
      const existing = await banksCollection.findOne({ code: institution.code });

      if (existing) {
        console.log(`⏭️  ${institution.code}: Already exists, skipping...`);
      } else {
        await banksCollection.insertOne({
          ...institution,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ ${institution.code}: ${institution.name} - ADDED`);
        console.log(`   📍 URL: ${institution.loginUrl}`);
        console.log(`   🏷️  Type: ${institution.type}`);
      }
    }

    console.log('\n🔄 Updating Existing Institutions with Verified URLs...\n');

    // Update existing institutions with verified URLs
    for (const update of urlUpdates) {
      const result = await banksCollection.updateOne(
        { code: update.code },
        {
          $set: {
            loginUrl: update.loginUrl,
            verified: update.verified,
            verifiedDate: update.verifiedDate,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ ${update.code}: URL updated to ${update.loginUrl}`);
      } else {
        console.log(`⚠️  ${update.code}: Not found in database`);
      }
    }

    console.log('\n📊 Database Status:\n');

    // Show all banks
    const allBanks = await banksCollection.find().sort({ code: 1 }).toArray();

    console.log('┌─────────────────┬──────────────────────────────┬────────────┐');
    console.log('│ Code            │ Name                         │ Type       │');
    console.log('├─────────────────┼──────────────────────────────┼────────────┤');

    allBanks.forEach((bank: any) => {
      const code = bank.code.padEnd(15);
      const name = bank.name.substring(0, 28).padEnd(28);
      const type = (bank.type || 'bank').padEnd(10);
      console.log(`│ ${code} │ ${name} │ ${type} │`);
    });

    console.log('└─────────────────┴──────────────────────────────┴────────────┘');
    console.log(`\n📊 Total institutions: ${allBanks.length}`);

    console.log('\n🐾✨ Database updated successfully!\n');
    console.log('🔍 Ready for security auditing (EDUCATIONAL USE ONLY)');
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addNewBanks();
