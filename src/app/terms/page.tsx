import { Container } from '@/components/ui/Container';

export default function TermsPage() {
  return (
    <Container className="py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-cream/80 rounded-3xl p-8">
          <h1 className="font-display text-4xl text-brown-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            By using Meromade and its services, you acknowledge that you have
            read, understood, and agree to be bound by these Terms of Service.
            Your continued use of our platform constitutes acceptance of these
            terms and any future amendments.
          </p>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            All items available through Meromade are handmade with care and
            attention to detail. Please note that slight variations in color,
            texture, and dimensions are natural characteristics of handmade
            products and should be expected and appreciated as part of their
            unique charm.
          </p>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            We accept returns within 14 days of delivery, provided that the
            items are returned in their original condition and packaging.
            Please contact our customer support team to initiate a return
            request. Shipping costs for returns are the responsibility of the
            customer unless the item is defective or damaged.
          </p>
          <p className="text-brown-800 font-sans text-sm leading-relaxed mb-4">
            Meromade reserves the right to update, modify, or replace any part
            of these Terms of Service at any time. It is your responsibility to
            check this page periodically for changes. Your continued use of the
            platform following the posting of any changes constitutes acceptance
            of those changes.
          </p>
        </div>
      </div>
    </Container>
  );
}
