import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const offers = [
  // ECONOMICO
  { provider: 'MOVIDA', model: 'Chevrolet Onix', category: 'ECONOMICO', price: 89.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://movida.com.br', imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800' },
  { provider: 'LOCALIZA', model: 'Volkswagen Gol', category: 'ECONOMICO', price: 79.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: 'https://localiza.com', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'UNIDAS', model: 'Fiat Mobi', category: 'ECONOMICO', price: 74.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: 'https://unidas.com.br', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  { provider: 'FOCO', model: 'Hyundai HB20', category: 'ECONOMICO', price: 82.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://focorental.com.br', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { provider: 'MOVIDA', model: 'Renault Kwid', category: 'ECONOMICO', price: 69.90, transmission: 'Manual', hasAC: true, seats: 5, deepLink: 'https://movida.com.br', imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800' },
  { provider: 'HERTZ', model: 'Fiat Argo', category: 'ECONOMICO', price: 85.00, transmission: 'Manual', hasAC: true, seats: 5, deepLink: 'https://hertz.com.br', imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800' },
  // INTERMEDIARIO
  { provider: 'LOCALIZA', model: 'Toyota Corolla', category: 'INTERMEDIARIO', price: 149.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://localiza.com', imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800' },
  { provider: 'MOVIDA', model: 'Honda Civic', category: 'INTERMEDIARIO', price: 159.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://movida.com.br', imageUrl: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800' },
  { provider: 'UNIDAS', model: 'Volkswagen Virtus', category: 'INTERMEDIARIO', price: 139.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://unidas.com.br', imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800' },
  { provider: 'FOCO', model: 'Chevrolet Cruze', category: 'INTERMEDIARIO', price: 155.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://focorental.com.br', imageUrl: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800' },
  { provider: 'HERTZ', model: 'Nissan Sentra', category: 'INTERMEDIARIO', price: 145.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://hertz.com.br', imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800' },
  // SUV
  { provider: 'LOCALIZA', model: 'Toyota RAV4', category: 'SUV', price: 289.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://localiza.com', imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800' },
  { provider: 'MOVIDA', model: 'Hyundai Tucson', category: 'SUV', price: 269.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://movida.com.br', imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800' },
  { provider: 'UNIDAS', model: 'Jeep Compass', category: 'SUV', price: 299.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://unidas.com.br', imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=800' },
  { provider: 'HERTZ', model: 'Ford Bronco Sport', category: 'SUV', price: 319.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://hertz.com.br', imageUrl: 'https://images.unsplash.com/photo-1586456959804-a80f6d5fff72?w=800' },
  { provider: 'FOCO', model: 'Volkswagen T-Cross', category: 'SUV', price: 249.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://focorental.com.br', imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800' },
  { provider: 'LOCALIZA', model: 'Mitsubishi Eclipse Cross', category: 'SUV', price: 279.90, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://localiza.com', imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800' },
  // LUXO
  { provider: 'HERTZ', model: 'Mercedes-Benz GLC', category: 'LUXO', price: 450.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://hertz.com.br', imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800' },
  { provider: 'LOCALIZA', model: 'BMW Série 3', category: 'LUXO', price: 420.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://localiza.com', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800' },
  { provider: 'MOVIDA', model: 'Audi A4', category: 'LUXO', price: 430.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://movida.com.br', imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800' },
  { provider: 'HERTZ', model: 'Volvo XC60', category: 'LUXO', price: 480.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://hertz.com.br', imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800' },
  { provider: 'FOCO', model: 'Lexus ES 300h', category: 'LUXO', price: 510.00, transmission: 'Automático', hasAC: true, seats: 5, deepLink: 'https://focorental.com.br', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  // VAN
  { provider: 'UNIDAS', model: 'Mercedes-Benz Sprinter', category: 'VAN', price: 380.00, transmission: 'Manual', hasAC: true, seats: 15, deepLink: 'https://unidas.com.br', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
  { provider: 'MOVIDA', model: 'Fiat Ducato', category: 'VAN', price: 350.00, transmission: 'Manual', hasAC: true, seats: 12, deepLink: 'https://movida.com.br', imageUrl: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2a?w=800' },
  { provider: 'LOCALIZA', model: 'Renault Master', category: 'VAN', price: 320.00, transmission: 'Manual', hasAC: true, seats: 14, deepLink: 'https://localiza.com', imageUrl: 'https://images.unsplash.com/photo-1521056787327-165eb0d5a0b9?w=800' },
  { provider: 'FOCO', model: 'Toyota Hiace', category: 'VAN', price: 400.00, transmission: 'Automático', hasAC: true, seats: 12, deepLink: 'https://focorental.com.br', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800' },
];

async function main() {
  console.log('Seeding database...');
  await prisma.carOffer.deleteMany();
  for (const offer of offers) {
    await prisma.carOffer.create({ data: offer as any });
  }
  console.log(`Seeded ${offers.length} car offers`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
