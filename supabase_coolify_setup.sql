--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6


DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Public can update portal_clicks" ON public.portal_clicks;
DROP POLICY IF EXISTS "Public can update daily_visitors" ON public.daily_visitors;
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read portal_items" ON public.portal_items;
DROP POLICY IF EXISTS "Public can read portal_clicks" ON public.portal_clicks;
DROP POLICY IF EXISTS "Public can read hero_sliders" ON public.hero_sliders;
DROP POLICY IF EXISTS "Public can read daily_visitors" ON public.daily_visitors;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read brand_settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Public can insert portal_clicks" ON public.portal_clicks;
DROP POLICY IF EXISTS "Public can insert daily_visitors" ON public.daily_visitors;
DROP POLICY IF EXISTS "Only admins can manage role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Anyone can read role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admins can read activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can manage portal_items" ON public.portal_items;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admin/Editor can view activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admin/Editor can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin/Editor can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin/Editor can update portal_items" ON public.portal_items;
DROP POLICY IF EXISTS "Admin/Editor can update hero_sliders" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin/Editor can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admin/Editor can update brand_settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admin/Editor can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin/Editor can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin/Editor can insert portal_items" ON public.portal_items;
DROP POLICY IF EXISTS "Admin/Editor can insert hero_sliders" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin/Editor can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin/Editor can insert brand_settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Admin/Editor can insert activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Admin/Editor can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin/Editor can delete site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin/Editor can delete portal_items" ON public.portal_items;
DROP POLICY IF EXISTS "Admin/Editor can delete hero_sliders" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin/Editor can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admin/Editor can delete brand_settings" ON public.brand_settings;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portal_clicks DROP CONSTRAINT IF EXISTS portal_clicks_portal_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.site_settings DROP CONSTRAINT IF EXISTS site_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_page_key;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.portal_items DROP CONSTRAINT IF EXISTS portal_items_pkey;
ALTER TABLE IF EXISTS ONLY public.portal_clicks DROP CONSTRAINT IF EXISTS portal_clicks_pkey;
ALTER TABLE IF EXISTS ONLY public.hero_sliders DROP CONSTRAINT IF EXISTS hero_sliders_pkey;
ALTER TABLE IF EXISTS ONLY public.daily_visitors DROP CONSTRAINT IF EXISTS daily_visitors_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.brand_settings DROP CONSTRAINT IF EXISTS brand_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.site_settings;
DROP TABLE IF EXISTS public.portal_items;
DROP TABLE IF EXISTS public.portal_clicks;
DROP TABLE IF EXISTS public.hero_sliders;
DROP TABLE IF EXISTS public.daily_visitors;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.brand_settings;
DROP VIEW IF EXISTS public.admin_user_profiles;
DROP VIEW IF EXISTS public.activity_logs_with_users;
DROP TABLE IF EXISTS public.activity_logs;
DROP FUNCTION IF EXISTS public.update_role_permission(p_role text, p_page text, p_can_view boolean, p_can_create boolean, p_can_update boolean, p_can_delete boolean);
DROP FUNCTION IF EXISTS public.remove_user_role(p_user_id uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.increment_visitor_count();
DROP FUNCTION IF EXISTS public.increment_portal_click(p_portal_id uuid);
DROP FUNCTION IF EXISTS public.has_permission(p_page text, p_action text);
DROP FUNCTION IF EXISTS public.has_admin_or_editor_role();
DROP FUNCTION IF EXISTS public.get_role_permissions(p_role text);
DROP TABLE IF EXISTS public.role_permissions;
DROP FUNCTION IF EXISTS public.get_admin_users();
DROP FUNCTION IF EXISTS public.delete_admin_user(p_user_id uuid);
DROP FUNCTION IF EXISTS public.create_or_assign_admin(p_email text, p_password text, p_role text);
DROP FUNCTION IF EXISTS public.assign_user_role(p_email text, p_role text);
DROP FUNCTION IF EXISTS public.assign_role_by_email(p_email text, p_role text);
DROP FUNCTION IF EXISTS public.admin_update_password(p_email text, p_password text);

-- =============================================
-- Ensure default Admin Account in auth.users
-- Email: jupriekapratama@gmail.com
-- Pass: Admin123!
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    v_user_id uuid := '98cdae46-c20a-462b-8457-007bd2076d45';
BEGIN
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jupriekapratama@gmail.com');
    DELETE FROM auth.users WHERE email = 'jupriekapratama@gmail.com';
    DELETE FROM auth.users WHERE id = v_user_id;

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        'jupriekapratama@gmail.com',
        crypt('Admin123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Super Admin"}',
        false,
        now(),
        now()
    );

    INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id::text,
        v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id, 'jupriekapratama@gmail.com')::jsonb,
        'email',
        now(),
        now(),
        now()
    );
END $$;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--




--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--



