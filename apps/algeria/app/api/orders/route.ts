export async function POST(){
 // Deliberately fail closed until Algeria persistence and provider submission
 // are implemented. Never report an order as accepted without durable storage.
 return Response.json({code:'ALGERIA_CHECKOUT_NOT_OPEN',message:'Algeria orders are not open yet.'},{status:503});
}
