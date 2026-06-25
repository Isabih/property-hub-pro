REVOKE EXECUTE ON FUNCTION public.notify_on_service_request() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_service_request() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_service_request() TO service_role;

REVOKE EXECUTE ON FUNCTION public.notify_staff_on_property_change() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_staff_on_property_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.notify_staff_on_property_change() TO service_role;