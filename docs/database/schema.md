# PostgreSQL Database Schema Documentation

*Generated on: 4/21/2025, 7:10:31 AM*

## Table of Contents

- [Enum Types](#enum-types)
- [Tables](#tables)
  - [Booking](#booking)
  - [CourseEnrollment](#courseenrollment)
  - [Customer](#customer)
  - [Event](#event)
  - [EventTemplate](#eventtemplate)
  - [EventTemplateTicket](#eventtemplateticket)
  - [EventTicket](#eventticket)
  - [Fighter](#fighter)
  - [Instructor](#instructor)
  - [Post](#post)
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

## Enum Types

### recurrence_type

Values: `monthly`, `weekly`, `none`


## Tables

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
| customerId | Customer(id) | RESTRICT |
| eventId | Event(id) | CASCADE |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Ticket | bookingId | CASCADE |

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
| courseId | TrainingCourse(id) | CASCADE |
| customerId | Customer(id) | RESTRICT |

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
| userId | User(id) | SET NULL |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Booking | customerId | RESTRICT |
| CourseEnrollment | customerId | RESTRICT |

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
| regionId | Region(id) | SET NULL |
| venueId | Venue(id) | SET NULL |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Booking | eventId | CASCADE |
| EventTicket | eventId | CASCADE |
| Ticket | eventId | NO ACTION |

### EventTemplate

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| templateName | text | NO | NULL |
| venueId | text | NO | NULL |
| regionId | text | NO | NULL |
| defaultTitleFormat | text | NO | NULL |
| defaultDescription | text | YES | NULL |
| recurringDaysOfWeek | ARRAY | NO | NULL |
| defaultStartTime | time without time zone | NO | NULL |
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
| regionId | Region(id) | RESTRICT |
| venueId | Venue(id) | RESTRICT |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| EventTemplateTicket | eventTemplateId | CASCADE |

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
| eventTemplateId | EventTemplate(id) | CASCADE |

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
| eventId | Event(id) | CASCADE |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Ticket | eventDetailId | RESTRICT |

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
| userId | User(id) | SET NULL |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| TrainingCourse | instructorId | SET NULL |

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
| authorId | User(id) | SET NULL |
| regionId | Region(id) | SET NULL |

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

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Event | regionId | SET NULL |
| EventTemplate | regionId | RESTRICT |
| Post | regionId | SET NULL |
| TrainingCourse | regionId | RESTRICT |
| Venue | regionId | RESTRICT |

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
| bookingId | Booking(id) | CASCADE |
| eventDetailId | EventTicket(id) | RESTRICT |
| eventId | Event(id) | NO ACTION |

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
| instructorId | Instructor(id) | SET NULL |
| regionId | Region(id) | RESTRICT |
| venueId | Venue(id) | SET NULL |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| CourseEnrollment | courseId | CASCADE |

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

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Customer | userId | SET NULL |
| Instructor | userId | SET NULL |
| Post | authorId | SET NULL |
| account | user_id | CASCADE |
| session | user_id | CASCADE |

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
| regionId | Region(id) | RESTRICT |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| Event | venueId | SET NULL |
| EventTemplate | venueId | RESTRICT |
| TrainingCourse | venueId | SET NULL |
| VenueToVenueType | venueId | CASCADE |

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
| venueId | Venue(id) | CASCADE |
| venueTypeId | VenueType(id) | CASCADE |

### VenueType

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| id | text | NO | NULL |
| name | text | NO | NULL |
| description | text | YES | NULL |
| createdAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |
| updatedAt | timestamp without time zone | NO | CURRENT_TIMESTAMP |

#### Referenced By

| Table | Column | On Delete |
|-------|--------|------------|
| VenueToVenueType | venueTypeId | CASCADE |

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
| user_id | User(id) | CASCADE |

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
| user_id | User(id) | CASCADE |

### verification_token

#### Columns

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|----------|
| identifier | text | NO | NULL |
| token | text | NO | NULL |
| expires | timestamp with time zone | NO | NULL |

