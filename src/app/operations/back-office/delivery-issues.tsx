'use client';

import {useState, type FormEvent} from 'react';
import type {OpsRecord} from '@/lib/experience/culture';

const field = 'mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2';
const action = 'rounded-lg border border-stone-300 bg-white px-3 py-2 font-semibold disabled:opacity-50';

export function DeliveryIssues({orderId, issues, onSaved}: {
  orderId: string; issues: OpsRecord[] | null; onSaved: (message: string) => void;
}) {
  const [editing, setEditing] = useState<'new' | OpsRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    const fields = new FormData(event.currentTarget);
    const note = fields.get('note');
    const body = editing === 'new' ? {
      action: 'case', orderId, title: fields.get('title'), note, category: 'DELIVERY', priority: fields.get('priority'),
    } : {
      action: 'resolve', id: editing.id, version: editing.version, note, customerConfirmed: fields.has('confirmed'),
    };
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/experience/command', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the delivery issue.');
      onSaved(editing === 'new' ? 'Delivery issue logged and assigned to you.' : 'Delivery issue resolved.');
      setEditing(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the delivery issue.');
    } finally {
      setBusy(false);
    }
  }

  const open = issues?.filter(issue => issue.status !== 'RESOLVED');
  return <section className="my-3 w-full space-y-3 rounded-xl border border-stone-200 bg-white p-4 text-sm" aria-label="Delivery follow-up">
    <h3>Delivery follow-up</h3>
    {open?.map(issue => <article key={issue.id} className="space-y-2 border-t border-stone-200 pt-3">
      <p className="font-semibold">{String(issue.data.title || 'Delivery issue')}</p>
      <p className="text-stone-600">{issue.reference} · {issue.status.toLowerCase().replaceAll('_', ' ')} · {String(issue.data.priority || 'normal').toLowerCase()}</p>
      {typeof issue.data.description === 'string' && <p className="whitespace-pre-wrap break-words">{issue.data.description}</p>}
      {!editing && <button className={action} onClick={() => {setEditing(issue); setError('');}}>Resolve issue</button>}
    </article>)}
    {!editing ? <button className={action} onClick={() => {setEditing('new'); setError('');}}>Log delivery issue</button>
      : <form className="space-y-3" onSubmit={submit}>
        {editing === 'new' && <>
          <label className="block">Issue<input name="title" minLength={3} maxLength={160} placeholder="e.g. Courier missed the delivery" className={field} required autoFocus /></label>
          <label className="block">Priority<select name="priority" className={field}><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        </>}
        <label className="block">{editing === 'new' ? 'Details and next step' : 'Resolution'}<textarea name="note" minLength={editing === 'new' ? 3 : 10} maxLength={3000} className={field} required /></label>
        {editing !== 'new' && <label className="flex gap-2"><input type="checkbox" name="confirmed" required />I confirmed the resolution with the customer.</label>}
        {error && <p className="text-red-800" role="alert">{error}</p>}
        <div className="flex gap-2">
          <button className="rounded-lg bg-[#d4252d] px-3 py-2 font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? 'Saving…' : editing === 'new' ? 'Save issue' : 'Confirm resolution'}</button>
          <button type="button" className={action} disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
        </div>
      </form>}
  </section>;
}
