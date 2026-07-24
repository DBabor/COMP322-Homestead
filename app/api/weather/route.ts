import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json({ error: 'Location parameter required' }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY; // Secret server-side env var
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    //Geocode location
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return NextResponse.json({ error: `Location "${location}" not found.` }, { status: 444 });
    }

    const { lat, lon, name, state } = geoData[0];

    //Fetch forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const forecastData = await forecastRes.json();

    return NextResponse.json({
      locationName: `${name}${state ? `, ${state}` : ''}`,
      list: forecastData.list,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}