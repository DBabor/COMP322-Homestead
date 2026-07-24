import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    //unpack parameters
    const { id } = await params;
    const cropId = parseInt(id, 10);

    if (isNaN(cropId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    //delete
    await prisma.crop.delete({
      where: { id: cropId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting crop:", error);
    return NextResponse.json(
      { error: "Failed to delete crop record" },
      { status: 500 }
    );
  }
}