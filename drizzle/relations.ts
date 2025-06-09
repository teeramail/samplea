import { relations } from "drizzle-orm/relations";
import { realestateBlogCategories, realestateBlogPosts, realestateBillOfMaterials, realestateBomItem, realestateProduct, realestateCards, realestateCategory, realestateAgent, realestateOrder, realestateSubagent, realestateInventoryTransaction, realestateProductionOrder, realestateOrderItem, realestateCommission, user, session, region, venue, venueToVenueType, venueType, event, eventTicket, instructor, trainingCourse, category, product, productToCategory, customer, booking, ticket, courseEnrollment, eventTemplate, eventTemplateTicket, post, realestateProductCategory, account } from "./schema";

export const realestateBlogCategoriesRelations = relations(realestateBlogCategories, ({one, many}) => ({
	realestateBlogCategory: one(realestateBlogCategories, {
		fields: [realestateBlogCategories.parentId],
		references: [realestateBlogCategories.id],
		relationName: "realestateBlogCategories_parentId_realestateBlogCategories_id"
	}),
	realestateBlogCategories: many(realestateBlogCategories, {
		relationName: "realestateBlogCategories_parentId_realestateBlogCategories_id"
	}),
	realestateBlogPosts: many(realestateBlogPosts),
}));

export const realestateBlogPostsRelations = relations(realestateBlogPosts, ({one, many}) => ({
	realestateBlogCategory: one(realestateBlogCategories, {
		fields: [realestateBlogPosts.categoryId],
		references: [realestateBlogCategories.id]
	}),
	realestateCards: many(realestateCards),
}));

export const realestateBomItemRelations = relations(realestateBomItem, ({one}) => ({
	realestateBillOfMaterial: one(realestateBillOfMaterials, {
		fields: [realestateBomItem.bomId],
		references: [realestateBillOfMaterials.id]
	}),
	realestateProduct: one(realestateProduct, {
		fields: [realestateBomItem.componentProductId],
		references: [realestateProduct.id]
	}),
}));

export const realestateBillOfMaterialsRelations = relations(realestateBillOfMaterials, ({one, many}) => ({
	realestateBomItems: many(realestateBomItem),
	realestateProduct: one(realestateProduct, {
		fields: [realestateBillOfMaterials.finishedProductId],
		references: [realestateProduct.id]
	}),
	realestateProductionOrders: many(realestateProductionOrder),
}));

export const realestateProductRelations = relations(realestateProduct, ({many}) => ({
	realestateBomItems: many(realestateBomItem),
	realestateInventoryTransactions: many(realestateInventoryTransaction),
	realestateBillOfMaterials: many(realestateBillOfMaterials),
	realestateOrderItems: many(realestateOrderItem),
	realestateProductCategories: many(realestateProductCategory),
}));

export const realestateCardsRelations = relations(realestateCards, ({one}) => ({
	realestateBlogPost: one(realestateBlogPosts, {
		fields: [realestateCards.blogPostId],
		references: [realestateBlogPosts.id]
	}),
}));

export const realestateCategoryRelations = relations(realestateCategory, ({one, many}) => ({
	realestateCategory: one(realestateCategory, {
		fields: [realestateCategory.parentId],
		references: [realestateCategory.id],
		relationName: "realestateCategory_parentId_realestateCategory_id"
	}),
	realestateCategories: many(realestateCategory, {
		relationName: "realestateCategory_parentId_realestateCategory_id"
	}),
	realestateProductCategories: many(realestateProductCategory),
}));

export const realestateOrderRelations = relations(realestateOrder, ({one, many}) => ({
	realestateAgent: one(realestateAgent, {
		fields: [realestateOrder.agentId],
		references: [realestateAgent.id]
	}),
	realestateSubagent: one(realestateSubagent, {
		fields: [realestateOrder.subagentId],
		references: [realestateSubagent.id]
	}),
	realestateInventoryTransactions: many(realestateInventoryTransaction),
	realestateOrderItems: many(realestateOrderItem),
	realestateCommissions: many(realestateCommission),
}));

export const realestateAgentRelations = relations(realestateAgent, ({many}) => ({
	realestateOrders: many(realestateOrder),
	realestateSubagents: many(realestateSubagent),
	realestateCommissions: many(realestateCommission),
}));

export const realestateSubagentRelations = relations(realestateSubagent, ({one, many}) => ({
	realestateOrders: many(realestateOrder),
	realestateAgent: one(realestateAgent, {
		fields: [realestateSubagent.agentId],
		references: [realestateAgent.id]
	}),
	realestateCommissions: many(realestateCommission),
}));

export const realestateInventoryTransactionRelations = relations(realestateInventoryTransaction, ({one}) => ({
	realestateProduct: one(realestateProduct, {
		fields: [realestateInventoryTransaction.productId],
		references: [realestateProduct.id]
	}),
	realestateOrder: one(realestateOrder, {
		fields: [realestateInventoryTransaction.orderId],
		references: [realestateOrder.id]
	}),
	realestateProductionOrder: one(realestateProductionOrder, {
		fields: [realestateInventoryTransaction.productionOrderId],
		references: [realestateProductionOrder.id]
	}),
}));

export const realestateProductionOrderRelations = relations(realestateProductionOrder, ({one, many}) => ({
	realestateInventoryTransactions: many(realestateInventoryTransaction),
	realestateBillOfMaterial: one(realestateBillOfMaterials, {
		fields: [realestateProductionOrder.bomId],
		references: [realestateBillOfMaterials.id]
	}),
}));

export const realestateOrderItemRelations = relations(realestateOrderItem, ({one}) => ({
	realestateOrder: one(realestateOrder, {
		fields: [realestateOrderItem.orderId],
		references: [realestateOrder.id]
	}),
	realestateProduct: one(realestateProduct, {
		fields: [realestateOrderItem.productId],
		references: [realestateProduct.id]
	}),
}));

export const realestateCommissionRelations = relations(realestateCommission, ({one}) => ({
	realestateOrder: one(realestateOrder, {
		fields: [realestateCommission.orderId],
		references: [realestateOrder.id]
	}),
	realestateAgent: one(realestateAgent, {
		fields: [realestateCommission.agentId],
		references: [realestateAgent.id]
	}),
	realestateSubagent: one(realestateSubagent, {
		fields: [realestateCommission.subagentId],
		references: [realestateSubagent.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	instructors: many(instructor),
	customers: many(customer),
	posts: many(post),
	accounts: many(account),
}));

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
	eventTickets: many(eventTicket),
	bookings: many(booking),
	tickets: many(ticket),
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

export const customerRelations = relations(customer, ({one, many}) => ({
	user: one(user, {
		fields: [customer.userId],
		references: [user.id]
	}),
	bookings: many(booking),
	courseEnrollments: many(courseEnrollment),
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

export const realestateProductCategoryRelations = relations(realestateProductCategory, ({one}) => ({
	realestateProduct: one(realestateProduct, {
		fields: [realestateProductCategory.productId],
		references: [realestateProduct.id]
	}),
	realestateCategory: one(realestateCategory, {
		fields: [realestateProductCategory.categoryId],
		references: [realestateCategory.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));