export function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or specify your frontend URL
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  return response;
}

export function createResponse(data: any, status: number = 200): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return addCorsHeaders(response);
}

export function handleOptions(): Response {
  const response = new Response(null, { status: 204 });
  return addCorsHeaders(response);
}
