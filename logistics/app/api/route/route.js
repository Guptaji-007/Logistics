export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat1 = searchParams.get('lat1');
  const lon1 = searchParams.get('lon1');
  const lat2 = searchParams.get('lat2');
  const lon2 = searchParams.get('lon2');

  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return new Response(JSON.stringify({ error: 'Missing coordinates' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const distanceInMeters = data.routes[0].distance;
      const durationInSeconds = data.routes[0].duration;
      return new Response(JSON.stringify({
        distanceKm: (distanceInMeters / 1000).toFixed(2),
        durationMin: (durationInSeconds / 60).toFixed(1)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'No route found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
