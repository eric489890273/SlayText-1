// functions/index.ts
export async function onRequest(context) {
  return new Response('Hello from Worker!', {
    headers: { 'Content-Type': 'text/plain' }
  })
}
