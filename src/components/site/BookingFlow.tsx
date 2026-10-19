import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/use-auth';
import { createBooking, startBookingPayment, PAYMENT_METHODS } from '@/lib/bookings.functions';
import type { Apartment } from '@/lib/apartment-catalog';
import { bookingNights } from '@/lib/booking-rules';
import { toast } from 'sonner';
export function BookingFlow({ propertyId, title, apartment, onComplete }: { propertyId: string; title: string; apartment: Apartment | null; onComplete?: () => void }) {
 const { user, profile } = useAuth();
 const create = useServerFn(createBooking); const pay = useServerFn(startBookingPayment);
 const [step,setStep] = useState(0); const [busy,setBusy] = useState(false); const [done,setDone] = useState(false); const [bookingId,setBookingId] = useState<string|null>(null);
 const [form,setForm] = useState({ full_name:'', email:'', phone:'', check_in:'', check_out:'', payment_method:'cash' as 'cash'|'momo'|'airtel'|'card', notes:'' });
 useEffect(() => {setForm(f => ({...f,full_name:f.full_name || profile?.full_name || '',email:f.email || user?.email || '',phone:f.phone || profile?.phone || ''}));},[user,profile]);
 useEffect(() => {setStep(0);setDone(false);setBookingId(null);},[apartment?.id]);
 const change = (key: keyof typeof form, value: string) => setForm(f => ({...f,[key]:value}));
 let nights=0; try {nights=bookingNights(form.check_in,form.check_out);} catch {}
 const amount=nights*Number(apartment?.nightly_rate || 0);
 async function submit() {
  if (!apartment) return;
  setBusy(true);
  try {
   const id = bookingId || (await create({data:{...form,property_id:propertyId,apartment_id:apartment.id}})).id;
   setBookingId(id);
   if(form.payment_method !== 'cash') {const result=await pay({data:{booking_id:id,redirect_url:window.location.origin+'/dashboard/buyer/bookings'}});window.location.assign(result.link);return;}
   setDone(true);onComplete?.();
  } catch(e) {toast.error(e instanceof Error ? e.message : 'Booking failed');} finally {setBusy(false);}
 }
 if (!apartment) return <p className="text-sm text-muted-foreground py-3">No apartment selected.</p>;
 if (!user) return <div className="space-y-3"><p className="text-sm text-muted-foreground">{apartment.code} · {title}</p><Button asChild className="w-full"><Link to="/auth">Sign in to book</Link></Button></div>;
 if(done) return <div className="space-y-3 py-3"><CheckCircle2 className="text-primary"/><h3 className="font-semibold font-sans">Booking requested</h3><p className="text-sm text-muted-foreground">{apartment.code} · {form.check_in} — {form.check_out}. Pay at reception; your stay begins after payment confirmation.</p><Button asChild variant="outline"><Link to="/dashboard/buyer/bookings">My bookings<ArrowRight/></Link></Button></div>;
 return <div className="space-y-4"><ol className="flex justify-between text-xs text-muted-foreground border-b border-border pb-3">{['Dates','Guest','Review'].map((s,i)=><li key={s} className={i===step?'text-foreground font-semibold':''}>{i+1}. {s}</li>)}</ol><p className="text-sm font-medium">{apartment.code} · {title}</p>
 {step===0 && <div className="grid grid-cols-2 gap-3"><label className="text-xs">Arrival<input aria-label="Arrival" type="date" min={new Date().toISOString().slice(0,10)} className="property-input mt-1" value={form.check_in} onChange={e=>change('check_in',e.target.value)}/></label><label className="text-xs">Departure<input aria-label="Departure" type="date" min={form.check_in || new Date().toISOString().slice(0,10)} className="property-input mt-1" value={form.check_out} onChange={e=>change('check_out',e.target.value)}/></label></div>}
 {step===1 && <div className="space-y-3">{(['full_name','email','phone'] as const).map(key=><label key={key} className="block text-xs">{key==='full_name'?'Full name':key==='email'?'Email':'Phone'}<input className="property-input mt-1" type={key==='email'?'email':key==='phone'?'tel':'text'} value={form[key]} onChange={e=>change(key,e.target.value)}/></label>)}</div>}
 {step===2 && <div className="space-y-3 text-sm"><div className="flex justify-between"><span>{nights} nights × {apartment.currency} {Number(apartment.nightly_rate).toLocaleString()}</span></div><div className="flex justify-between font-semibold border-y border-border py-3"><span>Total</span><span>{apartment.currency} {amount.toLocaleString()}</span></div><label className="block text-xs">Payment<select className="property-input mt-1" value={form.payment_method} onChange={e=>change('payment_method',e.target.value)}>{PAYMENT_METHODS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label><p className="text-xs text-muted-foreground">Reception confirms your payment before the stay clock starts.</p>{bookingId && <p className="text-xs text-muted-foreground">Reservation saved. Retry payment or choose cash at reception.</p>}</div>}
 <div className="flex gap-2">{step>0 && <Button variant="outline" size="icon" aria-label="Previous booking step" disabled={busy || !!bookingId} onClick={()=>setStep(s=>s-1)}><ArrowLeft/></Button>}<Button className="flex-1" disabled={busy} onClick={()=>{if(step===0){try{bookingNights(form.check_in,form.check_out);setStep(1);}catch(e){toast.error((e as Error).message);}}else if(step===1){if(form.full_name.trim().length<2||!/^\S+@\S+\.\S+$/.test(form.email)||form.phone.length<6){toast.error('Enter your name, email and phone.');return;}setStep(2);}else void submit();}}>{busy?<Loader2 className="animate-spin"/>:step===2?<CreditCard/>:<ArrowRight/>}{step===2?(form.payment_method==='cash'?'Request booking':'Book & pay'):'Continue'}</Button></div>
 </div>;
}
