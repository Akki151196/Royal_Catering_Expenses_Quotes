# Project memory

## Product intent & audience

- Event catering quotes + expenses tracker app (admin/operations side)
- Users are catering business operators who create quotes, schedule orders, track expenses, and communicate with customers
- Public shareable quote page at `/quotation/:id` for customer viewing
- Goal: feel like a world-class SaaS product — premium, mobile-first, polished

## Brand personality & voice

- Professional, practical, production-grade; focused on operational efficiency
- Straightforward and friendly customer communication

## Visual design & UX direction

- Stack: Vite + React, Tailwind CSS, lucide-react icons, React hooks; no extra UI/icon/theme packages
- Mobile-first responsive across mobile, tablet, desktop
- Rounded cards, sophisticated color palette, modern typography
- Smooth animations, fluid transitions, micro-interactions, polished loading states, interactive buttons
- Share modal pattern: WhatsApp, email, device share (PDF attached), copy-link, download PDF
- Calendar detail popup → "View Full Order" button linking to full quote view
- Local-date handling in date keys (not UTC conversion); shared date helpers extracted for reuse
- Analytics page: green revenue card uses Indian Rupee icon (`IndianRupee`); another `DollarSign` icon elsewhere intentionally unchanged

## Decisions, constraints & rationale

- Quotes serve as both quote and invoice; no separate invoice document. Payment status and balance live on the quote
- Calendar date bug (`toISOString()` shifted local midnight → UTC) fixed by parsing local Y/M/D parts
- Broken calendar link (`/admin/quotations/view/:id` non-existent) replaced with working route
- PDF generator returns a file object (not just `doc.save`) enabling device share with attachment
- Public `/quotation/:id` reused as shareable link target; no auth on that route
- Indian currency (₹) confirmed; Analytics revenue card localized, rest pending
- Dashboard rebuilt: status tiles (Total, Accepted, Pending, Rejected) now filter the list; search by client, quote number, event type; Share action in both table rows and mobile cards; shared local-date helpers wired in
- Build passes; browser/device testing not available — user asked to test on device

## Open questions & assumptions

- Assuming single-business deployment (no multi-tenant)
- Email uses `mailto:` deep link; WhatsApp uses `wa.me` links; no backend email sending
- Separate invoice document may be needed later; currently out of scope
- Currency localization scope unclear: only Analytics card changed; other screens, PDF output, customer pages may still show `$` / `DollarSign` — full pass likely needed
- Calendar event source: quotes with scheduled dates; exact schema for "scheduled date" field not confirmed
- Still-open from SaaS brief: food/menu item cards, live price calculations during quote creation, expenses tracker module, and broader polish/animations pass across the app — not yet implemented