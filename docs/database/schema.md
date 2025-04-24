# Database Schema

*Last updated: 2025-04-24T07:22:49.176Z*

## Tables

- [Booking](#booking)
- [Category](#category)
- [CourseEnrollment](#courseenrollment)
- [Customer](#customer)
- [Event](#event)
- [EventTemplate](#eventtemplate)
- [EventTemplateTicket](#eventtemplateticket)
- [EventTicket](#eventticket)
- [Fighter](#fighter)
- [Instructor](#instructor)
- [Post](#post)
- [Product](#product)
- [ProductToCategory](#producttocategory)
- [Region](#region)
- [Ticket](#ticket)
- [TrainingCourse](#trainingcourse)
- [User](#user)
- [Venue](#venue)
- [VenueToVenueType](#venuetovenuetype)
- [VenueType](#venuetype)
- [account](#account)
- [session](#session)
- [verification_token](#verification_token)

## Schema Details

### Booking

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| eventId | text | NO | NULL |
| totalAmount | double precision | NO | NULL |
| paymentStatus | text | NO | 'PENDING'::text |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| customerId | text | NO | NULL |
| customerNameSnapshot | text | YES | NULL |
| customerEmailSnapshot | text | YES | NULL |
| customerPhoneSnapshot | text | YES | NULL |
| eventTitleSnapshot | text | YES | NULL |
| eventDateSnapshot | timestamp without time zone | YES | NULL |
| venueNameSnapshot | text | YES | NULL |
| regionNameSnapshot | text | YES | NULL |
| bookingItemsJson | jsonb | YES | NULL |
| paymentOrderNo | text | YES | NULL |
| paymentTransactionId | text | YES | NULL |
| paymentBankCode | text | YES | NULL |
| paymentBankRefCode | text | YES | NULL |
| paymentDate | text | YES | NULL |
| paymentMethod | text | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| customerId | Customer.id | RESTRICT |
| eventId | Event.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| Booking_pkey | CREATE UNIQUE INDEX "Booking_pkey" ON public."Booking" USING btree (id) |

### Category

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| slug | text | NO | NULL |
| description | text | YES | NULL |
| thumbnailUrl | text | YES | NULL |
| imageUrls | ARRAY | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Indexes

| Name | Definition |
|------|------------|
| Category_pkey | CREATE UNIQUE INDEX "Category_pkey" ON public."Category" USING btree (id) |
| Category_slug_unique | CREATE UNIQUE INDEX "Category_slug_unique" ON public."Category" USING btree (slug) |

### CourseEnrollment

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| customerId | text | NO | NULL |
| courseId | text | NO | NULL |
| pricePaid | double precision | NO | NULL |
| status | text | NO | 'PENDING_PAYMENT'::text |
| enrollmentDate | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| startDate | timestamp without time zone | YES | NULL |
| courseTitleSnapshot | text | YES | NULL |
| customerNameSnapshot | text | YES | NULL |
| customerEmailSnapshot | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| courseId | TrainingCourse.id | CASCADE |
| customerId | Customer.id | RESTRICT |

#### Indexes

| Name | Definition |
|------|------------|
| CourseEnrollment_pkey | CREATE UNIQUE INDEX "CourseEnrollment_pkey" ON public."CourseEnrollment" USING btree (id) |

### Customer

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| userId | text | YES | NULL |
| name | text | NO | NULL |
| email | text | NO | NULL |
| phone | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| userId | User.id | SET NULL |

#### Indexes

| Name | Definition |
|------|------------|
| Customer_pkey | CREATE UNIQUE INDEX "Customer_pkey" ON public."Customer" USING btree (id) |
| customer_email_idx | CREATE INDEX customer_email_idx ON public."Customer" USING btree (email) |

### Event

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| title | text | NO | NULL |
| description | text | YES | NULL |
| date | timestamp without time zone | NO | NULL |
| startTime | timestamp without time zone | NO | NULL |
| endTime | timestamp without time zone | YES | NULL |
| imageUrl | text | YES | NULL |
| usesDefaultPoster | boolean | NO | true |
| venueId | text | YES | NULL |
| regionId | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| status | text | NO | 'SCHEDULED'::text |
| thumbnailUrl | text | YES | NULL |
| imageUrls | ARRAY | YES | NULL |
| metaTitle | text | YES | NULL |
| metaDescription | text | YES | NULL |
| keywords | ARRAY | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| regionId | Region.id | SET NULL |
| venueId | Venue.id | SET NULL |

#### Indexes

| Name | Definition |
|------|------------|
| Event_pkey | CREATE UNIQUE INDEX "Event_pkey" ON public."Event" USING btree (id) |

### EventTemplate

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| templateName | text | NO | NULL |
| venueId | text | YES | NULL |
| regionId | text | YES | NULL |
| defaultTitleFormat | text | YES | NULL |
| defaultDescription | text | YES | NULL |
| recurringDaysOfWeek | ARRAY | YES | NULL |
| defaultStartTime | time without time zone | YES | NULL |
| defaultEndTime | time without time zone | YES | NULL |
| isActive | boolean | NO | true |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| recurrenceType | USER-DEFINED | NO | 'none'::recurrence_type |
| startDate | timestamp without time zone | YES | NULL |
| endDate | timestamp without time zone | YES | NULL |
| dayOfMonth | ARRAY | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| regionId | Region.id | RESTRICT |
| venueId | Venue.id | RESTRICT |

#### Indexes

| Name | Definition |
|------|------------|
| EventTemplate_pkey | CREATE UNIQUE INDEX "EventTemplate_pkey" ON public."EventTemplate" USING btree (id) |

### EventTemplateTicket

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| eventTemplateId | text | NO | NULL |
| seatType | text | NO | NULL |
| defaultPrice | double precision | NO | NULL |
| defaultCapacity | integer | NO | NULL |
| defaultDescription | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| eventTemplateId | EventTemplate.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| EventTemplateTicket_pkey | CREATE UNIQUE INDEX "EventTemplateTicket_pkey" ON public."EventTemplateTicket" USING btree (id) |

### EventTicket

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| eventId | text | NO | NULL |
| seatType | text | NO | NULL |
| price | double precision | NO | NULL |
| capacity | integer | NO | NULL |
| description | text | YES | NULL |
| soldCount | integer | NO | 0 |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| discountedPrice | double precision | YES | NULL |
| cost | double precision | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| eventId | Event.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| EventTicket_pkey | CREATE UNIQUE INDEX "EventTicket_pkey" ON public."EventTicket" USING btree (id) |

### Fighter

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| nickname | text | YES | NULL |
| weightClass | text | YES | NULL |
| record | text | YES | NULL |
| imageUrl | text | YES | NULL |
| country | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| isFeatured | boolean | NO | false |

#### Indexes

| Name | Definition |
|------|------------|
| Fighter_pkey | CREATE UNIQUE INDEX "Fighter_pkey" ON public."Fighter" USING btree (id) |

### Instructor

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| bio | text | YES | NULL |
| imageUrl | text | YES | NULL |
| expertise | ARRAY | YES | NULL |
| userId | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| userId | User.id | SET NULL |

#### Indexes

| Name | Definition |
|------|------------|
| Instructor_pkey | CREATE UNIQUE INDEX "Instructor_pkey" ON public."Instructor" USING btree (id) |

### Post

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| slug | text | NO | NULL |
| title | text | NO | NULL |
| content | text | NO | NULL |
| excerpt | text | YES | NULL |
| featuredImageUrl | text | YES | NULL |
| isFeatured | boolean | NO | false |
| publishedAt | timestamp without time zone | YES | NULL |
| status | text | NO | 'DRAFT'::text |
| regionId | text | YES | NULL |
| authorId | text | YES | NULL |
| metaTitle | text | YES | NULL |
| metaDescription | text | YES | NULL |
| keywords | ARRAY | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| authorId | User.id | SET NULL |
| regionId | Region.id | SET NULL |

#### Indexes

| Name | Definition |
|------|------------|
| Post_pkey | CREATE UNIQUE INDEX "Post_pkey" ON public."Post" USING btree (id) |
| Post_slug_unique | CREATE UNIQUE INDEX "Post_slug_unique" ON public."Post" USING btree (slug) |

### Product

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| description | text | YES | NULL |
| price | double precision | NO | NULL |
| imageUrls | ARRAY | YES | NULL |
| isFeatured | boolean | NO | false |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| thumbnailUrl | text | YES | NULL |
| categoryId | text | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| categoryId | Category.id | SET NULL |

#### Indexes

| Name | Definition |
|------|------------|
| Product_pkey | CREATE UNIQUE INDEX "Product_pkey" ON public."Product" USING btree (id) |

### ProductToCategory

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| productId | text | NO | NULL |
| categoryId | text | NO | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| categoryId | Category.id | CASCADE |
| productId | Product.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| ProductToCategory_pkey | CREATE UNIQUE INDEX "ProductToCategory_pkey" ON public."ProductToCategory" USING btree (id) |

### Region

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| description | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| imageUrls | ARRAY | YES | NULL |
| primaryImageIndex | integer | YES | 0 |
| slug | text | NO | NULL |
| metaTitle | text | YES | NULL |
| metaDescription | text | YES | NULL |
| keywords | ARRAY | YES | NULL |

#### Indexes

| Name | Definition |
|------|------------|
| Region_pkey | CREATE UNIQUE INDEX "Region_pkey" ON public."Region" USING btree (id) |
| Region_slug_unique | CREATE UNIQUE INDEX "Region_slug_unique" ON public."Region" USING btree (slug) |

### Ticket

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| eventId | text | NO | NULL |
| eventDetailId | text | NO | NULL |
| bookingId | text | NO | NULL |
| status | text | NO | 'ACTIVE'::text |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| bookingId | Booking.id | CASCADE |
| eventDetailId | EventTicket.id | RESTRICT |
| eventId | Event.id | NO ACTION |

#### Indexes

| Name | Definition |
|------|------------|
| Ticket_pkey | CREATE UNIQUE INDEX "Ticket_pkey" ON public."Ticket" USING btree (id) |

### TrainingCourse

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| title | text | NO | NULL |
| slug | text | NO | NULL |
| description | text | YES | NULL |
| skillLevel | text | YES | NULL |
| duration | text | YES | NULL |
| scheduleDetails | text | YES | NULL |
| price | double precision | NO | NULL |
| capacity | integer | YES | NULL |
| venueId | text | YES | NULL |
| regionId | text | NO | NULL |
| instructorId | text | YES | NULL |
| imageUrls | ARRAY | YES | NULL |
| primaryImageIndex | integer | YES | 0 |
| isActive | boolean | NO | true |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| isFeatured | boolean | NO | false |
| metaTitle | text | YES | NULL |
| metaDescription | text | YES | NULL |
| keywords | ARRAY | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| instructorId | Instructor.id | SET NULL |
| regionId | Region.id | RESTRICT |
| venueId | Venue.id | SET NULL |

#### Indexes

| Name | Definition |
|------|------------|
| TrainingCourse_pkey | CREATE UNIQUE INDEX "TrainingCourse_pkey" ON public."TrainingCourse" USING btree (id) |
| TrainingCourse_slug_unique | CREATE UNIQUE INDEX "TrainingCourse_slug_unique" ON public."TrainingCourse" USING btree (slug) |

### User

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| email | text | NO | NULL |
| name | text | YES | NULL |
| emailVerified | timestamp without time zone | YES | NULL |
| image | text | YES | NULL |
| role | text | YES | 'user'::text |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Indexes

| Name | Definition |
|------|------------|
| User_email_unique | CREATE UNIQUE INDEX "User_email_unique" ON public."User" USING btree (email) |
| User_pkey | CREATE UNIQUE INDEX "User_pkey" ON public."User" USING btree (id) |

### Venue

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| address | text | NO | NULL |
| capacity | integer | YES | NULL |
| regionId | text | NO | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| latitude | double precision | YES | NULL |
| longitude | double precision | YES | NULL |
| thumbnailUrl | text | YES | NULL |
| imageUrls | ARRAY | YES | NULL |
| isFeatured | boolean | NO | false |
| metaTitle | text | YES | NULL |
| metaDescription | text | YES | NULL |
| keywords | ARRAY | YES | NULL |
| googleMapsUrl | text | YES | NULL |
| remarks | text | YES | NULL |
| socialMediaLinks | jsonb | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| regionId | Region.id | RESTRICT |

#### Indexes

| Name | Definition |
|------|------------|
| Venue_pkey | CREATE UNIQUE INDEX "Venue_pkey" ON public."Venue" USING btree (id) |

### VenueToVenueType

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| venueId | text | NO | NULL |
| venueTypeId | text | NO | NULL |
| isPrimary | boolean | NO | false |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| venueId | Venue.id | CASCADE |
| venueTypeId | VenueType.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| VenueToVenueType_pkey | CREATE UNIQUE INDEX "VenueToVenueType_pkey" ON public."VenueToVenueType" USING btree (id) |
| venue_to_venue_type_unique_idx | CREATE UNIQUE INDEX venue_to_venue_type_unique_idx ON public."VenueToVenueType" USING btree ("venueId", "venueTypeId") |

### VenueType

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| description | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Indexes

| Name | Definition |
|------|------------|
| VenueType_pkey | CREATE UNIQUE INDEX "VenueType_pkey" ON public."VenueType" USING btree (id) |

### account

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| user_id | text | NO | NULL |
| type | text | NO | NULL |
| provider | text | NO | NULL |
| provider_account_id | text | NO | NULL |
| refresh_token | text | YES | NULL |
| access_token | text | YES | NULL |
| expires_at | integer | YES | NULL |
| token_type | text | YES | NULL |
| scope | text | YES | NULL |
| id_token | text | YES | NULL |
| session_state | text | YES | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| user_id | User.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| account_provider_provider_account_id_pk | CREATE UNIQUE INDEX account_provider_provider_account_id_pk ON public.account USING btree (provider, provider_account_id) |
| account_user_id_idx | CREATE INDEX account_user_id_idx ON public.account USING btree (user_id) |

### session

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| session_token | text | NO | NULL |
| user_id | text | NO | NULL |
| expires | timestamp with time zone | NO | NULL |

#### Foreign Keys

| Column | References | On Delete |
|--------|------------|------------|
| user_id | User.id | CASCADE |

#### Indexes

| Name | Definition |
|------|------------|
| session_pkey | CREATE UNIQUE INDEX session_pkey ON public.session USING btree (session_token) |
| session_user_id_idx | CREATE INDEX session_user_id_idx ON public.session USING btree (user_id) |

### verification_token

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| identifier | text | NO | NULL |
| token | text | NO | NULL |
| expires | timestamp with time zone | NO | NULL |

#### Indexes

| Name | Definition |
|------|------------|
| verification_token_identifier_token_pk | CREATE UNIQUE INDEX verification_token_identifier_token_pk ON public.verification_token USING btree (identifier, token) |
| verification_token_token_unique | CREATE UNIQUE INDEX verification_token_token_unique ON public.verification_token USING btree (token) |

