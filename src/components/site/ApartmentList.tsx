import { Bed, MapPin, ArrowUpRight, Building2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { Apartment } from '@/lib/apartment-catalog';
export function ApartmentList({ apartments, onSelect, selectedId, buildingStatus }: { apartments: Apartment[]; onSelect?: (a: Apartment) => void; selectedId?: string; buildingStatus?: string }) {
 return <div className="divide-y divide-border border-y border-border">{apartments.map(a => <div key={a.id} className={`py-5 flex flex-wrap sm:flex-nowrap gap-4 items-center ${selectedId === a.id ? 'bg-accent/40' : ''}`}>
 <div className="w-16 h-16 shrink-0 bg-muted rounded-md flex items-center justify-center overflow-hidden">{a.image_url ? <img src={a.image_url} alt={a.name || a.code} className="h-full w-full object-cover"/> : <Building2 className="w-6 h-6 text-muted-foreground"/>}</div>
 <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-sans font-semibold">{a.name || `Apartment ${a.code}`}</h3><span className={`text-xs capitalize status-tag ${a.status === 'available' ? 'status-available' : 'status-unavailable'}`}>{a.status}</span></div>
 <p className="text-sm text-muted-foreground mt-1 flex gap-1 items-center"><MapPin className="w-3 h-3 shrink-0"/>{a.building_title} · {a.city}</p>
 <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2"><span>Unit {a.code}</span>{a.floor != null && <span>Floor {a.floor}</span>}{a.bedrooms != null && <span className="flex gap-1"><Bed className="w-3 h-3"/>{a.bedrooms} bedrooms</span>}{a.bathrooms != null && <span>{a.bathrooms} bathrooms</span>}{a.area_sqm != null && <span>{a.area_sqm} m²</span>}</div>{a.description && <p className="text-sm mt-2 text-muted-foreground">{a.description}</p>}</div>
 <div className="sm:text-right flex flex-wrap sm:block items-center gap-3"><div className="font-semibold text-sm">{a.currency} {Number(a.nightly_rate).toLocaleString()}<span className="font-normal text-xs text-muted-foreground"> / night</span></div>
 {onSelect ? <Button variant={selectedId === a.id ? 'default' : 'outline'} size="sm" className="sm:mt-2" disabled={a.status !== 'available' || buildingStatus !== 'available'} onClick={() => onSelect(a)}>{selectedId === a.id ? 'Selected' : 'Select apartment'}</Button> : <Button asChild variant="ghost" size="sm" className="sm:mt-2"><Link to="/properties/$slug" params={{slug: a.building_slug}}>View building<ArrowUpRight/></Link></Button>}</div>
 </div>)}</div>;
}
