import { addPrice } from '@/app/(main)/add-product/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await addPrice(data);

    if (result.status === 'error') {
      return NextResponse.json({ message: result.message }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("API Error in /api/add-price: ", e);
    return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
