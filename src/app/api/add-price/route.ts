
import { addPrice } from '@/app/(main)/add-product/actions';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await addPrice(data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error in /api/add-price:', error);
    if (error instanceof Error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: 'error', message: 'An unknown server error occurred.' }, { status: 500 });
  }
}

    