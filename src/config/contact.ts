// Contact configuration
export const contactConfig = {
  // WhatsApp Business configuration
  whatsapp: {
    // Main business number (WhatsApp Business API or WhatsApp Business account)
    phoneNumber: "66123456789", // Replace with your actual WhatsApp Business number
    defaultMessage: "Hello! I'm interested in Muay Thai events and training.",
    
    // Multiple department/staff routing
    departments: {
      general: {
        phoneNumber: "66123456789", // Main business line
        message: "Hello! I'm interested in your Muay Thai services.",
        hours: "Mon-Fri 9AM-6PM (GMT+7)"
      },
      events: {
        phoneNumber: "66123456790", // Events coordinator
        message: "Hi! I'd like to inquire about upcoming Muay Thai events.",
        hours: "Mon-Sun 8AM-10PM (GMT+7)"
      },
      training: {
        phoneNumber: "66123456791", // Training coordinator  
        message: "Hello! I'm interested in Muay Thai training courses.",
        hours: "Mon-Sun 6AM-9PM (GMT+7)"
      },
      venues: {
        phoneNumber: "66123456792", // Venue bookings
        message: "Hi! I'd like to inquire about venue bookings.",
        hours: "Mon-Fri 9AM-5PM (GMT+7)"
      },
      support: {
        phoneNumber: "66123456793", // Customer support
        message: "Hello! I need help with my booking/account.",
        hours: "Mon-Fri 9AM-6PM (GMT+7)"
      }
    },
    
    // Business hours (for main line)
    businessHours: {
      timezone: "Asia/Bangkok",
      weekdays: { start: "09:00", end: "18:00" },
      weekends: { start: "10:00", end: "16:00" },
      closedDays: [] // Empty array means open all days
    }
  },
  
  // Business contact details
  business: {
    name: "ThaiBoxingHub",
    email: "info@thaiboxinghub.com",
    phone: "+66 123 456 789",
    address: "Bangkok, Thailand", // Add your business address
  },
  
  // Social media links
  socialMedia: {
    facebook: "https://facebook.com/thaiboxinghub",
    instagram: "https://instagram.com/thaiboxinghub",
    twitter: "https://twitter.com/thaiboxinghub",
    youtube: "https://youtube.com/@thaiboxinghub",
  },
}; 