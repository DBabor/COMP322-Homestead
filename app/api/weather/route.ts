import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json({ error: 'Location parameter required' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();

    if (!geoRes.ok) {
      return NextResponse.json(
        { error: geoData.message || 'Failed to geocode location' },
        { status: geoRes.status }
      );
    }

    if (!Array.isArray(geoData) || geoData.length === 0) {
      return NextResponse.json({ error: `Location "${location}" not found.` }, { status: 404 });
    }

    const { lat, lon, name, state } = geoData[0];

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const forecastData = await forecastRes.json();

    if (!forecastRes.ok) {
      return NextResponse.json(
        { error: forecastData.message || 'Failed to fetch forecast' },
        { status: forecastRes.status }
      );
    }

    return NextResponse.json({
      locationName: `${name}${state ? `, ${state}` : ''}`,
      list: forecastData.list,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch weather data' }, { status: 500 });
  }
}