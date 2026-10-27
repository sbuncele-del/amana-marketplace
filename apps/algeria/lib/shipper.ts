// Server-side adapter boundary. No order submission until durable storage,
// account fees, confirmation ownership and retry handling are verified.
import 'server-only';
const base='https://server.shipper.network/api/v1';
export async function shipperRead(resource:'products'|'countries'|'orders',query=''){
 const token=process.env.ALGERIA_SHIPPER_API_KEY;
 if(!token) throw new Error('Algeria Shipper integration is not configured');
 const response=await fetch(`${base}/${resource}${query}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});
 if(!response.ok) throw new Error(`Shipper request failed (${response.status})`);
 return response.json();
}
