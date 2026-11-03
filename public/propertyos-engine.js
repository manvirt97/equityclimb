/* PropertyOS 2.0 — pure, dependency-free, illustration-only investment engine.
   Dollars in CAD; rates as percentage points; mortgage assumes Canadian fixed
   nominal semi-annual compounding with monthly payments.
   Never use these outputs as lender approval or verified market data. */
(function(root){
  'use strict';
  function number(value,name,min,max){
    if(value===''||value===null||value===undefined) throw new RangeError(name+' is required');
    var x=Number(value);
    if(!Number.isFinite(x)||x<min||x>max)throw new RangeError(name+' must be between '+min+' and '+max);
    return x;
  }
  function optional(value,name,min,max,fallback){
    if(value===''||value===null||value===undefined)return fallback;
    return number(value,name,min,max);
  }
  function payment(principal,annualRate,years){
    var p=number(principal,'Loan',0,1e10),r=number(annualRate,'Rate',0,40),y=number(years,'Amortization',1,50);
    if(p===0)return 0;
    var n=Math.round(y*12);
    var m=Math.pow(1+r/200,1/6)-1;
    return m===0?p/n:p*m/(1-Math.pow(1+m,-n));
  }
  function amortizedBalance(principal,annualRate,years,months){
    var p=number(principal,'Loan',0,1e10),r=number(annualRate,'Rate',0,40);
    var n=Math.round(number(years,'Amortization',1,50)*12);
    var k=Math.max(0,Math.min(n,Math.floor(number(months,'Months',0,1000))));
    var m=Math.pow(1+r/200,1/6)-1, pay=payment(p,r,years);
    return Math.max(0,m===0?p-pay*k:p*Math.pow(1+m,k)-pay*(Math.pow(1+m,k)-1)/m);
  }
  function analyze(input){
    var a=input||{};
    var price=number(a.price,'Purchase price',1,1e10);
    var units=number(a.units,'Units',1,10000);
    if(!Number.isInteger(units))throw new RangeError('Units must be a whole number');
    var rent=number(a.rent,'Rent per unit per month',0,1e7);
    var otherIncome=optional(a.otherIncome,'Other income/month',0,1e8,0);
    var vacancy=optional(a.vacancy,'Vacancy',0,100,5);
    var credit=optional(a.credit,'Credit loss',0,100,0);
    if(vacancy+credit>100)throw new RangeError('Vacancy plus credit loss cannot exceed 100%');
    var downPct=optional(a.downPct,'Down payment',0,100,25);
    var rate=optional(a.rate,'Mortgage rate',0,40,5);
    var years=optional(a.years,'Amortization',1,50,25);
    var propertyTax=optional(a.propertyTax,'Property tax/month',0,1e8,0);
    var insurance=optional(a.insurance,'Insurance/month',0,1e8,0);
    var utilities=optional(a.utilities,'Utilities/month',0,1e8,0);
    var repairs=optional(a.repairs,'Repairs/month',0,1e8,0);
    var admin=optional(a.admin,'Other operating expenses/month',0,1e8,0);
    var managementPct=optional(a.managementPct,'Management fee',0,100,0);
    var capex=optional(a.capex,'Capital reserve/month',0,1e8,0);
    var closingPct=optional(a.closingPct,'Closing-cost allowance',0,30,2);
    var renovation=optional(a.renovation,'Initial renovation',0,1e10,0);
    var upfrontFees=optional(a.upfrontFees,'Additional upfront financing fees',0,1e9,0);
    var grossRent=rent*units*12;
    var grossPotential=grossRent+otherIncome*12;
    var vacancyLoss=grossRent*vacancy/100, creditLoss=grossRent*credit/100;
    var egi=grossPotential-vacancyLoss-creditLoss;
    var management=egi*managementPct/100;
    var operating=(propertyTax+insurance+utilities+repairs+admin)*12+management;
    var noi=egi-operating;
    var down=price*downPct/100,loan=price-down;
    var monthlyDebt=payment(loan,rate,years);
    var debtService=monthlyDebt*12;
    var capitalReserve=capex*12;
    var cashFlow=noi-debtService-capitalReserve;
    var cashRequired=down+price*closingPct/100+renovation+upfrontFees;
    var dscr=debtService>0?noi/debtService:null;
    var grm=grossRent>0?price/grossRent:null;
    var debtYield=loan>0?100*noi/loan:null;
    var breakEven=grossRent>0?100*(operating+debtService+capitalReserve-otherIncome*12)/grossRent:null;
    var result={
      price:price,units:units,grossPotential:grossPotential,grossRent:grossRent,
      vacancyLoss:vacancyLoss,creditLoss:creditLoss,effectiveGrossIncome:egi,
      management:management,operatingExpenses:operating,noi:noi,
      loan:loan,downPayment:down,monthlyDebt:monthlyDebt,debtService:debtService,
      capitalReserve:capitalReserve,cashFlow:cashFlow,monthlyCashFlow:cashFlow/12,
      cashRequired:cashRequired,capRate:100*noi/price,
      cashOnCash:cashRequired>0?100*cashFlow/cashRequired:null,
      grm:grm,dscr:dscr,ltv:100*loan/price,debtYield:debtYield,
      expenseRatio:egi>0?100*operating/egi:null,
      breakEvenOccupancy:breakEven,
      annualPrincipalRepaid:loan-amortizedBalance(loan,rate,years,12),
      mode:units>=5?'commercial multifamily review':'residential small-property review',
      provenance:'user-entered or explicitly illustrative inputs; calculated results',
      flags:[]
    };
    if(!Number.isFinite(result.capRate)||!Number.isFinite(result.monthlyCashFlow))throw new RangeError('Non-finite analysis');
    if(noi<=0)result.flags.push('NOI is zero or negative: operating performance does not cover operating costs.');
    if(dscr!==null&&dscr<1.2)result.flags.push('Illustrative debt coverage is below 1.20; verify the lender-specific requirement.');
    if(cashFlow<0)result.flags.push('Negative cash flow after debt service and capital reserves.');
    if(breakEven!==null&&breakEven>100)result.flags.push('Break-even occupancy exceeds 100%; current assumptions cannot cover all modeled costs.');
    if(units>=5)result.flags.push('Five-plus units need commercial underwriting; this calculator does not determine CMHC, DSCR or lender eligibility.');
    if(a.ownerOccupied)result.flags.push('Owner-occupied underwriting also needs personal income, expenses and residential qualification; rental returns alone are insufficient.');
    if(downPct<20&&!a.ownerOccupied)result.flags.push('Less than 20% down on a rental: do not assume financing or insurance eligibility.');
    return result;
  }
  function equity(input){
    var a=input||{};
    var value=number(a.value,'Appraised value',1,1e10);
    var balance=number(a.balance,'Mortgage balance',0,1e10);
    var ltv=number(a.maxLtv,'Illustrative maximum LTV',0,100);
    var costs=optional(a.costs,'Refinancing costs',0,1e9,0);
    var decline=optional(a.decline,'Value decline',0,100,0);
    var stressedValue=value*(1-decline/100);
    var valueEquity=value-balance;
    var stressedEquity=stressedValue-balance;
    var gross=Math.max(0,value*ltv/100-balance);
    var stressedGross=Math.max(0,stressedValue*ltv/100-balance);
    return {
      equity:valueEquity,stressedEquity:stressedEquity,illustrativeCashOut:Math.max(0,gross-costs),
      stressedCashOut:Math.max(0,stressedGross-costs),
      note:'Illustrative ceiling only; appraisals, qualification, debt service, mortgage terms and lender discretion may reduce available cash to zero.'
    };
  }
  root.PropertyOSEngine=Object.freeze({payment:payment,amortizedBalance:amortizedBalance,analyze:analyze,equity:equity});
})(typeof globalThis!=='undefined'?globalThis:this);
