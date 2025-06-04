import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { tag } = await request.json();
    
    if (!tag) {
      return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
    }
    
    revalidateTag(tag);
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for tag: ${tag}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache revalidation error:', error);
    return NextResponse.json({ 
      error: 'Failed to revalidate cache' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST with { "tag": "cache-tag-name" } to revalidate cache' 
  });
} 