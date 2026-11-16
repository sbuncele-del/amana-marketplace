'use client';
import {SharedCustomerChat} from '../../../packages/storefront/customer-chat';
import {SupportForm} from './support-form';
export function CustomerChat(){return <SharedCustomerChat supportForm={question=><SupportForm initialMessage={question} />} />;}
