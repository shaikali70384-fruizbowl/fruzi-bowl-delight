// Edit this file to update the menu, fruits, offers, extras, brand, or delivery
// email settings. Everything on the site reads from here.

import bowlMini from "@/assets/bowl-mini.png";
import bowlRegular from "@/assets/bowl-regular.png";
import bowlPremium from "@/assets/bowl-premium.png";
import bowlFamily from "@/assets/bowl-family.png";
import fBanana from "@/assets/fruit-banana.png";
import fApple from "@/assets/fruit-apple.png";
import fDragon from "@/assets/fruit-dragonfruit.png";
import fGuava from "@/assets/fruit-guava.png";
import fGrapes from "@/assets/fruit-grapes.png";
import fOrange from "@/assets/fruit-orange.png";
import fPapaya from "@/assets/fruit-papaya.png";
import fPineapple from "@/assets/fruit-pineapple.png";
import fWatermelon from "@/assets/fruit-watermelon.png";
import fPomegranate from "@/assets/fruit-pomegranate.png";

export const brand = {
  name: "Fruzi Bowl",
  tagline: "Fresh • Healthy • Delivered",
  description:
    "Premium fruit bowls made from farm-fresh produce, delivered to your doorstep in minutes.",
  currency: "₹",
  supportPhones: ["+91 70323 11195", "+91 88852 68996"],
  supportInstagram: "@fruzi_bowl",
  techPhone: "+91 76609 87151",
  techEmail: "shafimunnashaik222@gmail.com",
  orderEmail: "shaikali70384@gmail.com",
  freeDeliveryAbove: 199,
};

// Fill in your EmailJS keys (https://www.emailjs.com/) to send orders by email.
// Leaving them blank falls back to opening the user's mail app with the order.
export const emailConfig = {
  serviceId: "",
  templateId: "",
  publicKey: "",
};

export const offers = [
  { id: "combo", title: "Buy 5 Bowls, Get 1 Free", subtitle: "Automatically applied at cart" },
  { id: "free-delivery", title: "Free Delivery Above ₹199", subtitle: "On every order across the city" },
];

export const bowls = [
  { id: "mini",    name: "Mini Fruzi Bowl",    weight: "180–200g", price: 59,  image: bowlMini,    badge: null },
  { id: "regular", name: "Regular Fruzi Bowl", weight: "250–280g", price: 79,  image: bowlRegular, badge: "Best Seller" },
  { id: "premium", name: "Premium Fruzi Bowl", weight: "350–400g", price: 109, image: bowlPremium, badge: null },
  { id: "family",  name: "Family Fruzi Bowl",  weight: "500–550g", price: 149, image: bowlFamily,  badge: null },
];

export const fruits = [
  { id: "banana",      name: "Banana",       serving: "100g", price: 15, image: fBanana },
  { id: "apple",       name: "Apple",        serving: "100g", price: 15, image: fApple },
  { id: "dragonfruit", name: "Dragon Fruit", serving: "100g", price: 15, image: fDragon },
  { id: "guava",       name: "Guava",        serving: "100g", price: 15, image: fGuava },
  { id: "grapes",      name: "Grapes",       serving: "100g", price: 15, image: fGrapes },
  { id: "orange",      name: "Orange",       serving: "100g", price: 15, image: fOrange },
  { id: "papaya",      name: "Papaya",       serving: "100g", price: 15, image: fPapaya },
  { id: "pineapple",   name: "Pineapple",    serving: "100g", price: 15, image: fPineapple },
  { id: "watermelon",  name: "Watermelon",   serving: "100g", price: 15, image: fWatermelon },
  { id: "pomegranate", name: "Pomegranate",  serving: "100g", price: 15, image: fPomegranate },
];

export const extras = [
  { id: "honey",       name: "Honey",             price: 15, emoji: "🍯" },
  { id: "yogurt",      name: "Yogurt",            price: 15, emoji: "🥛" },
  { id: "vanilla-ice", name: "Vanilla Ice Cream", price: 30, emoji: "🍨" },
  { id: "choco-ice",   name: "Chocolate Ice Cream", price: 30, emoji: "🍫" },
];