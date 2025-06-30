export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return new Response(JSON.stringify({ error: 'Address query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'trial-app/1.0 (logistique.ac@gmail.com)',
        'Accept-Language': 'en'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Error fetching data from Nominatim' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'No results found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { lat, lon } = data[0];

    return new Response(JSON.stringify({ latitude: parseFloat(lat), longitude: parseFloat(lon) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
