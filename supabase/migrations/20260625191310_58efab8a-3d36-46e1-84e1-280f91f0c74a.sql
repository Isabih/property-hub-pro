REVOKE ALL ON FUNCTION public.notify_on_service_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_on_service_request() FROM anon;
REVOKE ALL ON FUNCTION public.notify_on_service_request() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_service_request() TO service_role;

REVOKE ALL ON FUNCTION public.notify_staff_on_property_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_staff_on_property_change() FROM anon;
REVOKE ALL ON FUNCTION public.notify_staff_on_property_change() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.notify_staff_on_property_change() TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;