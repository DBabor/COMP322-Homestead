import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

export async function GET() {
  try {
    const savedCrops = await prisma.crop.findMany(); 
    return NextResponse.json(savedCrops, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch crops" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCrop = await prisma.crop.create({
      data: {
        name: body.name,
        time: body.time,
        yield: body.yield,
        frost: body.frost,
        drought: body.drought,
      },
    });
    return NextResponse.json(newCrop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save crop" }, { status: 500 });
  }
}