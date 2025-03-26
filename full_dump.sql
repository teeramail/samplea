--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: FightCorner; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FightCorner" AS ENUM (
    'RED',
    'BLUE',
    'DRAW'
);


ALTER TYPE public."FightCorner" OWNER TO postgres;

--
-- Name: FightStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FightStatus" AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."FightStatus" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'CANCELLED'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "eventId" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Booking" OWNER TO postgres;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    "startTime" timestamp without time zone NOT NULL,
    "endTime" timestamp without time zone NOT NULL,
    "imageUrl" text,
    "usesDefaultPoster" boolean DEFAULT true NOT NULL,
    "venueId" text NOT NULL,
    "regionId" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."Event" OWNER TO postgres;

--
-- Name: EventTicket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EventTicket" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "seatType" text NOT NULL,
    price double precision NOT NULL,
    capacity integer NOT NULL,
    description text,
    "soldCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventTicket" OWNER TO postgres;

--
-- Name: Fight; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Fight" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "redFighterId" text NOT NULL,
    "blueFighterId" text NOT NULL,
    "weightClass" text NOT NULL,
    rounds integer DEFAULT 5 NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    status public."FightStatus" DEFAULT 'SCHEDULED'::public."FightStatus" NOT NULL,
    winner public."FightCorner",
    method text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Fight" OWNER TO postgres;

--
-- Name: Fighter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Fighter" (
    id text NOT NULL,
    name text NOT NULL,
    nickname text,
    "weightClass" text NOT NULL,
    record text NOT NULL,
    "imageUrl" text,
    country text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."Fighter" OWNER TO postgres;

--
-- Name: Region; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Region" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."Region" OWNER TO postgres;

--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ticket" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "eventDetailId" text NOT NULL,
    "bookingId" text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Ticket" OWNER TO postgres;

--
-- Name: TicketType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TicketType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    "availableSeats" integer NOT NULL,
    "eventId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TicketType" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Venue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Venue" (
    id text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    capacity integer NOT NULL,
    "regionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Venue" OWNER TO postgres;

--
-- Name: _EventToFighter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_EventToFighter" (
    "A" text NOT NULL,
    "B" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."_EventToFighter" OWNER TO postgres;

--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Booking" (id, "userId", "eventId", "totalAmount", "paymentStatus", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Event" (id, title, description, date, "startTime", "endTime", "imageUrl", "usesDefaultPoster", "venueId", "regionId", "createdAt", "updatedAt") FROM stdin;
event-001	Muay Thai Grand Prix	A showcase of the best Muay Thai fighters in Thailand	2025-04-15 00:00:00	2025-04-15 18:00:00	2025-04-15 22:00:00	\N	t	venue-raja-001	reg-bangkok-001	2025-03-19 07:40:14.088	2025-03-19 07:40:14.088
b734c8a2-e349-46fa-9748-d150f83d031a	Ruamphon		2025-03-20 00:00:00	2025-03-20 19:26:00	2025-03-20 22:26:00	posters/1742376286693-66438243-LINE_ALBUM_Ok_250311_1.jpg	f	e9643c37-fdae-405d-a560-44fcef943919	fada2064-1018-4075-835a-7587c4e197d7	2025-03-19 09:24:47.468	2025-03-19 09:24:47.468
1735b804-61bc-486d-9497-2defc44db641	teeraevent	\N	2025-03-21 00:00:00	2025-03-21 12:00:00	2025-03-21 15:00:00	\N	t	c249d193-cfe7-410e-9f38-73675d615361	8a2d267e-f36f-439a-baf0-fa5a8f55103c	2025-03-21 10:46:33.424	2025-03-21 10:46:33.424
3feb2dd7-2bbb-4757-9d51-2932acf98e7e	e10a	hkjhklhjlkhjkljhlk	2025-03-24 00:00:00	2025-03-24 12:00:00	2025-03-24 15:00:00	\N	t	d20feae0-6a8d-480f-93de-edc02a5f563f	c6f5884d-a20f-4915-b68c-2caaea369cd6	2025-03-24 17:37:13.308	2025-03-24 17:37:13.308
fe9ec018-eaaa-4f77-9d11-a63c2c05edd6	e10b	jhkhlkhkhl	2025-03-28 00:00:00	2025-03-28 12:00:00	2025-03-28 15:00:00	\N	t	37720464-5a40-4fb9-981b-abc1e81476f8	c6f5884d-a20f-4915-b68c-2caaea369cd6	2025-03-24 17:38:15.682	2025-03-24 17:38:15.682
a9c119cd-d52c-4150-b3df-ba6f5aed4c3a	eventA	lkfjkd;f	2025-03-26 00:00:00	2025-03-24 15:24:00	2025-03-24 21:19:00	\N	t	37720464-5a40-4fb9-981b-abc1e81476f8	c6f5884d-a20f-4915-b68c-2caaea369cd6	2025-03-25 15:24:51.767	2025-03-26 06:46:59.189
1c657f90-c1c2-4e12-8345-637be35d7ac7	e21	lkdjflk;dsjf	2025-03-26 00:00:00	2025-03-26 01:10:00	2025-03-26 11:07:00		t	venue-bangla-001	reg-phuket-001	2025-03-26 10:09:49.629	2025-03-26 10:09:49.629
\.


