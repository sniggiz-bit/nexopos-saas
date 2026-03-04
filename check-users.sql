SELECT email, role, LEFT(password, 10) as pass_prefix FROM public."User";
