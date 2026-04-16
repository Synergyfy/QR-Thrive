import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function extractLinkedQRId(data: any): Promise<string | null> {
  if (!data || typeof data !== 'object') return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = await extractLinkedQRId(item);
      if (found) return found;
    }
  } else {
    for (const key of Object.keys(data)) {
      if ((key === 'qrLinkId' || key === 'connectedQrId' || key === 'linkedQRCodeId') && typeof data[key] === 'string') {
        return data[key];
      }
      const found = await extractLinkedQRId(data[key]);
      if (found) return found;
    }
  }
  return null;
}

async function main() {
  const qrCodes = await prisma.qRCode.findMany({
    where: {
      linkedQRCodeId: null,
    },
  });

  console.log(`Found ${qrCodes.length} QR codes with null linkedQRCodeId`);

  for (const qr of qrCodes) {
    const extractedId = await extractLinkedQRId(qr.data);
    if (extractedId) {
      const exists = await prisma.qRCode.findUnique({ where: { id: extractedId } });
      if (exists) {
        await prisma.qRCode.update({
          where: { id: qr.id },
          data: { linkedQRCodeId: extractedId },
        });
        console.log(`Synced QR ${qr.id} -> Linked ${extractedId}`);
      } else {
        console.warn(`Extracted ID ${extractedId} for QR ${qr.id} does not exist in DB.`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
