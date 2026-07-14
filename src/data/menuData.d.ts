declare module "@/data/menuData.js" {
  export const brand: {
    name: string; tagline: string; description: string; currency: string;
    supportPhones: string[]; supportInstagram: string; techPhone: string;
    techEmail: string; orderEmail: string; freeDeliveryAbove: number;
  };
  export const emailConfig: { serviceId: string; templateId: string; publicKey: string };
  export const offers: { id: string; title: string; subtitle: string }[];
  export const bowls: {
    id: string; name: string; weight: string; price: number; image: string; badge: string | null;
  }[];
  export const fruits: {
    id: string; name: string; serving: string; price: number; image: string;
  }[];
  export const extras: { id: string; name: string; price: number; emoji: string }[];
}