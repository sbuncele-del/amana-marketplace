export async function POST(){
 // Deliberately fail closed until Tunisia persistence and provider submission
 // are implemented. Never report an order as accepted without durable storage.
 return Response.json({code:'TUNISIA_CHECKOUT_NOT_OPEN',message:'Tunisia orders are not open yet.'},{status:503});
}
