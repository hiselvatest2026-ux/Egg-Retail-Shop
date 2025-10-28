--
-- PostgreSQL database dump
--

\restrict NNPwsXcD7CA805N6IzMPmT5pKlkjBf0ZQzHgthlnAFcbURQbgMu5xdcGH7i0ANX

-- Dumped from database version 17.6 (Debian 17.6-1.pgdg12+1)
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-0ubuntu0.25.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: customer_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    contact_info character varying(255),
    phone character varying(20),
    category character varying(20),
    gstin character varying(20),
    tax_applicability character varying(20),
    customer_code character varying(20),
    credit_limit numeric(10,2) DEFAULT 0
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: goods_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goods_receipts (
    id integer NOT NULL,
    po_id integer,
    product_id integer,
    received_qty integer NOT NULL,
    quality_note character varying(255),
    received_at timestamp without time zone DEFAULT now()
);


--
-- Name: goods_receipts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goods_receipts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goods_receipts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goods_receipts_id_seq OWNED BY public.goods_receipts.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: metal_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metal_master (
    id integer NOT NULL,
    part_code character varying(50) NOT NULL,
    metal_type character varying(100) NOT NULL,
    gst_percent numeric(5,2) NOT NULL,
    description character varying(255),
    hsn_sac character varying(10),
    shelf_life character varying(50)
);


--
-- Name: metal_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metal_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metal_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metal_master_id_seq OWNED BY public.metal_master.id;


