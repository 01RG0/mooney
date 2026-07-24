import { Container } from '@/components/ui/Container';

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-cream/80 rounded-3xl p-8">
          <h1 className="font-display text-4xl text-brown-900 mb-6">
            Privacy Policy
          </h1>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            We collect your email address and name solely for the purpose of
            processing your orders and providing you with order confirmations and
            shipping updates. This information is necessary to fulfill your
            requests and deliver the products you purchase from Meromade.
          </p>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            We do not share your personal data with third parties except as
            necessary for order fulfillment, such as with our trusted shipping
            partners. Your information is kept confidential and used only to
            facilitate the delivery of your purchased items and related
            customer service.
          </p>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            You may request the deletion of your personal data by contacting us
            directly through our customer support channels. We will process your
            request in accordance with applicable data protection regulations
            and remove your information from our active systems.
          </p>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            Cookies are used on our website exclusively for authentication
            purposes to enhance your browsing experience and maintain your
            session security. We do not use cookies for tracking or advertising
            purposes.
          </p>
        </div>
      </div>
    </Container>
  );
}