--
-- Data for Name: EventTicket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EventTicket" (id, "eventId", "seatType", price, capacity, description, "soldCount", "createdAt", "updatedAt") FROM stdin;
d923543e-ba57-47df-b96c-416243e7d8cf	a9c119cd-d52c-4150-b3df-ba6f5aed4c3a	VIPA	2000	100		0	2025-03-25 15:24:51.767	2025-03-26 06:46:59.189
34a3c438-cf0b-44b3-8632-054c953ede58	a9c119cd-d52c-4150-b3df-ba6f5aed4c3a	VIPB	1800	100		0	2025-03-25 15:24:51.767	2025-03-26 06:46:59.189
fc179881-d14a-481c-92ee-764628a39227	a9c119cd-d52c-4150-b3df-ba6f5aed4c3a	VIPC	1700	100		0	2025-03-25 15:50:28.552	2025-03-26 06:46:59.189
c11406ee-ef85-4b68-bbfe-2e1676a794ae	a9c119cd-d52c-4150-b3df-ba6f5aed4c3a	vipD	1600	100		0	2025-03-26 06:04:56.019	2025-03-26 06:46:59.189
0127336d-a368-40af-928d-3fca26c24f36	a9c119cd-d52c-4150-b3df-ba6f5aed4c3a	vipe	100	1000	sjf;lds	0	2025-03-26 06:46:59.189	2025-03-26 06:46:59.189
9847c7cd-1fab-4c0c-b676-868d97912546	1c657f90-c1c2-4e12-8345-637be35d7ac7	vip	1000	100		0	2025-03-26 10:09:49.629	2025-03-26 10:09:49.629
79ea35bd-0389-4e76-b6b9-6e259435705a	1c657f90-c1c2-4e12-8345-637be35d7ac7	RIP	799.99	100		0	2025-03-26 10:09:49.629	2025-03-26 10:09:49.629
\.


--
-- Data for Name: Fight; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Fight" (id, "eventId", "redFighterId", "blueFighterId", "weightClass", rounds, "order", status, winner, method, "createdAt", "updatedAt") FROM stdin;
fight-001	event-001	fighter-001	fighter-002	Lightweight	5	1	SCHEDULED	\N	\N	2025-03-19 07:40:14.096	2025-03-19 07:40:14.096
fight-002	event-001	fighter-003	fighter-004	Flyweight	5	2	SCHEDULED	\N	\N	2025-03-19 07:40:14.1	2025-03-19 07:40:14.1
\.


--
-- Data for Name: Fighter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Fighter" (id, name, nickname, "weightClass", record, "imageUrl", country, "createdAt", "updatedAt") FROM stdin;
fighter-001	Saenchai PKSaenchaimuaythaigym	The King	Lightweight	320-50-2	\N	Thailand	2025-03-19 07:40:14.076	2025-03-19 07:40:14.076
fighter-002	Buakaw Banchamek	White Lotus	Welterweight	241-24-12	\N	Thailand	2025-03-19 07:40:14.08	2025-03-19 07:40:14.08
fighter-003	Rodtang Jitmuangnon	The Iron Man	Flyweight	267-42-10	\N	Thailand	2025-03-19 07:40:14.082	2025-03-19 07:40:14.082
fighter-004	Superlek Kiatmoo9	The Kicking Machine	Flyweight	128-29-3	\N	Thailand	2025-03-19 07:40:14.085	2025-03-19 07:40:14.085
\.