--
-- Name: admin_update_password(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.admin_update_password(p_email text, p_password text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User tidak ditemukan';
    END IF;

    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf', 10)),
        updated_at = now()
    WHERE id = v_user_id;
END;
$$;


ALTER FUNCTION public.admin_update_password(p_email text, p_password text) OWNER TO postgres;

--
-- Name: assign_role_by_email(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.assign_role_by_email(p_email text, p_role text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna dengan email % tidak ditemukan di sistem. Pastikan mereka sudah mendaftar (Sign Up) terlebih dahulu.', p_email;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;


ALTER FUNCTION public.assign_role_by_email(p_email text, p_role text) OWNER TO postgres;

--
-- Name: assign_user_role(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.assign_user_role(p_email text, p_role text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User dengan email % tidak ditemukan', p_email;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;


ALTER FUNCTION public.assign_user_role(p_email text, p_role text) OWNER TO postgres;

--
-- Name: create_or_assign_admin(text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_or_assign_admin(p_email text, p_password text, p_role text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Check if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        -- Create new user
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
            role, confirmation_token
        )
        VALUES (
            v_user_id, '00000000-0000-0000-0000-000000000000', p_email, 
            crypt(p_password, gen_salt('bf')), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
            'authenticated', ''
        );

        INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id::text,
            v_user_id,
            format('{"sub":"%s","email":"%s"}', v_user_id, p_email)::jsonb,
            'email',
            now(),
            now(),
            now()
        );
    ELSE
        -- If user exists but is trying to create with a new password, we optionally update it.
        -- But for now we just assign the role.
    END IF;

    -- Assign role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, p_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;


ALTER FUNCTION public.create_or_assign_admin(p_email text, p_password text, p_role text) OWNER TO postgres;

--
-- Name: delete_admin_user(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_admin_user(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Prevent deleting yourself
    IF auth.uid() = p_user_id THEN
        RAISE EXCEPTION 'Anda tidak bisa menghapus akun Anda sendiri.';
    END IF;

    -- Delete from user_roles
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
    
    -- Delete from auth.identities
    DELETE FROM auth.identities WHERE user_id = p_user_id;
    
    -- Delete from auth.sessions (force logout)
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
    
    -- Delete from auth.refresh_tokens
    DELETE FROM auth.refresh_tokens WHERE user_id::uuid = p_user_id;
    
    -- Delete from auth.users (permanent)
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION public.delete_admin_user(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_admin_users(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_admin_users() RETURNS TABLE(user_id uuid, email character varying, role text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        u.id as user_id, 
        u.email::VARCHAR, 
        ur.role, 
        ur.created_at
    FROM auth.users u
    JOIN public.user_roles ur ON u.id = ur.user_id;
END;
$$;


ALTER FUNCTION public.get_admin_users() OWNER TO postgres;



--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role text NOT NULL,
    page text NOT NULL,
    can_view boolean DEFAULT false,
    can_create boolean DEFAULT false,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: get_role_permissions(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_role_permissions(p_role text) RETURNS SETOF public.role_permissions
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    RETURN QUERY SELECT * FROM public.role_permissions WHERE role = p_role ORDER BY page;
END;
$$;


ALTER FUNCTION public.get_role_permissions(p_role text) OWNER TO postgres;

--
-- Name: has_admin_or_editor_role(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_admin_or_editor_role() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    );
END;
$$;


ALTER FUNCTION public.has_admin_or_editor_role() OWNER TO postgres;

--
-- Name: has_permission(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_permission(p_page text, p_action text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Get user's role
    SELECT role INTO v_role FROM public.user_roles WHERE user_id = auth.uid();
    
    -- Admin always has full access
    IF v_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Check specific permission for the role
    RETURN EXISTS (
        SELECT 1 FROM public.role_permissions rp
        WHERE rp.role = v_role 
          AND rp.page = p_page
          AND CASE p_action
            WHEN 'view' THEN rp.can_view
            WHEN 'create' THEN rp.can_create
            WHEN 'update' THEN rp.can_update
            WHEN 'delete' THEN rp.can_delete
            ELSE false
          END = true
    );
END;
$$;


ALTER FUNCTION public.has_permission(p_page text, p_action text) OWNER TO postgres;

--
-- Name: increment_portal_click(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_portal_click(p_portal_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.portal_clicks (portal_id, date, clicks)
    VALUES (p_portal_id, CURRENT_DATE, 1)
    ON CONFLICT (portal_id, date) DO UPDATE
    SET clicks = portal_clicks.clicks + 1;
END;
$$;


ALTER FUNCTION public.increment_portal_click(p_portal_id uuid) OWNER TO postgres;

--
-- Name: increment_visitor_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_visitor_count() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Increment site_settings overall counter
    UPDATE public.site_settings SET stats_visitors = stats_visitors + 1 WHERE id = 1;
    
    -- Increment daily visitors
    INSERT INTO public.daily_visitors (date, count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (date) DO UPDATE
    SET count = daily_visitors.count + 1;
END;
$$;


ALTER FUNCTION public.increment_visitor_count() OWNER TO postgres;

--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$;


ALTER FUNCTION public.is_admin() OWNER TO postgres;

--
-- Name: remove_user_role(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_user_role(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Prevent removing yourself
    IF auth.uid() = p_user_id THEN
        RAISE EXCEPTION 'Anda tidak bisa menghapus akses Anda sendiri.';
    END IF;

    DELETE FROM public.user_roles WHERE user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.remove_user_role(p_user_id uuid) OWNER TO postgres;

--
-- Name: update_role_permission(text, text, boolean, boolean, boolean, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_role_permission(p_role text, p_page text, p_can_view boolean, p_can_create boolean, p_can_update boolean, p_can_delete boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    INSERT INTO public.role_permissions (role, page, can_view, can_create, can_update, can_delete, updated_at)
    VALUES (p_role, p_page, p_can_view, p_can_create, p_can_update, p_can_delete, NOW())
    ON CONFLICT (role, page) DO UPDATE SET
        can_view = EXCLUDED.can_view,
        can_create = EXCLUDED.can_create,
        can_update = EXCLUDED.can_update,
        can_delete = EXCLUDED.can_delete,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION public.update_role_permission(p_role text, p_page text, p_can_view boolean, p_can_create boolean, p_can_update boolean, p_can_delete boolean) OWNER TO postgres;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    target text NOT NULL,
    details text,
    type text DEFAULT 'info'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT activity_logs_type_check CHECK ((type = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])))
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_with_users; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.activity_logs_with_users AS
 SELECT a.id,
    a.user_id,
    a.action,
    a.target,
    a.type,
    a.created_at,
    au.email AS user_email
   FROM (public.activity_logs a
     LEFT JOIN auth.users au ON ((a.user_id = au.id)));


ALTER VIEW public.activity_logs_with_users OWNER TO postgres;

--
-- Name: admin_user_profiles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.admin_user_profiles AS
 SELECT id,
    email,
    created_at,
    last_sign_in_at
   FROM auth.users;


ALTER VIEW public.admin_user_profiles OWNER TO postgres;

--
-- Name: brand_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_settings (
    id integer DEFAULT 1 NOT NULL,
    company_name text DEFAULT 'PT. Solusi Maju Bersama'::text,
    portal_name text DEFAULT 'Solusi Maju'::text,
    company_website text DEFAULT 'www.solusimaju.com'::text,
    contact_phone text DEFAULT '+62 812-3456-7890'::text,
    company_address text DEFAULT 'Jakarta'::text,
    contact_email text DEFAULT 'info@solusimaju.com'::text,
    facebook_url text,
    twitter_url text,
    linkedin_url text,
    instagram_url text,
    stats_visitors integer DEFAULT 65200,
    stats_bg_image text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT brand_settings_single_row CHECK ((id = 1))
);


ALTER TABLE public.brand_settings OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    icon text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: daily_visitors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_visitors (
    date date DEFAULT CURRENT_DATE NOT NULL,
    count integer DEFAULT 1
);


ALTER TABLE public.daily_visitors OWNER TO postgres;

--
-- Name: hero_sliders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hero_sliders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hero_sliders OWNER TO postgres;

--
-- Name: portal_clicks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portal_clicks (
    portal_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    clicks integer DEFAULT 1
);


ALTER TABLE public.portal_clicks OWNER TO postgres;

--
-- Name: portal_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portal_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    url text NOT NULL,
    preview_gif text,
    thumbnail text,
    description text,
    tags text[],
    client_or_type text NOT NULL,
    year text,
    custom_image text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sort_order integer DEFAULT 0,
    CONSTRAINT portal_items_client_or_type_check CHECK ((client_or_type = ANY (ARRAY['Client'::text, 'Personal'::text, 'Curated'::text])))
);


ALTER TABLE public.portal_items OWNER TO postgres;

--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    id integer DEFAULT 1 NOT NULL,
    portal_name text DEFAULT 'My Portal'::text NOT NULL,
    hero_title text DEFAULT 'Welcome to the Portal'::text NOT NULL,
    hero_subtitle text,
    hero_image_url text,
    contact_email text,
    updated_at timestamp with time zone DEFAULT now(),
    explore_title text,
    explore_subtitle text,
    explore_image_url text,
    stats_bg_image text,
    company_name text,
    company_website text,
    contact_phone text,
    company_address text,
    facebook_url text,
    twitter_url text,
    linkedin_url text,
    instagram_url text,
    tiktok_url text,
    logo_url text,
    favicon_url text,
    CONSTRAINT site_settings_single_row CHECK ((id = 1))
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text, 'user'::text])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.activity_logs VALUES ('c50d6afe-1f28-4922-ac99-e9f6aaa3d815', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal CCTV MKN', NULL, 'success', '2026-08-21 01:50:21.79752+00');
INSERT INTO public.activity_logs VALUES ('016b94ab-8d38-4e94-9bd8-5d205cd7f7ac', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal Summary Report MKN', NULL, 'success', '2026-08-21 01:50:45.677509+00');
INSERT INTO public.activity_logs VALUES ('270c8dd3-a0b9-4772-9d04-90e0714479b7', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal MSD Refresh ', NULL, 'success', '2026-08-21 01:51:05.913491+00');
INSERT INTO public.activity_logs VALUES ('db53e468-a45e-4999-a1f1-d944d97104f0', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal HSES KPC', NULL, 'success', '2026-08-21 01:51:24.029861+00');
INSERT INTO public.activity_logs VALUES ('554b0f4a-308d-43a8-9130-90fe95080794', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal MKN ERP Approval Worksheet', NULL, 'success', '2026-08-21 01:51:42.799414+00');
INSERT INTO public.activity_logs VALUES ('10f45bf6-abbb-4ded-a38b-e9e045dbd9cd', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal ERP MKN', NULL, 'success', '2026-08-21 01:51:57.691404+00');
INSERT INTO public.activity_logs VALUES ('66fa445c-e1f0-4250-8d76-a17b7d255814', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal MKN SMART', NULL, 'success', '2026-08-21 01:52:15.038416+00');
INSERT INTO public.activity_logs VALUES ('d8a073d3-1cac-4a93-afed-685370d03c13', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal PM Dashboard', NULL, 'success', '2026-08-21 01:52:39.201394+00');
INSERT INTO public.activity_logs VALUES ('ce9cfc9b-90b5-4927-99a1-ba1c375b95b4', '98cdae46-c20a-462b-8457-007bd2076d45', 'membuat', 'Portal Zum Iot', NULL, 'success', '2026-08-21 01:53:00.996763+00');
INSERT INTO public.activity_logs VALUES ('b6b904bf-3e53-4b3b-9ae6-bcc67c8dbc8a', '98cdae46-c20a-462b-8457-007bd2076d45', 'memperbarui', 'Portal PM Dashboard', NULL, 'info', '2026-08-24 01:09:46.39497+00');
INSERT INTO public.activity_logs VALUES ('65682920-7d08-4192-bcd0-036b8fe632a0', '98cdae46-c20a-462b-8457-007bd2076d45', 'memperbarui', 'Portal Zum Iot', NULL, 'info', '2026-10-13 01:46:47.84393+00');
INSERT INTO public.activity_logs VALUES ('76951aa3-9bd9-4a06-8246-94b7159194ee', '98cdae46-c20a-462b-8457-007bd2076d45', 'memperbarui', 'Portal MKN SMART', NULL, 'info', '2026-10-13 01:47:14.432078+00');
INSERT INTO public.activity_logs VALUES ('8fe3b91f-205a-4fac-a497-7615413fe29a', '98cdae46-c20a-462b-8457-007bd2076d45', 'memperbarui', 'Portal ERP MKN', NULL, 'info', '2026-10-13 01:47:26.335456+00');
INSERT INTO public.activity_logs VALUES ('31967324-f015-4cdf-9e3d-a1dad9faeaf2', '98cdae46-c20a-462b-8457-007bd2076d45', 'memperbarui', 'Portal MKN ERP Approval Worksheet', NULL, 'info', '2026-10-13 01:47:34.91846+00');


--
-- Data for Name: brand_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.brand_settings VALUES (1, 'PT. Solusi Maju Bersama', 'Solusi Maju', 'www.solusimaju.com', '+62 812-3456-7890', 'Jakarta', 'info@solusimaju.com', NULL, NULL, NULL, NULL, 65200, NULL, '2026-08-21 01:32:03.542344+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories VALUES ('14afefa4-f69b-4404-8ec2-e542551e481b', 'Operasional', 'Gear', true, 0, '2026-08-21 01:32:03.672735+00', '2026-08-21 01:32:03.672735+00');
INSERT INTO public.categories VALUES ('d0176926-1a39-4298-8b56-2624593546a5', 'Keamanan', 'ShieldCheck', true, 0, '2026-08-21 01:32:03.672735+00', '2026-08-21 01:32:03.672735+00');
INSERT INTO public.categories VALUES ('6b050d71-9f0a-4f97-9b76-74c926fcbaf3', 'Dokumen', 'FileText', true, 0, '2026-08-21 01:32:03.672735+00', '2026-08-21 01:32:03.672735+00');
INSERT INTO public.categories VALUES ('515ec8cc-7b89-44a7-946d-3cf0cbea15c4', 'GPS', 'CarProfile', true, 1, '2026-08-21 01:49:21.786958+00', '2026-08-21 01:49:21.786958+00');
INSERT INTO public.categories VALUES ('b9c8d123-8366-4d73-913f-b338c8331e9c', 'Pelatihan', 'BookOpen', true, 2, '2026-08-21 01:49:45.874963+00', '2026-08-21 01:49:45.874963+00');
INSERT INTO public.categories VALUES ('5aedcc37-619c-4d28-9a89-78babbd56044', 'Manajemen', 'Briefcase', true, 3, '2026-08-21 01:49:55.689993+00', '2026-08-21 01:49:55.689993+00');


--
-- Data for Name: daily_visitors; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: hero_sliders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.hero_sliders VALUES ('bc16e529-e4a0-49ce-affe-8a87a3de60cc', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787279432365_0.15219148470205202.jpeg', 0, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('fa3405db-e1ba-49cf-9846-47282331dd27', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536865866_0.5613519345027485.png', 1, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('e6bc228f-78b6-45e9-8fce-848064535d0d', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536865959_0.772979926839637.png', 2, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('2b7d1e8e-5956-4d14-ab6c-761e61bc68e1', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873345_0.3214559650290064.jpeg', 3, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('3ca86dae-ef08-44bb-8cd1-90c85c27a54a', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873409_0.9034206386906943.jpeg', 4, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('d45d0cbb-afa2-46d7-aa3d-659d9c7a40e3', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873452_0.6898071701735184.jpeg', 5, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('ef05814d-0af0-4cf8-979d-04e252a3e602', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873492_0.3220528509266848.jpeg', 6, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('cc349869-4ab3-44a7-a4e2-aa800579cc44', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873525_0.2973995747557677.jpeg', 7, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('23a580c9-9ded-4c65-90a6-e58d20f13b4c', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873556_0.8536441618442416.jpeg', 8, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('d1d9de87-5bdc-48e6-acaa-03281b913c06', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873588_0.06877720071929061.jpeg', 9, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('0222e0ce-129c-478c-b4d8-61b0b3d6a3c1', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873621_0.45624473695861023.jpeg', 10, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('61b62af0-f756-4424-ac55-8b648d68959c', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873656_0.3326398058080633.jpeg', 11, '2026-08-24 02:01:14.920783+00');
INSERT INTO public.hero_sliders VALUES ('c65fb3a6-d861-4fb9-80bb-520069957394', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/sliders/slider_1787536873684_0.12279497084842173.jpeg', 12, '2026-08-24 02:01:14.920783+00');


--
-- Data for Name: portal_clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.portal_clicks VALUES ('c39dab29-452a-4a60-86d2-d7bcedf021fd', '2026-08-24', 1);
INSERT INTO public.portal_clicks VALUES ('86a41954-2fe1-48df-910b-373ec6deb235', '2026-10-13', 1);
INSERT INTO public.portal_clicks VALUES ('8531a5a3-ac97-485c-bc9b-7e1bc6437bc6', '2026-10-13', 1);


--
-- Data for Name: portal_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.portal_items VALUES ('ec69ef6b-8c8a-4796-acdd-32b7a7318afe', 'MSD Refresh ', 'Manajemen', 'https://atdportal.netlify.app/', NULL, NULL, 'MSD Refresh Kimper ', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.6963808394216067.png', '2026-08-21 01:51:05.901309+00', '2026-08-21 01:51:05.901309+00', 7);
INSERT INTO public.portal_items VALUES ('8531a5a3-ac97-485c-bc9b-7e1bc6437bc6', 'Summary Report MKN', 'Operasional', 'https://multikontrolnusantara.sharepoint.com/:x:/s/MKNSangatta/IQAuV4N0j6uURazdTO4AylRCAaslrrUWsCylN71-LGFIBSs?e=zidlLT', NULL, NULL, 'Summary Report MKN Sharepoint', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.3732457206803652.png', '2026-08-21 01:50:45.668193+00', '2026-08-21 01:50:45.668193+00', 4);
INSERT INTO public.portal_items VALUES ('437880fe-3478-466d-b62e-a10efcc58e73', 'CCTV MKN', 'Keamanan', 'http://10.80.16.29/', NULL, NULL, 'CCTV Internal MKN', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.3023037463927831.png', '2026-08-21 01:50:21.780067+00', '2026-08-21 01:50:21.780067+00', 6);
INSERT INTO public.portal_items VALUES ('8f051b7b-5d00-4e79-8eec-7ae6da841349', 'HSES KPC', 'Pelatihan', 'https://kpc-hsesclass.azurewebsites.net/', NULL, NULL, 'HSES KPC Daftar Training', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.36475183840563274.png', '2026-08-21 01:51:24.020147+00', '2026-08-21 01:51:24.020147+00', 8);
INSERT INTO public.portal_items VALUES ('c39dab29-452a-4a60-86d2-d7bcedf021fd', 'PM Dashboard', 'Operasional', 'https://pm.mknops.web.id/', NULL, NULL, 'PM Dashboard', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.9144227650151567.png', '2026-08-21 01:52:39.19016+00', '2026-08-21 01:52:39.19016+00', 0);
INSERT INTO public.portal_items VALUES ('a3641baf-f69d-47ae-a6a2-5da9eaeb1e89', 'Zum Iot', 'GPS', 'https://gps.zumiot.id/Live', NULL, NULL, 'GPS LV MKN Site', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.7372980126646415.png', '2026-08-21 01:53:00.986854+00', '2026-08-21 01:53:00.986854+00', 5);
INSERT INTO public.portal_items VALUES ('05404fb9-289f-4df1-959a-cd036b275a61', 'MKN SMART', 'Operasional', 'https://mknsmart.my.id', NULL, NULL, 'MKN SMART', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.25310790842436015.png', '2026-08-21 01:52:15.026821+00', '2026-08-21 01:52:15.026821+00', 1);
INSERT INTO public.portal_items VALUES ('86a41954-2fe1-48df-910b-373ec6deb235', 'ERP MKN', 'Operasional', 'https://erp-mkn.starbit.id', NULL, NULL, 'Halaman ERP MKN', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.5235042312196846.png', '2026-08-21 01:51:57.680089+00', '2026-08-21 01:51:57.680089+00', 2);
INSERT INTO public.portal_items VALUES ('24712a0a-3206-487e-b990-c6df65af0725', 'MKN ERP Approval Worksheet', 'Operasional', 'https://mkn-erp.my.id/', NULL, NULL, 'MKN ERP Approval Worksheet', NULL, 'Client', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/portals/customIcon_0.29141620091521003.png', '2026-08-21 01:51:42.783892+00', '2026-08-21 01:51:42.783892+00', 3);


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.role_permissions VALUES ('4a65b270-dccb-4532-9bdb-73e60f750875', 'editor', 'dashboard', true, false, false, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.542005+00');
INSERT INTO public.role_permissions VALUES ('44a23ffa-11ce-4ca5-a34e-2f8fd33dfb70', 'editor', 'portals', true, true, true, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.553657+00');
INSERT INTO public.role_permissions VALUES ('d9d4dc14-a051-491e-9de9-ef91f55c149b', 'editor', 'categories', true, true, true, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.563667+00');
INSERT INTO public.role_permissions VALUES ('74df10d1-8781-46ee-9c40-629c75fcd316', 'editor', 'appearance', true, false, true, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.571137+00');
INSERT INTO public.role_permissions VALUES ('6c33ad3c-1dd3-46f9-82ba-b81ce7351faf', 'editor', 'sliders', true, false, true, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.579418+00');
INSERT INTO public.role_permissions VALUES ('5bb8ab1c-5b89-4c6e-ac59-171c9bf05b4c', 'editor', 'users', false, false, false, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.586809+00');
INSERT INTO public.role_permissions VALUES ('96654f8e-8cc2-424b-a047-b478328e594f', 'editor', 'permissions', false, false, false, false, '2026-08-21 01:53:19.594746+00', '2026-08-21 01:53:19.594746+00');
INSERT INTO public.role_permissions VALUES ('280d1c7e-f9fc-4d07-af47-591997f9c148', 'editor', 'activity', true, false, false, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.601382+00');
INSERT INTO public.role_permissions VALUES ('567e3b72-b765-4402-b51a-ca7ac9c2f613', 'editor', 'profile', true, false, true, false, '2026-08-21 01:32:03.990839+00', '2026-08-21 01:53:19.607564+00');


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.site_settings VALUES (1, 'MKN Portal ', 'Sinergi Terintegrasi', 'Satu portal untuk semua sistem. Pilih layanan yang ingin Anda akses.', NULL, 'contact@mkncorp.com', '2026-08-21 01:32:03.431243+00', 'Pusat Layanan & Aplikasi 
Terintegrasi ', 'Seluruh sistem operasional dan layanan manajemen perusahaan kini berada dalam satu genggaman untuk mendukung produktivitas kerja harian Anda.', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/hero/explore_0.4790865459782291.png', 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/hero/stats_bg_0.4189328328365368.png', 'PT. Multi Kontrol Nusantara', 'www.mkncorp.com', '0549-2026162', 'KPC Communication Building
Tango Delta D8, Sangatta', NULL, NULL, 'https://id.linkedin.com/company/mkncorp', 'https://www.instagram.com/multikontrolnusantara/', NULL, 'https://api-db.mknsite.online/storage/v1/object/public/portal_assets/brand/logo_url_0.03130436299706607.png', NULL);


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_roles VALUES ('863563b0-ba9f-40c8-b941-d4d8dbeb45a2', '98cdae46-c20a-462b-8457-007bd2076d45', 'admin', '2026-08-21 01:53:41.999823+00');


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: brand_settings brand_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: daily_visitors daily_visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_visitors
    ADD CONSTRAINT daily_visitors_pkey PRIMARY KEY (date);


--
-- Name: hero_sliders hero_sliders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hero_sliders
    ADD CONSTRAINT hero_sliders_pkey PRIMARY KEY (id);


--
-- Name: portal_clicks portal_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portal_clicks
    ADD CONSTRAINT portal_clicks_pkey PRIMARY KEY (portal_id, date);


--
-- Name: portal_items portal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portal_items
    ADD CONSTRAINT portal_items_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_page_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_page_key UNIQUE (role, page);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: portal_clicks portal_clicks_portal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portal_clicks
    ADD CONSTRAINT portal_clicks_portal_id_fkey FOREIGN KEY (portal_id) REFERENCES public.portal_items(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: brand_settings Admin/Editor can delete brand_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can delete brand_settings" ON public.brand_settings FOR DELETE USING (public.has_permission('appearance'::text, 'delete'::text));


--
-- Name: categories Admin/Editor can delete categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can delete categories" ON public.categories FOR DELETE USING (public.has_permission('categories'::text, 'delete'::text));


--
-- Name: hero_sliders Admin/Editor can delete hero_sliders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can delete hero_sliders" ON public.hero_sliders FOR DELETE USING (public.has_permission('sliders'::text, 'delete'::text));


--
-- Name: portal_items Admin/Editor can delete portal_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can delete portal_items" ON public.portal_items FOR DELETE USING (public.has_permission('portals'::text, 'delete'::text));


--
-- Name: site_settings Admin/Editor can delete site_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can delete site_settings" ON public.site_settings FOR DELETE USING (public.has_permission('appearance'::text, 'delete'::text));


--
-- Name: user_roles Admin/Editor can delete user_roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can delete user_roles" ON public.user_roles FOR DELETE USING (public.has_permission('users'::text, 'delete'::text));


--
-- Name: activity_logs Admin/Editor can insert activity_logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (public.has_admin_or_editor_role());


--
-- Name: brand_settings Admin/Editor can insert brand_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert brand_settings" ON public.brand_settings FOR INSERT WITH CHECK (public.has_permission('appearance'::text, 'create'::text));


--
-- Name: categories Admin/Editor can insert categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_permission('categories'::text, 'create'::text));


--
-- Name: hero_sliders Admin/Editor can insert hero_sliders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert hero_sliders" ON public.hero_sliders FOR INSERT WITH CHECK (public.has_permission('sliders'::text, 'create'::text));


--
-- Name: portal_items Admin/Editor can insert portal_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert portal_items" ON public.portal_items FOR INSERT WITH CHECK (public.has_permission('portals'::text, 'create'::text));


--
-- Name: site_settings Admin/Editor can insert site_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert site_settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_permission('appearance'::text, 'create'::text));


--
-- Name: user_roles Admin/Editor can insert user_roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can insert user_roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_permission('users'::text, 'create'::text));


--
-- Name: brand_settings Admin/Editor can update brand_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can update brand_settings" ON public.brand_settings FOR UPDATE USING (public.has_permission('appearance'::text, 'update'::text));


--
-- Name: categories Admin/Editor can update categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can update categories" ON public.categories FOR UPDATE USING (public.has_permission('categories'::text, 'update'::text));


--
-- Name: hero_sliders Admin/Editor can update hero_sliders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can update hero_sliders" ON public.hero_sliders FOR UPDATE USING (public.has_permission('sliders'::text, 'update'::text));


--
-- Name: portal_items Admin/Editor can update portal_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can update portal_items" ON public.portal_items FOR UPDATE USING (public.has_permission('portals'::text, 'update'::text));


--
-- Name: site_settings Admin/Editor can update site_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can update site_settings" ON public.site_settings FOR UPDATE USING (public.has_permission('appearance'::text, 'update'::text));


--
-- Name: user_roles Admin/Editor can update user_roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can update user_roles" ON public.user_roles FOR UPDATE USING (public.has_permission('users'::text, 'update'::text));


--
-- Name: activity_logs Admin/Editor can view activity_logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin/Editor can view activity_logs" ON public.activity_logs FOR SELECT USING (public.has_permission('activity'::text, 'view'::text));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage categories" ON public.categories USING (public.is_admin());


--
-- Name: portal_items Admins can manage portal_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage portal_items" ON public.portal_items USING (public.is_admin());


--
-- Name: activity_logs Admins can read activity_logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can read activity_logs" ON public.activity_logs FOR SELECT USING (public.is_admin());


--
-- Name: role_permissions Anyone can read role_permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions FOR SELECT USING (true);


--
-- Name: role_permissions Only admins can manage role_permissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Only admins can manage role_permissions" ON public.role_permissions USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: daily_visitors Public can insert daily_visitors; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can insert daily_visitors" ON public.daily_visitors FOR INSERT WITH CHECK (true);


--
-- Name: portal_clicks Public can insert portal_clicks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can insert portal_clicks" ON public.portal_clicks FOR INSERT WITH CHECK (true);


--
-- Name: brand_settings Public can read brand_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read brand_settings" ON public.brand_settings FOR SELECT USING (true);


--
-- Name: categories Public can read categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read categories" ON public.categories FOR SELECT USING (true);


--
-- Name: daily_visitors Public can read daily_visitors; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read daily_visitors" ON public.daily_visitors FOR SELECT USING (true);


--
-- Name: hero_sliders Public can read hero_sliders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read hero_sliders" ON public.hero_sliders FOR SELECT USING (true);


--
-- Name: portal_clicks Public can read portal_clicks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read portal_clicks" ON public.portal_clicks FOR SELECT USING (true);


--
-- Name: portal_items Public can read portal_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read portal_items" ON public.portal_items FOR SELECT USING (true);


--
-- Name: site_settings Public can read site_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can read site_settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: daily_visitors Public can update daily_visitors; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can update daily_visitors" ON public.daily_visitors FOR UPDATE USING (true);


--
-- Name: portal_clicks Public can update portal_clicks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public can update portal_clicks" ON public.portal_clicks FOR UPDATE USING (true);


--
-- Name: user_roles Users can read own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: brand_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_visitors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_visitors ENABLE ROW LEVEL SECURITY;

--
-- Name: hero_sliders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hero_sliders ENABLE ROW LEVEL SECURITY;

--
-- Name: portal_clicks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.portal_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: portal_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.portal_items ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION admin_update_password(p_email text, p_password text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.admin_update_password(p_email text, p_password text) TO authenticated;


--
-- Name: FUNCTION assign_user_role(p_email text, p_role text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.assign_user_role(p_email text, p_role text) TO authenticated;


--
-- Name: FUNCTION delete_admin_user(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.delete_admin_user(p_user_id uuid) TO authenticated;


--
-- Name: TABLE role_permissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.role_permissions TO anon;
GRANT ALL ON TABLE public.role_permissions TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.role_permissions TO service_role;


--
-- Name: TABLE activity_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.activity_logs TO anon;
GRANT ALL ON TABLE public.activity_logs TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.activity_logs TO service_role;


--
-- Name: TABLE activity_logs_with_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.activity_logs_with_users TO anon;
GRANT ALL ON TABLE public.activity_logs_with_users TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.activity_logs_with_users TO service_role;


--
-- Name: TABLE admin_user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_user_profiles TO anon;
GRANT ALL ON TABLE public.admin_user_profiles TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.admin_user_profiles TO service_role;


--
-- Name: TABLE brand_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.brand_settings TO anon;
GRANT ALL ON TABLE public.brand_settings TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.brand_settings TO service_role;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.categories TO service_role;


--
-- Name: TABLE daily_visitors; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.daily_visitors TO anon;
GRANT ALL ON TABLE public.daily_visitors TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.daily_visitors TO service_role;


--
-- Name: TABLE hero_sliders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.hero_sliders TO anon;
GRANT ALL ON TABLE public.hero_sliders TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.hero_sliders TO service_role;


--
-- Name: TABLE portal_clicks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.portal_clicks TO anon;
GRANT ALL ON TABLE public.portal_clicks TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.portal_clicks TO service_role;


--
-- Name: TABLE portal_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.portal_items TO anon;
GRANT ALL ON TABLE public.portal_items TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.portal_items TO service_role;


--
-- Name: TABLE site_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_settings TO anon;
GRANT ALL ON TABLE public.site_settings TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.site_settings TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLE public.user_roles TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--



-- =============================================
-- Ensure storage bucket portal_assets exists
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portal_assets', 'portal_assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public can read portal_assets" ON storage.objects;
    CREATE POLICY "Public can read portal_assets" ON storage.objects FOR SELECT USING (bucket_id = 'portal_assets');
    
    DROP POLICY IF EXISTS "Admin/Editor can insert portal_assets" ON storage.objects;
    CREATE POLICY "Admin/Editor can insert portal_assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portal_assets' AND public.has_admin_or_editor_role());

    DROP POLICY IF EXISTS "Admin/Editor can update portal_assets" ON storage.objects;
    CREATE POLICY "Admin/Editor can update portal_assets" ON storage.objects FOR UPDATE USING (bucket_id = 'portal_assets' AND public.has_admin_or_editor_role());

    DROP POLICY IF EXISTS "Admin/Editor can delete portal_assets" ON storage.objects;
    CREATE POLICY "Admin/Editor can delete portal_assets" ON storage.objects FOR DELETE USING (bucket_id = 'portal_assets' AND public.has_admin_or_editor_role());
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
