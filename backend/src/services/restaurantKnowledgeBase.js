
const restaurantData = {
  faq: [
    { question: "What are your hours?", answer: "We are open Monday to Friday from 11 AM to 10 PM, and on weekends from 10 AM to 11 PM." },
    { question: "Do you have vegetarian options?", answer: "Yes, we have a variety of vegetarian dishes. Please ask your server for recommendations." },
    { question: "Do you offer delivery?", answer: "Yes, we offer delivery through our partners: Uber Eats, DoorDash, and Grubhub." },
  ],
  menu: {
    appetizers: [
      { name: "Garlic Bread", price: 5.99 },
      { name: "Fried Calamari", price: 10.99 },
    ],
    mainCourses: [
      { name: "Spaghetti Carbonara", price: 15.99 },
      { name: "Margherita Pizza", price: 14.50 },
      { name: "Grilled Salmon", price: 22.00 },
    ],
    desserts: [
      { name: "Tiramisu", price: 7.00 },
      { name: "Cheesecake", price: 6.50 },
    ],
  },
  policies: {
    reservations: "Reservations are recommended, especially for large groups and during peak hours.",
    cancellation: "Please notify us at least 24 hours in advance for any reservation cancellations.",
    petPolicy: "Only service animals are allowed inside the restaurant.",
  },
  hours: "Monday-Friday: 11 AM - 10 PM, Saturday-Sunday: 10 AM - 11 PM",
  location: "123 Main Street, Anytown, USA",
};

function getRestaurantInfo(query) {
  query = query.toLowerCase();

  if (query.includes("faq") || query.includes("frequently asked questions")) {
    return restaurantData.faq;
  } else if (query.includes("menu")) {
    return restaurantData.menu;
  } else if (query.includes("policies")) {
    return restaurantData.policies;
  } else if (query.includes("hours")) {
    return restaurantData.hours;
  } else if (query.includes("location") || query.includes("address")) {
    return restaurantData.location;
  } else {
    return "I'm sorry, I don't have information on that. Please try asking about FAQ, Menu, Policies, Hours, or Location.";
  }
}

export { getRestaurantInfo };