--
-- Data for Name: Region; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Region" (id, name, description, "createdAt", "updatedAt") FROM stdin;
reg-bangkok-001	Bangkok	The capital city of Thailand	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
reg-phuket-001	Phuket	Thailand's largest island and a popular tourist destination	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
reg-chiangmai-001	Chiang Mai	Cultural hub in Northern Thailand	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
fada2064-1018-4075-835a-7587c4e197d7	Samui	test	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
093968e5-dc1e-46b5-8578-a284b2a51e75	Bangkok	\N	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
8a2d267e-f36f-439a-baf0-fa5a8f55103c	test region1	\N	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
60789167-0ab0-4782-920f-2d0a1f10c075	region test8	\N	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
85e8ddf1-8a0e-4cb3-a38a-cfb412b42fba	region t5	\N	2025-03-22 19:56:45.122652	2025-03-22 19:56:45.122652
7e0b743d-2dea-4505-b50d-649a9a16e3bf	region t6	\N	2025-03-22 19:58:07.982966	2025-03-22 19:58:07.982966
0a2b92b5-bd58-4b71-8157-3d133ae4f0f4	Phuket	\N	2025-03-22 23:08:11.951122	2025-03-22 23:08:11.951122
c6f5884d-a20f-4915-b68c-2caaea369cd6	region 10	\N	2025-03-24 21:34:28.498908	2025-03-24 21:34:28.498908
83de190f-7cbc-4a3b-979c-57340acc28d4	region 11	\N	2025-03-26 16:20:56.179577	2025-03-26 16:20:56.179577
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Ticket" (id, "eventId", "eventDetailId", "bookingId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TicketType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TicketType" (id, name, description, price, "availableSeats", "eventId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Venue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Venue" (id, name, address, capacity, "regionId", "createdAt", "updatedAt") FROM stdin;
venue-raja-001	Rajadamnern Stadium	1 Ratchadamnoen Nok Rd, Wat Sommanat, Pom Prap Sattru Phai, Bangkok 10100	5000	reg-bangkok-001	2025-03-19 07:40:14.061	2025-03-19 07:40:14.061
venue-lumpinee-001	Lumpinee Boxing Stadium	6 Ramintra Rd, Anusawari, Bang Khen, Bangkok 10220	3500	reg-bangkok-001	2025-03-19 07:40:14.066	2025-03-19 07:40:14.066
venue-patong-001	Patong Boxing Stadium	2/56 Soi Sai Namyen, Patong, Kathu, Phuket 83150	1200	reg-phuket-001	2025-03-19 07:40:14.068	2025-03-19 07:40:14.068
venue-bangla-001	Bangla Boxing Stadium	198/4 Rat-U-Thit 200 Pee Road, Patong, Kathu, Phuket 83150	800	reg-phuket-001	2025-03-19 07:40:14.071	2025-03-19 07:40:14.071
venue-thapae-001	Thapae Boxing Stadium	1 Moonmuang Rd, Si Phum, Mueang Chiang Mai, Chiang Mai 50200	1000	reg-chiangmai-001	2025-03-19 07:40:14.073	2025-03-19 07:40:14.073
e9643c37-fdae-405d-a560-44fcef943919	teeramuaythai	8509435	1000	fada2064-1018-4075-835a-7587c4e197d7	2025-03-19 08:57:56.863	2025-03-19 08:57:56.863
c249d193-cfe7-410e-9f38-73675d615361	teerastadium	hjkhlhkjhjhigigl	5666788	8a2d267e-f36f-439a-baf0-fa5a8f55103c	2025-03-21 10:19:32.52	2025-03-21 10:19:32.52
d20feae0-6a8d-480f-93de-edc02a5f563f	ven R10	ssdgdg	1000	c6f5884d-a20f-4915-b68c-2caaea369cd6	2025-03-24 14:50:08.002	2025-03-24 14:50:08.002
37720464-5a40-4fb9-981b-abc1e81476f8	vena r10	m,m,.bm,b,mbnbmnb	1000	c6f5884d-a20f-4915-b68c-2caaea369cd6	2025-03-24 17:35:37.67	2025-03-24 17:35:37.67
5a1bea5e-9f71-4cd2-ab59-8c89a3053388	WWWWW10	fgfdgdfgfdgdfgdfgfd	500	c6f5884d-a20f-4915-b68c-2caaea369cd6	2025-03-24 18:00:21.53	2025-03-24 18:00:21.53
\.


