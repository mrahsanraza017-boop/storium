import { BusinessSettings } from '../types';

/**
 * Default business information, policies and public copy for the store.
 * All of these values are editable by the store owner from
 * Admin -> Business Settings. Nothing here claims a legal/registered
 * name, NTN, certificates or government records — those are kept private
 * and submitted directly to the merchant/payment provider.
 */
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: 'STORIUM',
  legalBusinessName: '',
  tagline: 'Wear your presence',
  description:
    'STORIUM is an online retail store based in Pakistan offering luxury watches, men’s accessories and essential fashion items with nationwide delivery and secure payment options.',
  email: 'Storium.store@gmail.com',
  phone: '+92 321 5993022',
  whatsappLink: 'https://wa.me/923215993022',
  address: 'ANWAR SHAHID COLONY RENALA',
  city: 'Renala Khurd',
  province: 'Punjab',
  country: 'Pakistan',
  workingHours: 'Monday – Saturday: 10:00 AM – 10:00 PM PKT',
  paymentGatewayName: 'Rapid Gateway',
  shippingFreeAbove: 15000,
  shippingFlatFee: 500,
  socials: {
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  },
  storefrontImage: '',
  businessModel: `We are an online retail store based in Pakistan selling watches, men's accessories and fashion essentials. The products you see in our catalogue are the items we sell; where we have physical inventory photographs they are used on the product pages, and product information, pricing and availability are kept up to date in our admin panel.

Browsing: Customers browse the catalogue by category (Watches, Men's Accessories, and the full showroom), search for products by name, and open product pages to read full descriptions, specifications, prices in Pakistani Rupees (PKR), available variants and stock status before choosing to add an item to the shopping bag.

Placing an order: At checkout, customers enter their delivery and contact details (name, email, phone, city, and complete address) and choose how they want to pay.

Payment: Two payment options are offered. Cash on Delivery (COD) lets the customer pay the courier when the parcel arrives. Card payments are processed securely through our integrated payment gateway, which redirects the customer to a hosted, PCI-compliant payment page. We never see or store full card details; the gateway notifies our system of the payment result.

Order handling: Once an order is placed (and payment is confirmed for card orders, or the order is verified for COD), the order appears in our admin panel. It is checked against available stock, packed, and handed to our courier partners for nationwide delivery. The customer immediately receives an order confirmation with their order number, and can view order status, payment status and courier tracking details in their account.

Delivery: Orders are delivered by courier to the address provided by the customer. Where a tracking reference is issued by the courier, it is recorded against the order and shown in the customer's account.

Support: For questions about products, orders, delivery or returns, customers can use the contact form on the website or reach us directly by email or phone/WhatsApp during our working hours listed on the Contact page.`,
  securePaymentCopy: `1. Select a product from the catalogue and open its page to confirm the details, price and any available variants.
2. Add the product to your shopping bag and review the bag at any time to update quantities or remove items.
3. Proceed to checkout when you are ready.
4. Enter your contact and delivery information (name, email, phone and complete shipping address).
5. Select your payment method — Cash on Delivery or card payment.
6. For card payments you are redirected to our secure payment gateway. The transaction is processed by the gateway on its own hosted, encrypted page, so your card details are never stored on our servers.
7. Once the payment is accepted (or your COD order is confirmed) you receive an order confirmation with your order number, order summary, total amount and payment status.
8. Your order is then prepared, packed and shipped to the address you provided, and you can track its status from your account.`,
  policies: {
    shipping: `## 1. Order Processing
Orders are confirmed after checkout (and, for card payments, after the payment is successfully processed by our gateway). Confirmed orders are prepared and handed to our courier partners for nationwide delivery within Pakistan.

## 2. Delivery Timelines
Delivery time depends on the destination. Orders to major cities typically arrive within 1 to 4 working days after dispatch; other destinations generally take 5 to 7 working days depending on the courier service and route.

## 3. Delivery Charges
Standard courier charges apply to all order and are shown clearly at checkout before you confirm your order. Orders with a subtotal of Rs. {shippingFreeAbove} or more qualify for complimentary delivery within Pakistan.

## 4. Cash on Delivery
Cash on Delivery is available for eligible destinations. The full order amount is payable to the courier rider upon delivery. Please keep the exact amount ready where possible.

## 5. Tracking & Status
Once your order is dispatched, the status is updated in your account and, where the courier issues one, a tracking reference is recorded against your order.

## 6. Contact
For any delivery-related question, contact us at {email} or {phone} during our working hours ({workingHours}).`,
    refund: `## 1. Inspection Window
We want you to be happy with your purchase. If you are not fully satisfied, you may be able to exchange or return eligible items within the window described below, counted from the date of delivery.

## 2. Return Conditions
To be eligible for a return or exchange, items must be unused, unworn and in their original packaging with all labels, tags and accessories intact, and must show no signs of wear, damage or alteration.

## 3. How to Start a Return
Contact us at {email} or {phone} with your order number and the reason for the return. Our team will confirm whether the item is eligible and provide the next steps.

## 4. Refund Processing
After we receive and inspect an eligible returned item, approved refunds are processed back to the original payment method or via a recognised domestic payout method (such as a direct bank transfer), typically within a reasonable processing period from approval.

## 5. Non-Refundable Situations
Refunds are not available where items have been worn, damaged after delivery, or returned without the required packaging and accessories, except as required by applicable consumer law in Pakistan.

## 6. Contact
For questions about returns and refunds, contact us at {email} or {phone} during our working hours ({workingHours}).`,
    privacy: `## 1. Information We Collect
We collect information that you provide when you browse our website, create an account, place an order or contact us. This may include your name, email address, phone number, delivery address and order details.

## 2. How We Use Your Information
We use your information to process and deliver your orders, provide customer support, send you transactional updates about your order, maintain your account and wishlist, improve our website, and comply with legal obligations in Pakistan. When you pay by card, payment is processed by our payment gateway provider; we do not store full card details.

## 3. How We Share Information
We share your information only with trusted service providers who help us operate the store — such as couriers delivering your parcel and the payment gateway processing your payment — under confidentiality obligations, and otherwise only where required by law.

## 4. Data Retention & Security
We keep your information only for as long as needed for the purposes described here and apply reasonable technical and organisational safeguards to protect it against unauthorised access, alteration, disclosure or loss.

## 5. Your Rights
Subject to applicable law in Pakistan, you may request access to, correction of, or deletion of your personal information. To make such a request, contact us at {email}.

## 6. Cookies & Website Data
Our website may use small data files (cookies) to remember your preferences, keep your shopping bag, and improve your experience. You can disable cookies through your browser settings; some parts of the site may not work as intended if cookies are disabled.

## 7. Contact
For any privacy-related questions, contact us at {email} or {phone}.`,
    terms: `## 1. Acceptance of Terms
By using this website and placing an order, you agree to these Terms and Conditions. If you do not agree with any part of these terms, please do not use the website.

## 2. Products & Pricing
All prices are listed in Pakistani Rupees (PKR). We make every reasonable effort to keep product information, images and prices accurate and current, but we reserve the right to correct errors and to change prices, descriptions and availability at any time without prior notice.

## 3. Orders & Payment
Placing an order constitutes an offer to purchase. An order is confirmed once payment is successfully processed through our payment gateway, or — in the case of Cash on Delivery — once the order has been verified. We may decline or cancel an order where payment cannot be authenticated, the payment gateway declines the transaction, or the item is unavailable.

## 4. Delivery
Delivery is arranged through third-party courier services to the address you provide. The relevant risk and responsibility for the parcel transfer to you upon delivery, subject to any courier insurance arrangements.

## 5. Returns & Refunds
Returns, exchanges and refunds are governed by our Refund Policy, which forms part of these Terms and Conditions.

## 6. Intellectual Property
All content on this website, including logos, images, text and graphics, is the property of {businessName} and may not be reproduced or used without prior written permission.

## 7. Limitation of Liability
To the maximum extent permitted by law in Pakistan, {businessName} is not liable for indirect, incidental or consequential losses arising from use of the website or from any order, except where liability cannot be excluded by law.

## 8. Governing Law
These Terms and Conditions are governed by the laws of the Islamic Republic of Pakistan, and any disputes are subject to the exclusive jurisdiction of the competent courts in Pakistan.

## 9. Contact
For questions about these Terms and Conditions, contact us at {email} or {phone}.`,
  },
  gatewayNotes:
    'Payment gateway (merchant) configuration is private. Account credentials, merchant IDs, and any tax/registration certificates are never published on the website and are shared directly with the payment provider during onboarding.',
};