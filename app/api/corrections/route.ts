import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const correctionSchema = z.object({
  unit_id: z.string().min(1, 'Unit ID is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  evidence_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = correctionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // In a real app this would insert into the db
    const { error } = await supabase.from('corrections').insert({
      unit_id: result.data.unit_id,
      description: result.data.description,
      contact_email: result.data.contact_email || null,
      evidence_url: result.data.evidence_url || null,
      status: 'received',
    });

    if (error) {
      console.error('Failed to insert correction:', error);
      return NextResponse.json(
        { error: 'Failed to submit correction request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in corrections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
