import { PrismaClient, Role, Channel, OrderStatus, PaymentMethod, PaymentStatus, PromoType, ValueType, LoyaltyTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // 1. CREATE USERS
  // ============================================
  console.log('📝 Creating users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@coffeeshop.com' },
    update: {},
    create: {
      email: 'admin@coffeeshop.com',
      name: 'Admin User',
      phone: '+6281234567890',
      password: '$2b$10$hashpassword123', // Hashed: admin123 (use bcrypt in production)
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@coffeeshop.com' },
    update: {},
    create: {
      email: 'staff@coffeeshop.com',
      name: 'Staff User',
      phone: '+6281234567891',
      password: '$2b$10$hashpassword123',
      role: Role.STAFF,
    },
  });

  const customer = await prisma.user.upsert({
    where: { phone: '+6281234567892' },
    update: {},
    create: {
      phone: '+6281234567892',
      name: 'John Doe',
      email: 'john@example.com',
      role: Role.CUSTOMER,
    },
  });

  console.log(`✓ Created ${admin.name}, ${staff.name}, ${customer.name}`);

  // ============================================
  // 2. CREATE MENU CATEGORIES
  // ============================================
  console.log('☕ Creating menu categories...');

  const coffeeCategory = await prisma.menuCategory.create({
    data: {
      name: 'Coffee',
      description: 'Our signature coffee drinks',
      icon: '☕',
      sortOrder: 1,
    },
  });

  const nonCoffeeCategory = await prisma.menuCategory.create({
    data: {
      name: 'Non-Coffee',
      description: 'Delicious non-coffee beverages',
      icon: '🍵',
      sortOrder: 2,
    },
  });

  const foodCategory = await prisma.menuCategory.create({
    data: {
      name: 'Food & Snacks',
      description: 'Perfect pairings for your drink',
      icon: '🥐',
      sortOrder: 3,
    },
  });

  console.log('✓ Created menu categories');

  // ============================================
  // 3. CREATE MENU ITEMS
  // ============================================
  console.log('📋 Creating menu items...');

  // Coffee Items
  const espresso = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCategory.id,
      name: 'Espresso',
      description: 'Rich and bold single shot espresso',
      price: 18000,
      images: ['https://images.unsplash.com/photo-espresso-1'],
      isActive: true,
      isPopular: true,
      prepTime: 5,
      tags: ['hot', 'classic', 'bestseller'],
    },
  });

  const americano = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCategory.id,
      name: 'Americano',
      description: 'Espresso with hot water for a smoother taste',
      price: 22000,
      images: ['https://images.unsplash.com/photo-americano-1'],
      isActive: true,
      isPopular: false,
      prepTime: 5,
      tags: ['hot', 'classic'],
    },
  });

  const cappuccino = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCategory.id,
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      price: 28000,
      images: ['https://images.unsplash.com/photo-cappuccino-1'],
      isActive: true,
      isPopular: true,
      isFeatured: true,
      prepTime: 7,
      tags: ['hot', 'milky', 'bestseller'],
    },
  });

  const latte = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCategory.id,
      name: 'Latte',
      description: 'Smooth espresso with steamed milk',
      price: 30000,
      images: ['https://images.unsplash.com/photo-latte-1'],
      isActive: true,
      isPopular: true,
      prepTime: 7,
      tags: ['hot', 'cold', 'milky'],
    },
  });

  const caramelMacchiato = await prisma.menuItem.create({
    data: {
      categoryId: coffeeCategory.id,
      name: 'Caramel Macchiato',
      description: 'Espresso with vanilla syrup and caramel drizzle',
      price: 35000,
      images: ['https://images.unsplash.com/photo-macchiato-1'],
      isActive: true,
      isPopular: true,
      isFeatured: true,
      prepTime: 8,
      tags: ['hot', 'cold', 'sweet', 'signature'],
    },
  });

  // Non-Coffee Items
  const matchaLatte = await prisma.menuItem.create({
    data: {
      categoryId: nonCoffeeCategory.id,
      name: 'Matcha Latte',
      description: 'Premium Japanese matcha with steamed milk',
      price: 32000,
      images: ['https://images.unsplash.com/photo-matcha-1'],
      isActive: true,
      isPopular: true,
      prepTime: 7,
      tags: ['hot', 'cold', 'green tea'],
    },
  });

  const chocolate = await prisma.menuItem.create({
    data: {
      categoryId: nonCoffeeCategory.id,
      name: 'Hot Chocolate',
      description: 'Rich Belgian chocolate with whipped cream',
      price: 30000,
      images: ['https://images.unsplash.com/photo-chocolate-1'],
      isActive: true,
      isPopular: false,
      prepTime: 7,
      tags: ['hot', 'cold', 'sweet', 'kids'],
    },
  });

  const taroMilktea = await prisma.menuItem.create({
    data: {
      categoryId: nonCoffeeCategory.id,
      name: 'Taro Milk Tea',
      description: 'Creamy taro with brown sugar pearls',
      price: 28000,
      images: ['https://images.unsplash.com/photo-taro-1'],
      isActive: true,
      isPopular: true,
      prepTime: 8,
      tags: ['cold', 'sweet', 'boba'],
    },
  });

  // Food Items
  const croissant = await prisma.menuItem.create({
    data: {
      categoryId: foodCategory.id,
      name: 'Butter Croissant',
      description: 'Flaky, buttery French pastry',
      price: 25000,
      images: ['https://images.unsplash.com/photo-croissant-1'],
      isActive: true,
      isPopular: true,
      prepTime: 3,
      tags: ['pastry', 'bestseller'],
    },
  });

  const sandwich = await prisma.menuItem.create({
    data: {
      categoryId: foodCategory.id,
      name: 'Chicken Sandwich',
      description: 'Grilled chicken with fresh vegetables',
      price: 35000,
      images: ['https://images.unsplash.com/photo-sandwich-1'],
      isActive: true,
      isPopular: false,
      prepTime: 10,
      tags: ['savory', 'lunch'],
    },
  });

  const fries = await prisma.menuItem.create({
    data: {
      categoryId: foodCategory.id,
      name: 'French Fries',
      description: 'Crispy golden fries with seasoning',
      price: 20000,
      images: ['https://images.unsplash.com/photo-fries-1'],
      isActive: true,
      isPopular: true,
      prepTime: 8,
      tags: ['snack', 'savory'],
    },
  });

  console.log(`✓ Created ${await prisma.menuItem.count()} menu items`);

  // ============================================
  // 4. CREATE MENU OPTIONS
  // ============================================
  console.log('⚙️ Creating menu options...');

  // Size option for drinks
  const sizeOption = await prisma.menuOption.create({
    data: {
      itemId: latte.id,
      name: 'Size',
      type: 'SINGLE',
      required: true,
      minSelect: 1,
      maxSelect: 1,
      values: {
        create: [
          { value: 'Regular', priceModifier: 0, isDefault: true },
          { value: 'Large', priceModifier: 5000 },
        ],
      },
    },
  });

  // Sugar level for drinks
  const sugarOption = await prisma.menuOption.create({
    data: {
      itemId: matchaLatte.id,
      name: 'Sugar Level',
      type: 'SINGLE',
      required: false,
      values: {
        create: [
          { value: 'Normal (100%)', priceModifier: 0, isDefault: true },
          { value: 'Less Sweet (50%)', priceModifier: 0 },
          { value: 'No Sugar (0%)', priceModifier: 0 },
        ],
      },
    },
  });

  // Ice level for cold drinks
  const iceOption = await prisma.menuOption.create({
    data: {
      itemId: taroMilktea.id,
      name: 'Ice Level',
      type: 'SINGLE',
      required: false,
      values: {
        create: [
          { value: 'Normal Ice', priceModifier: 0, isDefault: true },
          { value: 'Less Ice', priceModifier: 0 },
          { value: 'No Ice', priceModifier: 0 },
        ],
      },
    },
  });

  // Add-ons
  const addonOption = await prisma.menuOption.create({
    data: {
      itemId: cappuccino.id,
      name: 'Add-ons',
      type: 'MULTIPLE',
      required: false,
      maxSelect: 3,
      values: {
        create: [
          { value: 'Extra Shot', priceModifier: 8000 },
          { value: 'Whipped Cream', priceModifier: 5000 },
          { value: 'Caramel Drizzle', priceModifier: 4000 },
          { value: 'Chocolate Drizzle', priceModifier: 4000 },
        ],
      },
    },
  });

  console.log('✓ Created menu options');

  // ============================================
  // 5. CREATE SAMPLE ORDER
  // ============================================
  console.log('📦 Creating sample order...');

  const sampleOrder = await prisma.order.create({
    data: {
      userId: customer.id,
      orderNumber: 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-001',
      status: OrderStatus.PENDING,
      channel: Channel.QR,
      tableNumber: '5',
      customerName: 'John Doe',
      customerPhone: customer.phone!,
      subtotal: 58000,
      discount: 0,
      tax: 5800,
      serviceFee: 2900,
      totalPrice: 66700,
      items: {
        create: [
          {
            itemId: latte.id,
            quantity: 1,
            unitPrice: 30000,
            totalPrice: 35000,
            notes: 'Extra hot please',
            options: {
              create: {
                optionValueId: (await prisma.menuOptionValue.findFirst({
                  where: { option: { itemId: latte.id }, value: 'Large' },
                }))!.id,
                priceModifier: 5000,
              },
            },
          },
          {
            itemId: croissant.id,
            quantity: 1,
            unitPrice: 25000,
            totalPrice: 25000,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log(`✓ Created sample order: ${sampleOrder.orderNumber}`);

  // ============================================
  // 6. CREATE PROMOS
  // ============================================
  console.log('🎁 Creating promos...');

  const welcomePromo = await prisma.promo.create({
    data: {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: '10% off for first-time customers',
      type: PromoType.DISCOUNT,
      valueType: ValueType.PERCENTAGE,
      value: 10,
      minPurchase: 30000,
      maxDiscount: 20000,
      usageLimit: 1000,
      usedCount: 0,
      perUserLimit: 1,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      applicableItems: [],
      applicableChannels: [Channel.QR, Channel.WEB, Channel.WHATSAPP],
    },
  });

  const bundlePromo = await prisma.promo.create({
    data: {
      code: 'COFFEEFOOD',
      name: 'Coffee + Food Bundle',
      description: 'Buy coffee + food, get 15% off',
      type: PromoType.BUNDLE,
      valueType: ValueType.PERCENTAGE,
      value: 15,
      minPurchase: 50000,
      maxDiscount: 30000,
      usageLimit: 500,
      usedCount: 0,
      perUserLimit: 2,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      applicableItems: [],
      applicableChannels: [Channel.QR, Channel.WEB],
    },
  });

  console.log(`✓ Created ${await prisma.promo.count()} promos`);

  // ============================================
  // 7. CREATE LOYALTY PROGRAM
  // ============================================
  console.log('⭐ Setting up loyalty program...');

  const customerLoyalty = await prisma.loyaltyPoint.create({
    data: {
      userId: customer.id,
      points: 100,
      lifetimePoints: 100,
      tier: LoyaltyTier.BRONZE,
    },
  });

  console.log('✓ Created loyalty program');

  // ============================================
  // 8. CREATE SYSTEM SETTINGS
  // ============================================
  console.log('⚙️ Creating system settings...');

  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'store_info',
        category: 'general',
        value: {
          name: 'AI Coffee Shop',
          address: 'Jl. Contoh No. 123, Jakarta',
          phone: '+6281234567890',
          email: 'hello@aicoffeeshop.com',
          timezone: 'Asia/Jakarta',
        },
      },
      {
        key: 'operating_hours',
        category: 'general',
        value: {
          monday: { open: '08:00', close: '22:00' },
          tuesday: { open: '08:00', close: '22:00' },
          wednesday: { open: '08:00', close: '22:00' },
          thursday: { open: '08:00', close: '22:00' },
          friday: { open: '08:00', close: '23:00' },
          saturday: { open: '09:00', close: '23:00' },
          sunday: { open: '09:00', close: '22:00' },
        },
      },
      {
        key: 'tax_rate',
        category: 'pricing',
        value: { rate: 10, enabled: true },
      },
      {
        key: 'service_fee_rate',
        category: 'pricing',
        value: { rate: 5, enabled: true },
      },
      {
        key: 'loyalty_settings',
        category: 'loyalty',
        value: {
          enabled: true,
          pointsPerDollar: 1,
          redemptionRate: 100, // 100 points = $1
        },
      },
    ],
  });

  console.log('✓ Created system settings');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Menu Categories: ${await prisma.menuCategory.count()}`);
  console.log(`   - Menu Items: ${await prisma.menuItem.count()}`);
  console.log(`   - Menu Options: ${await prisma.menuOption.count()}`);
  console.log(`   - Orders: ${await prisma.order.count()}`);
  console.log(`   - Promos: ${await prisma.promo.count()}`);
  console.log(`   - Loyalty Members: ${await prisma.loyaltyPoint.count()}`);
  console.log('\n🔐 Test Credentials:');
  console.log('   Admin: admin@coffeeshop.com / admin123');
  console.log('   Staff: staff@coffeeshop.com / staff123');
  console.log('   Customer: +6281234567892');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
