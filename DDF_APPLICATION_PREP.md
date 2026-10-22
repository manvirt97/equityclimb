# Apply for a genuine EquityClimb Homes listing feed

## Start here

CREA's REALTOR.ca DDF **Real Estate Advertising Websites** page: https://www.realtor.ca/ddf/real-estate-advertising-websites

Click **Apply now** and explain that EquityClimb is an independent Canadian financial-education and property-discovery website.

Suggested business description (edit to reflect actual company status):

> EquityClimb is a Canadian consumer financial-literacy and planning web application. We want to add an independently designed property-discovery experience where users can find active Canadian homes, apply search criteria, save properties, and understand general mortgage and ownership costs. We are interested in the REALTOR.ca DDF Real Estate Advertising Website program and the applicable restrictions on listing display, agent attribution, lead routing, permitted derived calculations, refresh/deletion, advertising-only use, fees and coverage. Please advise whether this business model qualifies for access, and the required application and technical steps.

## Ask CREA these questions BEFORE promising live inventory

1. Is EquityClimb as an independent consumer education app eligible for an advertising website licence?
2. Can listings appear within Homes next to an independent mortgage/ownership cost simulator, without altering listing details?
3. What photos, addresses, map locations, broker and agent names, trademarks and attribution must be displayed?
4. Are there restrictions on bookmarking properties, price change alerts, saved searches, or displaying historical sold prices?
5. What use of the Leads API is mandatory, and how must inquiries be routed to the listing agent?
6. What data coverage, refresh/deletion interval, per-feed fees, uptime and approval times are applicable?
7. Are other services/data agreements needed for neighbourhood and market-level statistics?

## After approval

Keep credentials as Cloudflare **Secrets**, never in GitHub. Build a separate OAuth + DDF Web API adapter with server-side caching, replication/removal, approved listing cards, source labels and lead routing as the agreement specifies. Re-test before turning on public inventory.

While waiting, EquityClimb Homes remains a usable city explorer, saved-criteria, manual shortlist, map context and financial decision tool—NOT a live MLS portal.
