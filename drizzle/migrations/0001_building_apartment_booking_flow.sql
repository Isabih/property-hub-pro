ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS bathrooms integer, ADD COLUMN IF NOT EXISTS area_sqm numeric, ADD COLUMN IF NOT EXISTS nightly_rate numeric, ADD COLUMN IF NOT EXISTS description text, ADD COLUMN IF NOT EXISTS image_url text;
CREATE OR REPLACE FUNCTION public.list_building_apartments(building_id uuid DEFAULT NULL) RETURNS TABLE(id uuid, property_id uuid, code text, name text, floor integer, bedrooms integer, bathrooms integer, area_sqm numeric, nightly_rate numeric, description text, image_url text, status text, building_title text, building_slug text, address text, city text, district text, currency text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
SELECT a.id,a.property_id,a.code,a.name,a.floor,a.bedrooms,a.bathrooms,a.area_sqm,COALESCE(a.nightly_rate,p.price),a.description,a.image_url,CASE WHEN a.status <> 'available' THEN a.status WHEN EXISTS(SELECT 1 FROM public.bookings b WHERE b.apartment_id=a.id AND (b.status='pending' OR (b.status='confirmed' AND COALESCE(b.stay_end,b.check_out::timestamptz)>now()))) THEN 'booked' ELSE 'available' END,p.title,p.slug,p.address,p.city,p.district,p.currency FROM public.apartments a JOIN public.properties p ON p.id=a.property_id WHERE (building_id IS NULL OR p.id=building_id) AND p.status IN ('active','maintenance') AND NOT p.is_luxury AND p.property_type NOT IN ('luxury-apartment','penthouse','villa') ORDER BY p.title,a.code;
$$;
REVOKE ALL ON FUNCTION public.list_building_apartments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_building_apartments(uuid) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.validate_apartment_booking() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE unit public.apartments; building public.properties;
BEGIN
IF NEW.status='cancelled' THEN RETURN NEW; END IF;
SELECT * INTO building FROM public.properties WHERE id=NEW.property_id FOR UPDATE;
IF building.id IS NULL THEN RAISE EXCEPTION 'Building not found'; END IF;
IF NEW.check_out<=NEW.check_in THEN RAISE EXCEPTION 'Departure must be after arrival'; END IF;
IF TG_OP='INSERT' THEN
IF NEW.check_in<CURRENT_DATE THEN RAISE EXCEPTION 'Arrival cannot be in the past'; END IF;
IF building.status<>'active' OR building.listing_type<>'rent' THEN RAISE EXCEPTION 'This building is not available for booking'; END IF;
END IF;
IF EXISTS(SELECT 1 FROM public.apartments WHERE property_id=NEW.property_id) AND NEW.apartment_id IS NULL THEN RAISE EXCEPTION 'Choose an apartment in this building'; END IF;
IF NEW.apartment_id IS NOT NULL THEN
SELECT * INTO unit FROM public.apartments WHERE id=NEW.apartment_id FOR UPDATE;
IF unit.id IS NULL OR unit.property_id<>NEW.property_id THEN RAISE EXCEPTION 'Apartment does not belong to this building'; END IF;
IF unit.status NOT IN ('available','reserved') OR (TG_OP='INSERT' AND unit.status<>'available') THEN RAISE EXCEPTION 'Apartment is not available'; END IF;
IF EXISTS(SELECT 1 FROM public.bookings b WHERE b.apartment_id=NEW.apartment_id AND b.id<>NEW.id AND (b.status='pending' OR (b.status='confirmed' AND COALESCE(b.stay_end,b.check_out::timestamptz)>now()))) THEN RAISE EXCEPTION 'Apartment is already booked'; END IF;
END IF;
IF TG_OP='INSERT' THEN
NEW.nights=NEW.check_out-NEW.check_in;
NEW.nightly_rate=COALESCE(unit.nightly_rate,building.price);
IF NEW.nightly_rate<=0 THEN RAISE EXCEPTION 'Apartment price is not configured'; END IF;
NEW.amount=NEW.nights*NEW.nightly_rate; NEW.currency=building.currency;
NEW.status='pending'; NEW.payment_status='pending'; NEW.stay_start=NULL; NEW.stay_end=NULL; NEW.confirmed_by=NULL; NEW.confirmed_at=NULL;
END IF;
RETURN NEW;
END; $$;
CREATE TRIGGER enforce_apartment_booking BEFORE INSERT OR UPDATE OF apartment_id,property_id,status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.validate_apartment_booking();