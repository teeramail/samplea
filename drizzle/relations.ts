import { relations } from "drizzle-orm/relations";
import { region, venue, venueToVenueType, venueType, event, eventCategory, eventTicket, instructor, trainingCourse, user, category, product, productToCategory, customer, booking, ticket, courseEnrollment, eventTemplate, eventTemplateTicket, post } from "./schema";

export const venueRelations = relations(venue, ({one, many}) => ({
	region: one(region, {
		fields: [venue.regionId],
		references: [region.id]
	}),
	venueToVenueTypes: many(venueToVenueType),
	events: many(event),
	trainingCourses: many(trainingCourse),
	eventTemplates: many(eventTemplate),
}));

export const regionRelations = relations(region, ({many}) => ({
	venues: many(venue),
	events: many(event),
	trainingCourses: many(trainingCourse),
	eventTemplates: many(eventTemplate),
	posts: many(post),
}));

export const venueToVenueTypeRelations = relations(venueToVenueType, ({one}) => ({
	venue: one(venue, {
		fields: [venueToVenueType.venueId],
		references: [venue.id]
	}),
	venueType: one(venueType, {
		fields: [venueToVenueType.venueTypeId],
		references: [venueType.id]
	}),
}));

export const venueTypeRelations = relations(venueType, ({many}) => ({
	venueToVenueTypes: many(venueToVenueType),
}));

export const eventRelations = relations(event, ({one, many}) => ({
	region: one(region, {
		fields: [event.regionId],
		references: [region.id]
	}),
	venue: one(venue, {
		fields: [event.venueId],
		references: [venue.id]
	}),
	eventCategory: one(eventCategory, {
		fields: [event.categoryId],
		references: [eventCategory.id]
	}),
	eventTickets: many(eventTicket),
	bookings: many(booking),
	tickets: many(ticket),
}));

export const eventCategoryRelations = relations(eventCategory, ({many}) => ({
	events: many(event),
}));

export const eventTicketRelations = relations(eventTicket, ({one, many}) => ({
	event: one(event, {
		fields: [eventTicket.eventId],
		references: [event.id]
	}),
	tickets: many(ticket),
}));

export const trainingCourseRelations = relations(trainingCourse, ({one, many}) => ({
	instructor: one(instructor, {
		fields: [trainingCourse.instructorId],
		references: [instructor.id]
	}),
	region: one(region, {
		fields: [trainingCourse.regionId],
		references: [region.id]
	}),
	venue: one(venue, {
		fields: [trainingCourse.venueId],
		references: [venue.id]
	}),
	courseEnrollments: many(courseEnrollment),
}));

export const instructorRelations = relations(instructor, ({one, many}) => ({
	trainingCourses: many(trainingCourse),
	user: one(user, {
		fields: [instructor.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	instructors: many(instructor),
	customers: many(customer),
	posts: many(post),
}));

export const productRelations = relations(product, ({one, many}) => ({
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	productToCategories: many(productToCategory),
}));

export const categoryRelations = relations(category, ({many}) => ({
	products: many(product),
	productToCategories: many(productToCategory),
}));

export const productToCategoryRelations = relations(productToCategory, ({one}) => ({
	product: one(product, {
		fields: [productToCategory.productId],
		references: [product.id]
	}),
	category: one(category, {
		fields: [productToCategory.categoryId],
		references: [category.id]
	}),
}));

export const bookingRelations = relations(booking, ({one, many}) => ({
	customer: one(customer, {
		fields: [booking.customerId],
		references: [customer.id]
	}),
	event: one(event, {
		fields: [booking.eventId],
		references: [event.id]
	}),
	tickets: many(ticket),
}));

export const customerRelations = relations(customer, ({one, many}) => ({
	bookings: many(booking),
	user: one(user, {
		fields: [customer.userId],
		references: [user.id]
	}),
	courseEnrollments: many(courseEnrollment),
}));

export const ticketRelations = relations(ticket, ({one}) => ({
	booking: one(booking, {
		fields: [ticket.bookingId],
		references: [booking.id]
	}),
	eventTicket: one(eventTicket, {
		fields: [ticket.eventDetailId],
		references: [eventTicket.id]
	}),
	event: one(event, {
		fields: [ticket.eventId],
		references: [event.id]
	}),
}));

export const courseEnrollmentRelations = relations(courseEnrollment, ({one}) => ({
	trainingCourse: one(trainingCourse, {
		fields: [courseEnrollment.courseId],
		references: [trainingCourse.id]
	}),
	customer: one(customer, {
		fields: [courseEnrollment.customerId],
		references: [customer.id]
	}),
}));

export const eventTemplateRelations = relations(eventTemplate, ({one, many}) => ({
	region: one(region, {
		fields: [eventTemplate.regionId],
		references: [region.id]
	}),
	venue: one(venue, {
		fields: [eventTemplate.venueId],
		references: [venue.id]
	}),
	eventTemplateTickets: many(eventTemplateTicket),
}));

export const eventTemplateTicketRelations = relations(eventTemplateTicket, ({one}) => ({
	eventTemplate: one(eventTemplate, {
		fields: [eventTemplateTicket.eventTemplateId],
		references: [eventTemplate.id]
	}),
}));

export const postRelations = relations(post, ({one}) => ({
	user: one(user, {
		fields: [post.authorId],
		references: [user.id]
	}),
	region: one(region, {
		fields: [post.regionId],
		references: [region.id]
	}),
}));