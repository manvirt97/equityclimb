/* EquityClimb v7 - lesson library and daily money tips (static text: costs nothing to run, works offline).
   Numbers that change every year (TFSA, RRSP, FHSA limits) are filled in live from /api/rules. */
window.EC_LEARN = (function () {
  'use strict';
  const L = (o) => o;
  const lessons = [
    L({ id: 'budget', track: 'Basics', mins: 2, title: 'Budgeting that actually works', icon: 'wallet',
      body: [
        'A budget is just a plan for your money <b>before</b> the month starts, so it doesn\u2019t disappear on things you don\u2019t care about.',
        '<b>Pay yourself first.</b> Move savings out on payday, then spend what\u2019s left. Waiting to save \u201Cwhatever is left over\u201D usually means saving nothing.',
        'A simple guideline is <b>50 / 30 / 20</b>: about 50% of take-home pay for needs, 30% for wants and 20% for saving or paying down debt. It\u2019s a starting point, not a rule.',
        'Track for one month, then cut the one category that surprised you most. Small, specific changes stick better than big promises.'
      ], try: ['budget', 'Open my budget'],
      quiz: [
        { q: 'What does \u201Cpay yourself first\u201D mean?', a: ['Spend on yourself before bills', 'Move money to savings on payday, before spending', 'Pay off your mortgage first'], c: 1, why: 'Saving happens automatically on payday, before spending has a chance to use it up.' },
        { q: 'In the 50/30/20 guideline, the 20% is for\u2026', a: ['Wants', 'Needs', 'Saving and paying down debt'], c: 2, why: '20% goes to your future: savings, investing and extra debt payments.' }
      ] }),
    L({ id: 'emergency', track: 'Basics', mins: 2, title: 'Your emergency fund', icon: 'shield',
      body: [
        'An emergency fund is cash set aside for surprises: a job loss, a car repair, a broken furnace.',
        'A common target is <b>3 to 6 months of essential costs</b> (housing, food, utilities, insurance, minimum debt payments), not of your full spending.',
        'Keep it somewhere safe and easy to reach, like a <b>high-interest savings account</b>. Not in stocks, because markets can drop exactly when you need the money.',
        'Without one, a surprise often ends up on a credit card at around 20% interest, which is how small problems become big debts.'
      ], try: ['home', 'See my emergency-fund months'],
      quiz: [
        { q: 'A common emergency-fund target is\u2026', a: ['1 week of spending', '3 to 6 months of essential costs', '5 years of income'], c: 1, why: 'Three to six months of essentials covers most job searches and big repairs.' },
        { q: 'The best place for an emergency fund is usually\u2026', a: ['A high-interest savings account', 'Individual stocks', 'Cryptocurrency'], c: 0, why: 'It must be safe and available quickly, which rules out investments that can fall in value.' }
      ] }),
    L({ id: 'compound', track: 'Basics', mins: 2, title: 'Compound interest: money that grows itself', icon: 'growth',
      body: [
        '<b>Compound interest</b> means you earn returns on your earlier returns. Over long periods it does most of the work.',
        'Example: $200 a month at 6% a year (0.5% a month) grows to about <b>$33,000 in 10 years</b>, about <b>$92,000 in 20 years</b> and about <b>$200,000 in 30 years</b>. You only put in $72,000 over 30 years.',
        'The <b>Rule of 72</b>: divide 72 by the yearly return to see roughly how many years money takes to double. At 6%, about 12 years.',
        'It works against you too: credit-card debt at 20% roughly doubles in under 4 years if unpaid.'
      ], try: ['wealth', 'See my investment projection'],
      quiz: [
        { q: 'Using the Rule of 72, money growing 8% a year doubles in about\u2026', a: ['4 years', '9 years', '20 years'], c: 1, why: '72 \u00F7 8 = 9 years.' },
        { q: 'Why does starting early matter so much?', a: ['Banks pay young people more', 'Returns earn returns, so more years means much more growth', 'Taxes are lower when you\u2019re young'], c: 1, why: 'Time is what lets compounding snowball.' }
      ] }),
    L({ id: 'tfsa', track: 'Saving & investing', mins: 3, title: 'TFSA: the tax-free account', icon: 'piggy',
      body: [
        'A <b>Tax-Free Savings Account</b> lets your money grow with <b>no tax</b> on interest, dividends or gains, and withdrawals are tax-free too.',
        'This year\u2019s new room is <b>{tfsa}</b>. Unused room carries forward from the year you turned 18 (and were a resident).',
        'If you take money out, you get that room back on <b>January 1 of the next year</b>, not right away. Putting it back the same year can cause an over-contribution.',
        'Over-contributing costs <b>1% a month</b> on the extra. Check your room in CRA My Account and your own records.',
        'Despite the name, it isn\u2019t just for savings: you can hold GICs, ETFs and stocks inside it.'
      ], try: ['wealth', 'Compare TFSA vs paying down my mortgage'],
      quiz: [
        { q: 'You withdraw $3,000 from your TFSA in March. When does that room come back?', a: ['Immediately', 'January 1 next year', 'Never'], c: 1, why: 'Withdrawn amounts are added back to your room on January 1 of the following year.' },
        { q: 'What is the penalty for over-contributing?', a: ['Nothing', '1% per month on the excess', 'Your account is closed'], c: 1, why: 'CRA charges 1% per month on the highest excess amount in that month.' }
      ] }),
    L({ id: 'rrsp', track: 'Saving & investing', mins: 3, title: 'RRSP: tax savings now, tax later', icon: 'piggy',
      body: [
        'Money you put in an <b>RRSP</b> is deducted from your taxable income, so you usually get a <b>tax refund</b> at your marginal rate.',
        'It grows tax-sheltered, but withdrawals are <b>taxed as income</b> later, typically in retirement.',
        'Your room is 18% of last year\u2019s earned income, up to a yearly maximum (<b>{rrsp}</b> this year), minus any pension adjustment. It\u2019s on your Notice of Assessment.',
        'Rule of thumb: an RRSP shines when your tax rate today is <b>higher</b> than you expect in retirement. Reinvesting the refund is what makes it powerful.'
      ], try: ['profile', 'See my marginal tax rate'],
      quiz: [
        { q: 'RRSP withdrawals are\u2026', a: ['Always tax-free', 'Taxed as income', 'Taxed at 50%'], c: 1, why: 'You get the deduction going in, and pay tax coming out.' },
        { q: 'An RRSP is usually most valuable when\u2026', a: ['Your tax rate now is higher than in retirement', 'You earn very little now', 'You need the money next month'], c: 0, why: 'You deduct at a high rate now and pay tax at a lower rate later.' }
      ] }),
    L({ id: 'fhsa', track: 'Home', mins: 2, title: 'FHSA: the first-home account', icon: 'home',
      body: [
        'The <b>First Home Savings Account</b> combines the best of both: contributions are <b>deductible</b> like an RRSP, and qualifying withdrawals for a first home are <b>tax-free</b> like a TFSA.',
        'Limits: <b>{fhsaAnnual} a year</b>, <b>{fhsaLifetime} lifetime</b>. Up to one year of unused room can carry forward.',
        'You generally must be a Canadian resident, at least 18, and a first-time buyer (no home you lived in that you or your spouse owned in this year or the previous four calendar years).',
        'The account can stay open up to 15 years. If you don\u2019t buy, you can usually transfer it to your RRSP without using RRSP room.'
      ], try: ['goals', 'Plan a home purchase'],
      quiz: [
        { q: 'FHSA withdrawals for a qualifying first home are\u2026', a: ['Taxed like income', 'Tax-free', 'Only 50% tax-free'], c: 1, why: 'Qualifying withdrawals are tax-free, and contributions were deductible.' },
        { q: 'The FHSA lifetime limit is\u2026', a: ['{fhsaLifetime}', '$1,000,000', 'There is no limit'], c: 0, why: 'The lifetime contribution limit is {fhsaLifetime}.' }
      ] }),
    L({ id: 'credit', track: 'Basics', mins: 2, title: 'How your credit score works', icon: 'card',
      body: [
        'Canadian credit scores run from about <b>300 to 900</b>. Lenders use them to decide whether to lend to you, and at what rate.',
        'The biggest factor is <b>paying on time</b>, every time. Even the minimum payment counts as on time.',
        'Next is <b>how much of your limits you use</b>. Try to keep balances under about 30% of each card\u2019s limit.',
        'A long history helps, so think twice before closing your oldest card. Applying for lots of credit at once can lower your score for a while.'
      ], try: ['debt', 'Review my debts'],
      quiz: [
        { q: 'Which matters most for your score?', a: ['Your income', 'Paying on time', 'How many cards you have'], c: 1, why: 'Payment history is the single biggest factor.' },
        { q: 'A card with a $5,000 limit: a balance below about ___ helps your score.', a: ['$1,500', '$4,900', '$10,000'], c: 0, why: 'About 30% of $5,000 is $1,500.' }
      ] }),
    L({ id: 'debt', track: 'Debt', mins: 2, title: 'Getting out of debt faster', icon: 'debt',
      body: [
        'List every debt with its balance, interest rate and minimum payment. Seeing it all in one place is the first step.',
        '<b>Avalanche:</b> pay minimums on everything, then put every extra dollar on the <b>highest interest rate</b>. It saves the most money.',
        '<b>Snowball:</b> put extra on the <b>smallest balance</b> first for quick wins. It costs a bit more but keeps some people motivated.',
        'When a debt is paid off, roll its payment into the next one. Avoid adding new debt while you pay down old debt.'
      ], try: ['debt', 'Compare avalanche vs snowball'],
      quiz: [
        { q: 'The avalanche method pays extra toward\u2026', a: ['The smallest balance', 'The highest interest rate', 'The newest debt'], c: 1, why: 'Highest rate first means the least total interest.' },
        { q: 'After paying off one debt you should\u2026', a: ['Celebrate by spending the payment', 'Roll that payment into the next debt', 'Stop making extra payments'], c: 1, why: 'Rolling payments forward speeds up every payoff after it.' }
      ] }),
    L({ id: 'mortgage', track: 'Home', mins: 3, title: 'Mortgage basics in plain English', icon: 'home',
      body: [
        '<b>Amortization</b> is how long it takes to pay off the whole mortgage (often 25\u201330 years). The <b>term</b> is how long your current rate and contract last (often 5 years). At the end of each term you <b>renew</b>.',
        '<b>Fixed rate:</b> the rate stays the same for the term. <b>Variable rate:</b> it moves with your bank\u2019s <b>prime rate</b>, which follows the Bank of Canada.',
        'Early on, most of each payment is interest. Over time, more goes to principal (the amount you owe).',
        'In Canada, fixed-rate mortgage interest is compounded twice a year, which is why payments can differ slightly from US calculators.'
      ], try: ['debt', 'See my mortgage'],
      quiz: [
        { q: 'The \u201Cterm\u201D of a mortgage is\u2026', a: ['How long until it\u2019s fully paid', 'How long your current rate and contract last', 'Your interest rate'], c: 1, why: 'The term is the contract period; amortization is the total payoff time.' },
        { q: 'A variable rate usually moves with\u2026', a: ['The stock market', 'Your bank\u2019s prime rate', 'Your credit score each month'], c: 1, why: 'Variable rates are set as prime plus or minus a fixed amount.' }
      ] }),
    L({ id: 'prepay', track: 'Home', mins: 2, title: 'Paying your mortgage off early', icon: 'growth',
      body: [
        'Every extra dollar you pay goes <b>straight to principal</b>, so you pay less interest for the rest of the mortgage.',
        'Most mortgages allow yearly <b>prepayment privileges</b>, for example a lump sum of 10\u201320% of the original amount and payment increases. Going over the limit can trigger a penalty.',
        '<b>Accelerated bi-weekly</b> payments add the equivalent of about one extra monthly payment a year without feeling like much.',
        'Breaking a mortgage early (not the same as prepaying within your limits) can cost a penalty such as 3 months\u2019 interest or an interest-rate differential.'
      ], try: ['debt', 'Try prepayment scenarios'],
      quiz: [
        { q: 'Extra mortgage payments go toward\u2026', a: ['Interest', 'Principal', 'Property tax'], c: 1, why: 'Prepayments reduce what you owe, so future interest shrinks.' },
        { q: 'Accelerated bi-weekly payments add about\u2026', a: ['One extra monthly payment a year', 'Nothing', 'Six extra payments a year'], c: 0, why: '26 half-payments equal 13 monthly payments instead of 12.' }
      ] }),
    L({ id: 'stress', track: 'Home', mins: 2, title: 'The mortgage stress test', icon: 'shield',
      body: [
        'To get a mortgage, lenders check you could still pay if rates rose. You must qualify at the <b>higher of {stressFloor}% or your rate + {stressBuffer} points</b>.',
        'They also check debt ratios: housing costs usually under about <b>{gds}%</b> of gross income, and all debts under about <b>{tds}%</b>.',
        'Minimum down payment: <b>{minDown}</b>. With less than 20% down you pay mortgage default insurance.',
        'Passing the stress test means you <i>can</i> borrow that much, not that you <i>should</i>. Leave room for savings and life.'
      ], try: ['goals', 'Check what I can afford'],
      quiz: [
        { q: 'If your offered rate is 4%, you qualify at\u2026', a: ['4%', '6% (rate + 2)', '{stressFloor}%'], c: 1, why: 'The higher of {stressFloor}% or 4% + 2 = 6%.' },
        { q: 'Mortgage insurance is required when the down payment is\u2026', a: ['Under 20%', 'Over 20%', 'Exactly 20%'], c: 0, why: 'Under 20% down means a high-ratio, insured mortgage.' }
      ] }),
    L({ id: 'investing', track: 'Saving & investing', mins: 3, title: 'Investing without the jargon', icon: 'growth',
      body: [
        'Investing means owning things that can grow, like businesses (stocks) or loans (bonds). Higher possible returns come with bigger ups and downs.',
        '<b>Diversify:</b> owning many companies at once (for example through a broad index ETF) means one bad company can\u2019t sink you.',
        '<b>Fees matter.</b> A 2% yearly fee instead of 0.25% can take a large share of your growth over 30 years.',
        'Money you need within about <b>2 years</b> belongs in savings or GICs, not stocks. Long-term money can ride out the dips.'
      ], try: ['wealth', 'See my investment projection'],
      quiz: [
        { q: 'Diversification means\u2026', a: ['Putting everything in one great stock', 'Spreading money across many investments', 'Only holding cash'], c: 1, why: 'Spreading out lowers the damage any single investment can do.' },
        { q: 'Money you need next year is best kept in\u2026', a: ['Savings or GICs', 'Growth stocks', 'Crypto'], c: 0, why: 'Short-term money shouldn\u2019t be exposed to market drops.' }
      ] }),
    L({ id: 'rates', track: 'Economy', mins: 2, title: 'Why interest rates move', icon: 'market',
      body: [
        'The <b>Bank of Canada</b> aims to keep inflation around <b>2%</b>. Its main tool is the policy interest rate.',
        'When inflation runs hot, it tends to <b>raise</b> rates to cool spending. When the economy is weak, it tends to <b>cut</b> them.',
        'Banks\u2019 <b>prime rate</b> follows the policy rate, so variable mortgages and lines of credit change soon after.',
        'Fixed mortgage rates follow <b>bond yields</b> (especially the 5-year Government of Canada bond), which move on expectations about the future.'
      ], try: ['market', 'See today\u2019s rates'],
      quiz: [
        { q: 'If inflation is well above 2%, the Bank of Canada is more likely to\u2026', a: ['Raise rates', 'Cut rates', 'Print a new currency'], c: 0, why: 'Higher rates slow borrowing and spending, which cools inflation.' },
        { q: 'Fixed mortgage rates mostly follow\u2026', a: ['Bond yields', 'The price of gold', 'House prices'], c: 0, why: 'Lenders price fixed rates off government bond yields.' }
      ] }),
    L({ id: 'deals', track: 'Business', mins: 3, title: 'Reading business deals', icon: 'deal',
      body: [
        'In an <b>acquisition</b>, one company buys another. In a <b>merger</b>, two combine. A <b>divestiture</b> is selling off part of a business.',
        'Buyers usually pay a <b>premium</b>, more than the current share price, to win shareholder approval. That\u2019s why the target\u2019s shares often jump on the news.',
        'Deals can be paid in <b>cash</b>, the buyer\u2019s <b>shares</b>, or both. \u201C<b>Enterprise value</b>\u201D includes the company\u2019s debt, not just its shares.',
        'Big deals need shareholder and regulator approval, so there\u2019s usually a gap of months between \u201Cannounced\u201D and \u201Ccompleted\u201D.',
        'For you: deals can affect jobs, suppliers, local businesses and the value of shares in your pension or ETFs.'
      ], try: ['market', 'Open the Deal Tracker'],
      quiz: [
        { q: 'Why do a target company\u2019s shares often jump when a deal is announced?', a: ['The buyer usually pays a premium', 'Taxes go down', 'The company stops paying dividends'], c: 0, why: 'The offer price is normally above the market price.' },
        { q: 'Enterprise value includes\u2026', a: ['Only the share price', 'The value of shares plus debt (minus cash)', 'Only the company\u2019s buildings'], c: 1, why: 'It reflects the whole business, including what it owes.' }
      ] }),
    L({ id: 'tax', track: 'Basics', mins: 2, title: 'Tax brackets, explained once and for all', icon: 'card',
      body: [
        'Canada uses <b>marginal</b> tax brackets: each rate only applies to the income <b>inside</b> that bracket.',
        'So a raise that pushes you into a higher bracket <b>never</b> lowers your take-home pay. Only the extra dollars are taxed at the higher rate.',
        'Your <b>marginal rate</b> is the tax on your next dollar (useful for RRSP decisions). Your <b>average rate</b> is total tax \u00F7 total income, and it\u2019s always lower.',
        'Brackets rise with inflation every January, which is why EquityClimb updates them automatically.'
      ], try: ['profile', 'See my tax estimate'],
      quiz: [
        { q: 'A raise moves you into a higher bracket. Your take-home pay\u2026', a: ['Goes down', 'Goes up', 'Stays exactly the same'], c: 1, why: 'Only the dollars above the threshold are taxed at the higher rate.' },
        { q: 'Which rate is useful for estimating an RRSP refund?', a: ['Marginal rate', 'Average rate', 'Sales tax rate'], c: 0, why: 'The deduction saves tax at your marginal rate.' }
      ] })
  ];
  const tips = [
    'Automate savings on payday. What you don\u2019t see, you don\u2019t spend.',
    'Your TFSA room never expires. Unused room carries forward every year.',
    'On a $400,000, 25-year mortgage, a rate 1 point lower saves about $220 a month.',
    'Paying a credit card in full each month means you pay 0% interest.',
    'Review subscriptions every 3 months. Most people find at least one they forgot.',
    'An RRSP refund invested, not spent, is what makes an RRSP powerful.',
    'Before a big purchase, wait 48 hours. The urge often passes.',
    'Start comparing mortgage renewal offers about 4 months before your term ends.',
    'Emergency fund first, investing second. It keeps a surprise from becoming debt.',
    'A raise never lowers your take-home pay. Only the extra dollars are taxed higher.',
    'Fees compound too. Check the MER on your funds.',
    'The Bank of Canada targets 2% inflation. Rate decisions follow from that.',
    'Bi-weekly accelerated payments add about one extra mortgage payment a year.',
    'Your credit score rewards paying on time more than anything else.',
    'Keep money you need within 2 years out of the stock market.',
    'Net worth = what you own \u2212 what you owe. Track it once a month.',
    'Rent vs buy isn\u2019t only about payments: include maintenance, taxes and closing costs.',
    'When a company is bought, its shareholders usually receive a premium.',
    'A budget is a plan, not a punishment. Give every dollar a job.',
    'Raising your savings by 1% every time you get a raise is almost painless.',
    'Insurance protects your plan. Check life and disability coverage once a year.',
    'Variable rates move with prime. Know your trigger rate if you have one.',
    'Small business, side hustle or investment: start with a written one-page plan.',
    'Dividends are a share of company profits paid to shareholders.',
    'Compare your spending to last month, not to other people.',
    'The FHSA gives a tax deduction going in and tax-free money for a first home.',
    'Don\u2019t close your oldest credit card. Long history helps your score.',
    'Read past the headline: \u201Cannounced\u201D deals can still be blocked or changed.',
    'Your marginal tax rate tells you what an RRSP contribution saves.',
    'Celebrate progress. Every debt paid off is a guaranteed return.'
  ];
  return { lessons, tips };
})();
