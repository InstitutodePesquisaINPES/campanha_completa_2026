import { PrismaClient, AppRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seeding da Kiribamba Enterprise...');

  // 1. Criar ou Obter o Tenant Master da Campanha Kiribamba
  const tenantSlug = 'kiribamba-master';
  let tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    console.log('Cobrindo Tenant inicial: Kiribamba Master...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Comitê Central Kiribamba',
        slug: tenantSlug,
        active: true,
      },
    });
  }

  // 2. Configurações de Sistema base do Tenant
  const settingsBase = [
    { key: 'brand_name', value: '"KIRIBAMBA"' },
    { key: 'brand_number', value: '"70"' },
    { key: 'brand_subtitle', value: '"Avante · QG"' },
    { key: 'gamificacao_pontos_base', value: '"10"' },
  ];

  for (const setting of settingsBase) {
    await prisma.systemSetting.upsert({
      where: {
        tenantId_key: { tenantId: tenant.id, key: setting.key },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        key: setting.key,
        value: JSON.parse(setting.value),
        description: 'Autogerado via Seeder',
      },
    });
  }

  // 3. Criar SuperAdmin (Dono do SaaS)
  const adminEmail = 'admin@kiribamba.com';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    console.log('Criando usuário Super Admin...');
    const passwordHash = await bcrypt.hash('Sistema@1@2@3', 12);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Super Administrador',
        passwordHash,
        tenantId: tenant.id, // O Admin global reside no tenant master
        roles: {
          create: {
            role: AppRole.admin,
            tenantId: tenant.id,
          },
        },
      },
    });
  } else {
    console.log('Usuário Admin já existe. Pulando...');
  }

  // 4. Criar Coordenador Geral (O usuário real de operação da campanha)
  const coordEmail = 'coordenacao@kiribamba.com';
  const coordExists = await prisma.user.findUnique({ where: { email: coordEmail } });

  if (!coordExists) {
    console.log('Criando usuário Coordenador Geral...');
    const passwordHash = await bcrypt.hash('Sistema@1@2@3', 12);
    
    await prisma.user.create({
      data: {
        email: coordEmail,
        fullName: 'Comandante da Campanha',
        passwordHash,
        tenantId: tenant.id,
        roles: {
          create: {
            role: AppRole.coord_geral,
            tenantId: tenant.id,
          },
        },
      },
    });
  }

  console.log('✅ Seeding finalizado com sucesso!');
  console.log('----------------------------------------------------');
  console.log('Credenciais Padrão de Acesso:');
  console.log('Admin (Billing/Sysadmin): admin@kiribamba.com / Sistema@1@2@3');
  console.log('Chefe de Campanha (Operação): coordenacao@kiribamba.com / Sistema@1@2@3');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
