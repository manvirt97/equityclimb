# EquityClimb Homes — Live MLS Data and Launch Requirements

## Why inventory is disabled by default

REALTOR.ca and Zolo listing pages are not a free public redistribution API. Using third-party listing photos, sold data, brokerage contact details or complete listings without authorization can violate contractual rights and intellectual-property restrictions. EquityClimb does not scrape these websites or fabricate an inventory.

## Option implemented: Repliers

The server-side adapter in `functions/api/homes.js` uses `https://api.repliers.io/listings` and the `REPLIERS-API-KEY` **secret** header, with validated city/price/type/bedroom/page filters. It normalizes the response and sends only an approved subset to the browser. Users never see the API key. A disabled feed returns an honest empty-state response.

Developer references:
- https://docs.repliers.io/reference/getting-started-with-your-api
- https://help.repliers.com/en/article/starter-prompts-for-ai-assisted-development-using-repliers-1lun9ug/

Do not activate this without a current agreement authorizing use of the specific MLS data and images on your actual site. Different boards may have different restrictions and field conventions. Data returned by the provider may vary across regions; verify actual JSON and adjust field mapping before public launch.

## Alternative: REALTOR.ca DDF Real Estate Advertising Website

- https://www.realtor.ca/ddf/real-estate-advertising-websites
- https://support.crea.ca/DDF/Home/reaw

CREA has a separate DDF program and application process. It is **not interchangeable** with Repliers and **is not integrated into the included code**. If approved for DDF, you would need an entirely separate compliant ingestion/rendering flow, including the required link to REALTOR.ca, Powered by badge, brokerage/agent identification, listing agent lead API, analytics integration, coverage and refresh/removal policies. Do not repurpose the Repliers endpoint as a DDF endpoint.

## Pre-launch checklist for live listings

- [ ] Written MLS/feed rights for your domain and display fields.
- [ ] Confirm whether the feed permits map pins, cards, images, brokerage and agent attribution, links, search and derived financial comparisons.
- [ ] Confirm search performance and cost limits; add authenticated usage controls and monitoring before scaling.
- [ ] Confirm lead handling and analytics if required by the data owner.
- [ ] Verify hidden-address and internet-display restrictions for every listing.
- [ ] Verify data refresh, cache duration, retention and removal requirements (current adapter caches its response for only 60 seconds).
- [ ] Add all required source, trademark and listing attribution as agreed.
- [ ] Review privacy policy and storage of saved listing identifiers.
- [ ] Review map tile service conditions. The current Leaflet/OpenStreetMap tiles are suitable only for small-volume evaluation; arrange an appropriate production tile service before broad launch.
- [ ] Do not display sold prices or private remarks unless separately licensed.

## What users can do right away without MLS approval

Choose a city and search filters, open REALTOR.ca or Zolo externally, enter homes manually in their shortlist, compare monthly cost estimates, and try Canadian fixed-rate mortgage scenarios. They do **not** get a live Canadian-wide inventory or a live median-home-price feed until you connect approved sources.
