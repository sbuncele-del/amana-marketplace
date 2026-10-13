export const experiencePrinciples = [
 {name:'Dignity',promise:'Every person matters.',practice:'Use the customer’s preferred name. Listen without interruption. Never make someone prove they deserve help.'},
 {name:'Respect',promise:'Make the next step clear.',practice:'Ask before calling. Explain costs, timings and choices plainly. Respect a request not to be contacted.'},
 {name:'Humility',promise:'Own the problem.',practice:'Acknowledge what happened without blaming the customer, colleague, supplier or courier. One person owns the next step.'},
 {name:'Kindness',promise:'Reduce the customer’s effort.',practice:'Carry the history forward. Do not ask people to repeat their story. Offer practical help and a time for the next update.'},
 {name:'Excellence',promise:'Keep the promise, then improve.',practice:'Record commitments, confirm outcomes and learn from each delivery. A closed case needs a real resolution.'},
];
export const servicePlaybook = [
 {stage:'Before the order',standard:'Help people choose confidently.',actions:['Explain options and compatibility clearly.','Show the delivered total before payment.','Capture their preferred contact channel.']},
 {stage:'While we fulfil',standard:'Never leave the customer wondering.',actions:['Assign an accountable owner.','Record the promised delivery or update time.','Escalate a risk before a promise is missed.']},
 {stage:'Supplier handover',standard:'Protect the customer’s promise at the warehouse.',actions:['Confirm stock with Perfect Dealz before committing to the order; stock is held at an external warehouse.','Buy at the supplier’s website prices and include delivery in the approved customer quote.','Place and pay the supplier order on their website, using the customer’s approved delivery address.','Request blank/no-price packaging and record the supplier order reference and request in the fulfilment milestone note.','Check the supplier’s delivery and returns terms before promising a specific timing or remedy.']},
 {stage:'After delivery',standard:'A delivered parcel is the beginning of care.',actions:['Create a human follow-up task when the customer has agreed.','Check delivery, the product and how the person was treated.','Turn an unresolved concern into an owned service case.']},
 {stage:'When something goes wrong',standard:'Make the recovery easier than the complaint.',actions:['Acknowledge the concern with kindness.','Agree the next action and update time.','Record the resolution and the customer’s confirmation.']},
 {stage:'For our people',standard:'Care for the people who care for customers.',actions:['Monitor team workloads and unblock colleagues.','Coach from real examples, without public blame.','Reward honesty, ownership and meaningful resolution.']},
];
export const followUpScript = {
 opening:'Hello [preferred name], this is [your name] from Amana. I’m checking that your delivery went smoothly and that you feel well looked after. Is this a convenient moment for a short check-in?',
 questions:['Did your delivery arrive as expected, and were you kept informed?','Is the product working as you expected, or can we help you get started?','Did you feel treated with care and respect?','What could we make easier or better for you?'],
 recovery:'Thank you for telling me. I will own the next step and explain what happens next. You won’t need to repeat this to another person.',
 closing:'Thank you for your time. We appreciate your trust. I’ve recorded what we agreed, including when you will hear from us next.',
};
export const statuses={ORDER:['ENQUIRY','QUOTED','CONFIRMED','PAID','FULFILMENT','SHIPPED','DELIVERED','CANCELLED'],CASE:['OPEN','IN_PROGRESS','WAITING_CUSTOMER','WAITING_PARTNER','RESOLVED'],TASK:['OPEN','IN_PROGRESS','DONE','DECLINED']} as const;
export type RecordKind=keyof typeof statuses;
export type OpsRecord={id:string;kind:RecordKind;reference:string;orderId:string|null;teamId:string|null;ownerId:string|null;status:string;dueAt:string|null;data:Record<string,unknown>;version:number;createdAt:string;updatedAt:string};
export type OpsTeam={id:string;name:string;country:string;parentId:string|null;capacity:number;members:number;openResponsibilities?:number;unassigned?:number;overdue?:number};