--
-- Name: opening_stocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opening_stocks (
    id integer NOT NULL,
    product_id integer,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: opening_stocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.opening_stocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opening_stocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.opening_stocks_id_seq OWNED BY public.opening_stocks.id;


--
-- Name: opening_stocks_material; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opening_stocks_material (
    material_code character varying(50) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    customer_id integer,
    invoice_id integer,
    amount numeric(10,2) NOT NULL,
    payment_date timestamp without time zone DEFAULT now(),
    payment_mode character varying(50)
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: pricing_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_master (
    id integer NOT NULL,
    customer_id integer,
    category character varying(20) NOT NULL,
    material_code character varying(50) NOT NULL,
    base_price numeric(10,2) NOT NULL,
    gst_percent numeric(5,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: pricing_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pricing_master_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pricing_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pricing_master_id_seq OWNED BY public.pricing_master.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    batch_number character varying(50),
    expiry_date date
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_items (
    id integer NOT NULL,
    purchase_id integer,
    product_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    location_id integer,
    mfg_date date
);


--
-- Name: purchase_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_items_id_seq OWNED BY public.purchase_items.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    po_id integer,
    product_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    supplier_id integer,
    status character varying(20) DEFAULT 'Draft'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    expected_date date,
    notes character varying(255)
);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    supplier_id integer,
    purchase_date timestamp without time zone DEFAULT now(),
    total numeric(10,2),
    egg_type character varying(50),
    vendor_id integer,
    product_name character varying(100),
    price_per_unit numeric(10,2),
    quantity integer,
    gst_percent numeric(5,2)
);


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: route_trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.route_trips (
    id integer NOT NULL,
    route_id integer,
    service_date date NOT NULL,
    route_name character varying(100),
    vehicle_number character varying(50),
    driver character varying(100),
    status character varying(20) DEFAULT 'Planned'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: route_trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.route_trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: route_trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.route_trips_id_seq OWNED BY public.route_trips.id;


--
-- Name: routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.routes (
    id integer NOT NULL,
    route_number character varying(50) NOT NULL,
    route_name character varying(100) NOT NULL,
    vehicle_number character varying(50),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: routes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.routes_id_seq OWNED BY public.routes.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer,
    product_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    location_id integer
);


--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    customer_id integer,
    sale_date timestamp without time zone DEFAULT now(),
    total numeric(10,2),
    egg_type character varying(50),
    payment_method character varying(50),
    status character varying(20) DEFAULT 'Completed'::character varying,
    discount numeric(10,2) DEFAULT 0,
    product_name character varying(100),
    sale_type character varying(20) DEFAULT 'Cash'::character varying,
    route_trip_id integer,
    category character varying(20)
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    company_name character varying(150),
    gstin character varying(20),
    address text,
    phone character varying(20),
    email character varying(100),
    logo_url text
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: stock_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_adjustments (
    id integer NOT NULL,
    product_id integer,
    adjustment_type character varying(20) NOT NULL,
    quantity integer NOT NULL,
    note character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_adjustments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_adjustments_id_seq OWNED BY public.stock_adjustments.id;


--
-- Name: stock_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_counts (
    id integer NOT NULL,
    product_id integer,
    counted_qty integer NOT NULL,
    note character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: stock_counts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stock_counts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stock_counts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stock_counts_id_seq OWNED BY public.stock_counts.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    contact_info character varying(255)
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: vendor_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendor_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    vendor_code character varying(20) DEFAULT ('V'::text || lpad((nextval('public.vendor_code_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20),
    address character varying(255),
    pincode character varying(10),
    gstin character varying(20),
    credit_terms character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendors_id_seq OWNED BY public.vendors.id;


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: goods_receipts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts ALTER COLUMN id SET DEFAULT nextval('public.goods_receipts_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: metal_master id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_master ALTER COLUMN id SET DEFAULT nextval('public.metal_master_id_seq'::regclass);


--
-- Name: opening_stocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opening_stocks ALTER COLUMN id SET DEFAULT nextval('public.opening_stocks_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: pricing_master id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_master ALTER COLUMN id SET DEFAULT nextval('public.pricing_master_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_items_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: route_trips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_trips ALTER COLUMN id SET DEFAULT nextval('public.route_trips_id_seq'::regclass);


--
-- Name: routes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes ALTER COLUMN id SET DEFAULT nextval('public.routes_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: stock_adjustments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments ALTER COLUMN id SET DEFAULT nextval('public.stock_adjustments_id_seq'::regclass);


--
-- Name: stock_counts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_counts ALTER COLUMN id SET DEFAULT nextval('public.stock_counts_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.vendors_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, contact_info, phone, category, gstin, tax_applicability, customer_code, credit_limit) FROM stdin;
1	Kandan Mess	\N	9043171339	Horecha	\N	\N	C000001	0.00
2	Mariya Protein	\N	7010521252	Retail	\N	\N	C000002	0.00
3	Deen KariKadai	\N	9840093784	Retail	\N	\N	C000003	0.00
4	RBR EGG MART		9840444000	Walk-in		\N	C000004	0.00
5	Naval Egg Centre	THANAPAL	9865808253	Wholesale	\N	\N	C000005	1.00
\.


--
-- Data for Name: goods_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goods_receipts (id, po_id, product_id, received_qty, quality_note, received_at) FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, name) FROM stdin;
\.


--
-- Data for Name: metal_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metal_master (id, part_code, metal_type, gst_percent, description, hsn_sac, shelf_life) FROM stdin;
1	M00001	Egg	0.00	White Egg	\N	15
\.


--
-- Data for Name: opening_stocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opening_stocks (id, product_id, quantity, updated_at) FROM stdin;
\.


--
-- Data for Name: opening_stocks_material; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opening_stocks_material (material_code, quantity, updated_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, customer_id, invoice_id, amount, payment_date, payment_mode) FROM stdin;
12	4	12	29.00	2025-09-15 04:08:26.828171	Cash
13	4	13	87.00	2025-09-15 04:08:43.477542	Gpay
14	4	14	10266.00	2025-09-15 04:13:18.008702	Cash
15	4	15	116.00	2025-09-15 04:39:23.35015	Cash
16	4	16	174.00	2025-09-15 06:22:13.148142	Cash
17	2	17	1668.80	2025-09-15 06:23:58.800322	Cash
18	4	18	58.00	2025-09-15 07:28:39.466221	Cash
19	4	19	58.00	2025-09-15 07:28:56.495091	Gpay
20	1	20	840.00	2025-09-15 09:38:51.914267	Cash
21	4	21	59.00	2025-09-15 11:57:06.706992	Cash
22	4	22	70.80	2025-09-15 12:04:13.143086	Cash
23	4	23	177.00	2025-09-15 12:25:28.083381	Cash
24	4	24	177.00	2025-09-15 13:13:12.229707	Cash
25	4	25	177.00	2025-09-15 13:13:29.071261	Cash
26	4	26	70.80	2025-09-15 14:00:46.689718	Cash
27	4	27	76.70	2025-09-15 14:01:02.031603	Cash
28	4	28	59.00	2025-09-15 14:27:43.708798	Cash
29	4	29	59.00	2025-09-15 14:27:51.465811	Cash
30	4	30	59.00	2025-09-15 14:27:58.920937	Cash
31	4	31	59.00	2025-09-15 14:28:07.139428	Cash
32	4	32	70.80	2025-09-15 14:28:21.094392	Cash
33	4	33	70.80	2025-09-15 14:31:08.688565	Cash
34	4	34	70.80	2025-09-15 14:34:11.594308	Cash
35	4	35	23.60	2025-09-15 14:39:41.09665	Cash
36	4	36	88.50	2025-09-15 14:45:10.7527	Cash
37	2	38	840.00	2025-09-15 14:51:32.601876	Cash
38	3	39	1650.00	2025-09-15 14:51:59.408111	Cash
39	4	40	180.00	2025-09-16 03:36:53.915569	Cash
40	1	37	1680.00	2025-09-16 03:37:32.869842	Cash
41	4	41	120.00	2025-09-16 04:08:32.228369	Cash
42	4	42	48.00	2025-09-16 04:08:53.318717	Gpay
43	4	43	24.00	2025-09-16 04:14:18.299733	Cash
44	4	44	540.00	2025-09-16 04:47:36.517554	Cash
45	4	45	180.00	2025-09-16 04:47:47.672265	Cash
46	4	46	180.00	2025-09-16 06:07:41.695791	Cash
47	4	47	180.00	2025-09-16 06:07:42.441139	Cash
48	4	48	72.00	2025-09-16 06:24:54.756321	Gpay
49	1	49	1026.00	2025-09-16 11:38:22.801346	Cash
50	5	50	144.00	2025-09-16 13:37:04.162766	Cash
51	5	52	72.00	2025-09-16 13:52:28.78331	Gpay
52	5	53	180.00	2025-09-16 14:08:59.030364	Gpay
53	5	54	72.00	2025-09-16 14:10:07.593701	Gpay
54	5	55	60.00	2025-09-16 14:10:23.115365	Gpay
55	5	56	60.00	2025-09-16 14:10:34.371438	Cash
56	5	57	60.00	2025-09-16 14:24:41.042233	Gpay
57	5	58	120.00	2025-09-16 14:39:03.716464	Gpay
58	5	59	60.00	2025-09-16 15:05:37.015405	Cash
59	5	60	90.00	2025-09-16 15:06:16.912556	Gpay
60	5	61	120.00	2025-09-16 15:09:04.316477	Gpay
61	5	62	72.00	2025-09-16 15:19:40.570257	Gpay
62	5	63	120.00	2025-09-16 15:34:56.673205	Cash
63	5	64	72.00	2025-09-16 15:37:09.362881	Cash
64	5	65	60.00	2025-09-16 15:41:40.76265	Gpay
65	5	66	180.00	2025-09-16 15:50:03.528001	Gpay
66	5	67	60.00	2025-09-17 11:42:50.56338	Gpay
67	5	68	180.00	2025-09-17 12:53:02.226499	Gpay
68	5	69	60.00	2025-09-17 13:19:07.817593	Gpay
69	5	70	72.00	2025-09-17 13:22:17.119555	Gpay
70	5	71	120.00	2025-09-17 13:25:06.691936	Gpay
71	5	72	72.00	2025-09-17 13:32:21.349411	Cash
72	5	73	60.00	2025-09-17 13:38:52.024229	Gpay
73	5	74	72.00	2025-09-17 14:26:05.383166	Cash
74	5	75	60.00	2025-09-17 14:26:28.353459	Gpay
75	5	76	72.00	2025-09-17 14:27:29.799877	Cash
76	5	77	72.00	2025-09-17 14:27:42.820573	Cash
77	5	78	180.00	2025-09-17 14:33:06.061609	Cash
78	5	79	180.00	2025-09-17 14:37:59.95852	Gpay
79	5	80	36.00	2025-09-17 15:18:22.073333	Gpay
80	5	81	90.00	2025-09-17 15:20:54.369663	Gpay
81	4	82	60.00	2025-09-18 04:16:21.942956	Gpay
82	4	83	180.00	2025-09-18 04:38:56.895013	Gpay
83	5	51	16350.00	2025-09-18 04:40:37.173664	Gpay
84	4	84	60.00	2025-09-18 05:49:38.525969	Gpay
85	4	85	90.00	2025-09-18 06:14:37.252081	Cash
86	4	86	90.00	2025-09-18 06:21:16.22163	Cash
87	2	87	855.00	2025-09-18 07:23:25.22856	Cash
88	1	88	855.00	2025-09-18 07:24:46.058962	Cash
89	1	89	1368.00	2025-09-18 13:41:38.525549	Cash
90	4	90	72.00	2025-09-18 14:18:23.25918	Gpay
91	4	91	60.00	2025-09-18 14:31:04.265352	Cash
\.


--
-- Data for Name: pricing_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pricing_master (id, customer_id, category, material_code, base_price, gst_percent, created_at) FROM stdin;
3	1	Retail	M00001	5.70	0.00	2025-09-13 08:29:11.802126
4	2	Retail	M00001	5.70	0.00	2025-09-13 08:29:23.079529
5	3	Retail	M00001	5.70	0.00	2025-09-13 08:29:37.18648
6	4	Walk-in	M00001	6.00	0.00	2025-09-13 08:59:36.280021
7	5	Wholesale	M00001	5.45	0.00	2025-09-16 13:37:23.241573
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, price, batch_number, expiry_date) FROM stdin;
1	Egg Large 12pc	6.00	INIT	2030-01-01
\.


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_items (id, purchase_id, product_id, quantity, price, location_id, mfg_date) FROM stdin;
3	3	1	7470	5.35	\N	2025-09-14
4	4	1	4500	5.35	\N	\N
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_order_items (id, po_id, product_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, supplier_id, status, created_at, expected_date, notes) FROM stdin;
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, supplier_id, purchase_date, total, egg_type, vendor_id, product_name, price_per_unit, quantity, gst_percent) FROM stdin;
3	\N	2025-09-13 08:52:53.215703	39964.50	\N	1	\N	\N	\N	\N
4	\N	2025-09-18 05:44:03.066533	24075.00	\N	1	\N	\N	\N	\N
\.


--
-- Data for Name: route_trips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.route_trips (id, route_id, service_date, route_name, vehicle_number, driver, status, created_at) FROM stdin;
\.


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.routes (id, route_number, route_name, vehicle_number, active, created_at) FROM stdin;
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_items (id, sale_id, product_id, quantity, price, location_id) FROM stdin;
12	12	1	5	5.80	\N
13	13	1	15	5.80	\N
14	14	1	1770	5.80	\N
15	15	1	20	5.80	\N
16	16	1	30	5.80	\N
17	17	1	298	5.60	\N
18	18	1	10	5.80	\N
19	19	1	10	5.80	\N
20	20	1	150	5.60	\N
21	21	1	10	5.90	\N
22	22	1	12	5.90	\N
23	23	1	30	5.90	\N
24	24	1	30	5.90	\N
25	25	1	30	5.90	\N
26	26	1	12	5.90	\N
27	27	1	13	5.90	\N
28	28	1	10	5.90	\N
29	29	1	10	5.90	\N
30	30	1	10	5.90	\N
31	31	1	10	5.90	\N
32	32	1	12	5.90	\N
33	33	1	12	5.90	\N
34	34	1	12	5.90	\N
35	35	1	4	5.90	\N
36	36	1	15	5.90	\N
37	37	1	300	5.60	\N
38	38	1	150	5.60	\N
39	39	1	300	5.50	\N
40	40	1	30	6.00	\N
41	41	1	20	6.00	\N
42	42	1	8	6.00	\N
43	43	1	4	6.00	\N
44	44	1	90	6.00	\N
45	45	1	30	6.00	\N
46	46	1	30	6.00	\N
47	47	1	30	6.00	\N
48	48	1	12	6.00	\N
49	49	1	180	5.70	\N
50	50	1	24	6.00	\N
51	51	1	3000	5.45	\N
52	52	1	12	6.00	\N
53	53	1	30	6.00	\N
54	54	1	12	6.00	\N
55	55	1	10	6.00	\N
56	56	1	10	6.00	\N
57	57	1	10	6.00	\N
58	58	1	20	6.00	\N
59	59	1	10	6.00	\N
60	60	1	15	6.00	\N
61	61	1	20	6.00	\N
62	62	1	12	6.00	\N
63	63	1	20	6.00	\N
64	64	1	12	6.00	\N
65	65	1	10	6.00	\N
66	66	1	30	6.00	\N
67	67	1	10	6.00	\N
68	68	1	30	6.00	\N
69	69	1	10	6.00	\N
70	70	1	12	6.00	\N
71	71	1	20	6.00	\N
72	72	1	12	6.00	\N
73	73	1	10	6.00	\N
74	74	1	12	6.00	\N
75	75	1	10	6.00	\N
76	76	1	12	6.00	\N
77	77	1	12	6.00	\N
78	78	1	30	6.00	\N
79	79	1	30	6.00	\N
80	80	1	6	6.00	\N
81	81	1	15	6.00	\N
82	82	1	10	6.00	\N
83	83	1	30	6.00	\N
84	84	1	10	6.00	\N
85	85	1	15	6.00	\N
86	86	1	15	6.00	\N
87	87	1	150	5.70	\N
88	88	1	150	5.70	\N
89	89	1	240	5.70	\N
90	90	1	12	6.00	\N
91	91	1	10	6.00	\N
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, customer_id, sale_date, total, egg_type, payment_method, status, discount, product_name, sale_type, route_trip_id, category) FROM stdin;
43	4	2025-09-16 04:14:17.12281	24.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
44	4	2025-09-16 04:47:35.334034	540.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
45	4	2025-09-16 04:47:46.500804	180.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
46	4	2025-09-16 06:07:40.555539	180.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
47	4	2025-09-16 06:07:41.565975	180.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
48	4	2025-09-16 06:24:53.460882	72.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
12	4	2025-09-15 04:08:25.664476	29.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
13	4	2025-09-15 04:08:42.28876	87.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
14	4	2025-09-15 04:13:16.835972	10266.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
15	4	2025-09-15 04:39:22.142159	116.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
16	4	2025-09-15 06:22:11.971867	174.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
17	2	2025-09-15 06:23:57.6268	1668.80	\N	Cash	Completed	0.00	\N	Cash	\N	\N
18	4	2025-09-15 07:28:38.097893	58.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
19	4	2025-09-15 07:28:55.265547	58.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
20	1	2025-09-15 09:38:50.654077	840.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
21	4	2025-09-15 11:57:05.409009	59.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
22	4	2025-09-15 12:04:11.925557	70.80	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
23	4	2025-09-15 12:25:26.915002	177.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
24	4	2025-09-15 13:13:11.059037	177.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
25	4	2025-09-15 13:13:27.930267	177.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
26	4	2025-09-15 14:00:45.55571	70.80	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
27	4	2025-09-15 14:01:00.872601	76.70	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
28	4	2025-09-15 14:27:42.491622	59.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
29	4	2025-09-15 14:27:50.226326	59.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
30	4	2025-09-15 14:27:57.805292	59.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
31	4	2025-09-15 14:28:05.891122	59.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
32	4	2025-09-15 14:28:19.933261	70.80	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
33	4	2025-09-15 14:31:07.478772	70.80	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
34	4	2025-09-15 14:34:10.357967	70.80	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
35	4	2025-09-15 14:39:39.954934	23.60	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
36	4	2025-09-15 14:45:09.558855	88.50	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
37	1	2025-09-15 14:50:03.288917	1680.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
38	2	2025-09-15 14:51:31.525454	840.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
39	3	2025-09-15 14:51:58.293887	1650.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
40	4	2025-09-16 03:36:52.761415	180.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
41	4	2025-09-16 04:08:31.119287	120.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
42	4	2025-09-16 04:08:52.182477	48.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
49	1	2025-09-16 11:38:21.615693	1026.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
57	4	2025-09-16 14:24:39.923533	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
51	5	2025-09-16 13:40:51.334292	16350.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
58	4	2025-09-16 14:39:02.572327	120.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
59	4	2025-09-16 15:05:35.862435	60.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
60	4	2025-09-16 15:06:15.760048	90.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
61	4	2025-09-16 15:09:03.123359	120.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
62	4	2025-09-16 15:19:39.363687	72.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
50	4	2025-09-16 13:37:03.000393	144.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
52	4	2025-09-16 13:52:27.552703	72.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
53	4	2025-09-16 14:08:57.834307	180.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
54	4	2025-09-16 14:10:05.888472	72.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
55	4	2025-09-16 14:10:21.969856	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
56	4	2025-09-16 14:10:33.24541	60.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
63	4	2025-09-16 15:34:55.267546	120.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
64	4	2025-09-16 15:37:08.20178	72.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
65	4	2025-09-16 15:41:39.095625	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
66	4	2025-09-16 15:50:02.367591	180.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
82	4	2025-09-18 04:16:20.869084	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
76	4	2025-09-17 14:27:28.5488	72.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
77	4	2025-09-17 14:27:41.65374	72.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
78	4	2025-09-17 14:33:04.855957	180.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
79	4	2025-09-17 14:37:58.820873	180.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
80	4	2025-09-17 15:18:20.759217	36.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
67	4	2025-09-17 11:42:49.297543	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
68	4	2025-09-17 12:53:01.012792	180.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
69	4	2025-09-17 13:19:06.130632	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
70	4	2025-09-17 13:22:15.425882	72.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
71	4	2025-09-17 13:25:05.176221	120.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
72	4	2025-09-17 13:32:20.238236	72.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
73	4	2025-09-17 13:38:50.314543	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
74	4	2025-09-17 14:26:04.287618	72.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
75	4	2025-09-17 14:26:27.259885	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
81	4	2025-09-17 15:20:52.726831	90.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
83	4	2025-09-18 04:38:55.786689	180.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
84	4	2025-09-18 05:49:36.934921	60.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
85	4	2025-09-18 06:14:35.996536	90.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
86	4	2025-09-18 06:21:14.974589	90.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
87	2	2025-09-18 07:23:24.100243	855.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
88	1	2025-09-18 07:24:44.841314	855.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
89	1	2025-09-18 13:41:37.285932	1368.00	\N	Cash	Completed	0.00	\N	Cash	\N	\N
90	4	2025-09-18 14:18:22.155577	72.00	\N	Gpay	Completed	0.00	Egg	Cash	\N	\N
91	4	2025-09-18 14:31:03.152228	60.00	\N	Cash	Completed	0.00	Egg	Cash	\N	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, company_name, gstin, address, phone, email, logo_url) FROM stdin;
\.


--
-- Data for Name: stock_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_adjustments (id, product_id, adjustment_type, quantity, note, created_at) FROM stdin;
3	1	Breakage	30	\N	2025-09-16 15:42:50.50693
4	1	Breakage	15	\N	2025-09-18 14:12:43.105636
\.


--
-- Data for Name: stock_counts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_counts (id, product_id, counted_qty, note, created_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, contact_info) FROM stdin;
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendors (id, vendor_code, name, phone, address, pincode, gstin, credit_terms, created_at) FROM stdin;
1	V000054	GK	9597925477	Namakkal	637001		1	2025-09-13 08:24:37.226856
\.


--
-- Name: customer_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_code_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 5, true);


--
-- Name: goods_receipts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goods_receipts_id_seq', 1, false);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.locations_id_seq', 1, false);


--
-- Name: metal_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metal_master_id_seq', 1, true);


--
-- Name: opening_stocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.opening_stocks_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 91, true);


--
-- Name: pricing_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pricing_master_id_seq', 7, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 1, true);


--
-- Name: purchase_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_items_id_seq', 4, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 1, false);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 1, false);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchases_id_seq', 4, true);


--
-- Name: route_trips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.route_trips_id_seq', 1, false);


--
-- Name: routes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.routes_id_seq', 1, false);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 91, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_id_seq', 91, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, false);


--
-- Name: stock_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_adjustments_id_seq', 4, true);


--
-- Name: stock_counts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_counts_id_seq', 1, false);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, false);


--
-- Name: vendor_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendor_code_seq', 55, true);


--
-- Name: vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendors_id_seq', 2, true);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: goods_receipts goods_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: metal_master metal_master_part_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_master
    ADD CONSTRAINT metal_master_part_code_key UNIQUE (part_code);


--
-- Name: metal_master metal_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metal_master
    ADD CONSTRAINT metal_master_pkey PRIMARY KEY (id);


--
-- Name: opening_stocks_material opening_stocks_material_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opening_stocks_material
    ADD CONSTRAINT opening_stocks_material_pkey PRIMARY KEY (material_code);


--
-- Name: opening_stocks opening_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opening_stocks
    ADD CONSTRAINT opening_stocks_pkey PRIMARY KEY (id);


--
-- Name: opening_stocks opening_stocks_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opening_stocks
    ADD CONSTRAINT opening_stocks_product_id_key UNIQUE (product_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pricing_master pricing_master_customer_id_category_material_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_master
    ADD CONSTRAINT pricing_master_customer_id_category_material_code_key UNIQUE (customer_id, category, material_code);


--
-- Name: pricing_master pricing_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_master
    ADD CONSTRAINT pricing_master_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: route_trips route_trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_trips
    ADD CONSTRAINT route_trips_pkey PRIMARY KEY (id);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: routes routes_route_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_route_number_key UNIQUE (route_number);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: stock_adjustments stock_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id);


--
-- Name: stock_counts stock_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_counts
    ADD CONSTRAINT stock_counts_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_vendor_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_vendor_code_key UNIQUE (vendor_code);


--
-- Name: idx_payments_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_invoice_id ON public.payments USING btree (invoice_id);


--
-- Name: idx_sale_items_sale_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);


--
-- Name: goods_receipts goods_receipts_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id);


--
-- Name: goods_receipts goods_receipts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_receipts
    ADD CONSTRAINT goods_receipts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: opening_stocks_material opening_stocks_material_material_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opening_stocks_material
    ADD CONSTRAINT opening_stocks_material_material_code_fkey FOREIGN KEY (material_code) REFERENCES public.metal_master(part_code);


--
-- Name: opening_stocks opening_stocks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opening_stocks
    ADD CONSTRAINT opening_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales(id);


--
-- Name: pricing_master pricing_master_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_master
    ADD CONSTRAINT pricing_master_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: purchase_items purchase_items_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: purchase_items purchase_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_items purchase_items_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchases purchases_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchases purchases_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- Name: route_trips route_trips_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.route_trips
    ADD CONSTRAINT route_trips_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: sale_items sale_items_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales sales_route_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_route_trip_id_fkey FOREIGN KEY (route_trip_id) REFERENCES public.route_trips(id);


--
-- Name: stock_adjustments stock_adjustments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_adjustments
    ADD CONSTRAINT stock_adjustments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stock_counts stock_counts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_counts
    ADD CONSTRAINT stock_counts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

\unrestrict NNPwsXcD7CA805N6IzMPmT5pKlkjBf0ZQzHgthlnAFcbURQbgMu5xdcGH7i0ANX