--
-- Data for Name: _EventToFighter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_EventToFighter" ("A", "B", "createdAt", "updatedAt") FROM stdin;
event-001	fighter-001	2025-03-22 20:21:54.432679	2025-03-22 20:21:54.432679
event-001	fighter-002	2025-03-22 20:21:54.432679	2025-03-22 20:21:54.432679
event-001	fighter-003	2025-03-22 20:21:54.432679	2025-03-22 20:21:54.432679
event-001	fighter-004	2025-03-22 20:21:54.432679	2025-03-22 20:21:54.432679
\.


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: EventTicket EventTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EventTicket"
    ADD CONSTRAINT "EventTicket_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: Fight Fight_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fight"
    ADD CONSTRAINT "Fight_pkey" PRIMARY KEY (id);


--
-- Name: Fighter Fighter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fighter"
    ADD CONSTRAINT "Fighter_pkey" PRIMARY KEY (id);


--
-- Name: Region Region_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Region"
    ADD CONSTRAINT "Region_pkey" PRIMARY KEY (id);


--
-- Name: TicketType TicketType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketType"
    ADD CONSTRAINT "TicketType_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Venue Venue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Venue"
    ADD CONSTRAINT "Venue_pkey" PRIMARY KEY (id);


--
-- Name: _EventToFighter _EventToFighter_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_EventToFighter"
    ADD CONSTRAINT "_EventToFighter_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _EventToFighter_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_EventToFighter_B_index" ON public."_EventToFighter" USING btree ("B");


--
-- Name: idx_booking_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_event_id ON public."Booking" USING btree ("eventId");


--
-- Name: idx_booking_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booking_user_id ON public."Booking" USING btree ("userId");


--
-- Name: idx_event_ticket_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_ticket_event_id ON public."EventTicket" USING btree ("eventId");


--
-- Name: idx_ticket_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_booking_id ON public."Ticket" USING btree ("bookingId");


--
-- Name: idx_ticket_event_detail_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_event_detail_id ON public."Ticket" USING btree ("eventDetailId");


--
-- Name: idx_ticket_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_event_id ON public."Ticket" USING btree ("eventId");


--
-- Name: Booking Booking_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EventTicket EventTicket_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EventTicket"
    ADD CONSTRAINT "EventTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON DELETE CASCADE;


--
-- Name: Event Event_regionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES public."Region"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Event Event_venueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES public."Venue"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Fight Fight_blueFighterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fight"
    ADD CONSTRAINT "Fight_blueFighterId_fkey" FOREIGN KEY ("blueFighterId") REFERENCES public."Fighter"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Fight Fight_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fight"
    ADD CONSTRAINT "Fight_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Fight Fight_redFighterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Fight"
    ADD CONSTRAINT "Fight_redFighterId_fkey" FOREIGN KEY ("redFighterId") REFERENCES public."Fighter"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TicketType TicketType_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TicketType"
    ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON DELETE CASCADE;


--
-- Name: Ticket Ticket_eventDetailId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_eventDetailId_fkey" FOREIGN KEY ("eventDetailId") REFERENCES public."EventTicket"(id) ON DELETE CASCADE;


--
-- Name: Ticket Ticket_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON DELETE CASCADE;


--
-- Name: Venue Venue_regionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Venue"
    ADD CONSTRAINT "Venue_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES public."Region"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _EventToFighter _EventToFighter_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_EventToFighter"
    ADD CONSTRAINT "_EventToFighter_A_fkey" FOREIGN KEY ("A") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _EventToFighter _EventToFighter_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_EventToFighter"
    ADD CONSTRAINT "_EventToFighter_B_fkey" FOREIGN KEY ("B") REFERENCES public."Fighter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

