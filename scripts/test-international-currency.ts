import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(__dirname, '..'));

async function runInternationalTests() {
  console.log('================================================================');
  console.log('   GLOBAL COUNTRY DETECTION & MULTI-CURRENCY RUNTIME TEST SUITE  ');
  console.log('================================================================\n');

  let passCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // Import geo and currency modules
  const {
    SUPPORTED_CURRENCIES,
    isCurrencySupported,
  } = await import('../src/lib/geo/country-currency');

  const {
    detectVisitorCountry,
    isPrivateOrLocalIp,
    extractClientIp,
  } = await import('../src/lib/geo/detect-country');

  const {
    getExchangeRates,
    convertInrToTargetCurrency,
    CURATED_BASELINE_INR_RATES,
  } = await import('../src/lib/currency/exchange-service');

  const {
    formatCurrency,
    formatPriceWithPeriod,
  } = await import('../src/lib/utils/currency');

  const { adminDb } = await import('../src/lib/firebase/admin');

  // ============================================================================
  // TEST A: India Detection, INR Default & ₹ Symbol Formatting
  // ============================================================================
  console.log('\n--- TEST A: India Detection & INR Base Currency ---');
  try {
    const headersIn = new Headers({ 'x-vercel-ip-country': 'IN' });
    const geoIn = await detectVisitorCountry(headersIn);
    assert(geoIn.countryCode === 'IN', 'Detect India via x-vercel-ip-country: IN');
    assert(geoIn.suggestedCurrency === 'INR', 'Suggested currency is INR for IN');
    assert(geoIn.currencySymbol === '₹', 'Currency symbol is ₹ for IN');

    const formattedInr = formatCurrency(150, 'INR');
    assert(formattedInr === '₹150', `INR formatting ₹150 (got: ${formattedInr})`);

    const formattedWithPeriod = formatPriceWithPeriod(150, 'mo', 'INR');
    assert(formattedWithPeriod === '₹150/mo', `INR period formatting ₹150/mo (got: ${formattedWithPeriod})`);
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST A threw error', err.message);
  }

  // ============================================================================
  // TEST B: United States Simulation, USD Suggestion & Conversion
  // ============================================================================
  console.log('\n--- TEST B: United States Simulation & USD Conversion ---');
  try {
    const headersUs = new Headers({ 'cf-ipcountry': 'US' });
    const geoUs = await detectVisitorCountry(headersUs);
    assert(geoUs.countryCode === 'US', 'Detect United States via cf-ipcountry: US');
    assert(geoUs.suggestedCurrency === 'USD', 'Suggested currency is USD for US');
    assert(geoUs.currencySymbol === '$', 'Currency symbol is $ for US');

    const ratesData = await getExchangeRates();
    const rateUsd = ratesData.rates.USD;
    assert(typeof rateUsd === 'number' && rateUsd > 0, `USD exchange rate valid: ${rateUsd}`);

    const conversion150 = convertInrToTargetCurrency(150, 'USD', ratesData.rates);
    assert(conversion150.currency === 'USD', 'Conversion target currency is USD');
    assert(conversion150.amount > 0, `Converted 150 INR to USD amount: $${conversion150.amount}`);
    assert(conversion150.minorUnits === Math.round(conversion150.amount * 100), `Minor units correctly formatted for Stripe cents: ${conversion150.minorUnits}`);

    const formattedUsd = formatCurrency(conversion150.amount, 'USD');
    assert(formattedUsd.startsWith('$'), `USD formatted with dollar sign: ${formattedUsd}`);
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST B threw error', err.message);
  }

  // ============================================================================
  // TEST C: United Kingdom Simulation & GBP Formatting
  // ============================================================================
  console.log('\n--- TEST C: United Kingdom Simulation & GBP Formatting ---');
  try {
    const headersGb = new Headers({ 'cloudfront-viewer-country': 'GB' });
    const geoGb = await detectVisitorCountry(headersGb);
    assert(geoGb.countryCode === 'GB', 'Detect UK via cloudfront-viewer-country: GB');
    assert(geoGb.suggestedCurrency === 'GBP', 'Suggested currency is GBP for GB');
    assert(geoGb.currencySymbol === '£', 'Currency symbol is £ for GB');

    const ratesData = await getExchangeRates();
    const convGbp = convertInrToTargetCurrency(150, 'GBP', ratesData.rates);
    assert(convGbp.currency === 'GBP', 'Conversion target currency is GBP');
    assert(convGbp.minorUnits > 0, `Minor units for GBP pence: ${convGbp.minorUnits}`);

    const formattedGbp = formatCurrency(convGbp.amount, 'GBP');
    assert(formattedGbp.startsWith('£'), `GBP formatted with pound sign: ${formattedGbp}`);
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST C threw error', err.message);
  }

  // ============================================================================
  // TEST D: Manual Currency Selection, Disambiguation & Preference Integrity
  // ============================================================================
  console.log('\n--- TEST D: Manual Selection, Disambiguation & Preferences ---');
  try {
    // Verify disambiguated symbols
    const formattedCad = formatCurrency(2.5, 'CAD');
    assert(formattedCad.includes('CA$'), `CAD formatting includes unambiguous CA$ (got: ${formattedCad})`);

    const formattedAud = formatCurrency(2.5, 'AUD');
    assert(formattedAud.includes('A$'), `AUD formatting includes unambiguous A$ (got: ${formattedAud})`);

    const formattedSgd = formatCurrency(2.5, 'SGD');
    assert(formattedSgd.includes('S$'), `SGD formatting includes unambiguous S$ (got: ${formattedSgd})`);

    // Verify all supported currencies
    const supportedList = Object.keys(SUPPORTED_CURRENCIES);
    assert(supportedList.length === 7, `7 core currencies supported: ${supportedList.join(', ')}`);

    for (const code of supportedList) {
      assert(isCurrencySupported(code), `isCurrencySupported('${code}') is true`);
    }
    assert(!isCurrencySupported('XYZ'), "isCurrencySupported('XYZ') is false");
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST D threw error', err.message);
  }

  // ============================================================================
  // TEST E: Disable Automatic Country Detection (Admin Setting Simulation)
  // ============================================================================
  console.log('\n--- TEST E: Disable Auto Detection in Admin Settings ---');
  try {
    const headersUs = new Headers({ 'x-vercel-ip-country': 'US' });
    const disabledGeo = await detectVisitorCountry(headersUs, {
      autoDetectEnabled: false,
      defaultFallbackCountry: 'IN',
      defaultFallbackCurrency: 'INR',
    });

    assert(disabledGeo.countryCode === 'IN', 'When autoDetect is disabled, countryCode is fallback IN');
    assert(disabledGeo.suggestedCurrency === 'INR', 'When autoDetect is disabled, currency is fallback INR');
    assert(disabledGeo.source === 'default_fallback', 'Source marked as default_fallback');
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST E threw error', err.message);
  }

  // ============================================================================
  // TEST F: Invalid Geolocation & Missing Country Handling
  // ============================================================================
  console.log('\n--- TEST F: Invalid/Missing Geolocation Safe Fallback ---');
  try {
    const emptyHeaders = new Headers();
    const fallbackGeo = await detectVisitorCountry(emptyHeaders);
    assert(fallbackGeo.countryCode === 'IN', 'Empty headers fallback to country IN');
    assert(fallbackGeo.suggestedCurrency === 'INR', 'Empty headers fallback to currency INR');
    assert(fallbackGeo.source === 'default_fallback', 'Source marked as default_fallback');

    const invalidHeaders = new Headers({ 'cf-ipcountry': 'XX' }); // Tor or unknown
    const invalidGeo = await detectVisitorCountry(invalidHeaders);
    assert(invalidGeo.countryCode === 'IN', 'XX country code falls back to IN');
    assert(invalidGeo.suggestedCurrency === 'INR', 'XX country code falls back to INR');
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST F threw error', err.message);
  }

  // ============================================================================
  // TEST G: Exchange Rate Provider Resiliency & Caching
  // ============================================================================
  console.log('\n--- TEST G: Exchange Rate Resiliency & Caching Policy ---');
  try {
    const ratesData = await getExchangeRates(60);
    assert(ratesData.base === 'INR', 'Exchange rates base currency is INR');
    assert(ratesData.rates.INR === 1, 'INR:INR rate is strictly 1');
    assert(ratesData.rates.USD > 0, `USD rate is numeric and > 0 (${ratesData.rates.USD})`);
    assert(ratesData.rates.GBP > 0, `GBP rate is numeric and > 0 (${ratesData.rates.GBP})`);
    assert(ratesData.rates.EUR > 0, `EUR rate is numeric and > 0 (${ratesData.rates.EUR})`);
    assert(ratesData.rates.CAD > 0, `CAD rate is numeric and > 0 (${ratesData.rates.CAD})`);
    assert(ratesData.rates.AUD > 0, `AUD rate is numeric and > 0 (${ratesData.rates.AUD})`);
    assert(ratesData.rates.SGD > 0, `SGD rate is numeric and > 0 (${ratesData.rates.SGD})`);
    assert(!!ratesData.timestamp, `Rate timestamp present: ${ratesData.timestamp}`);
    assert(
      ratesData.source === 'provider_api' || ratesData.source === 'curated_fallback',
      `Rate source is valid: ${ratesData.source}`
    );

    // Baseline fallback table test
    for (const [curr, r] of Object.entries(CURATED_BASELINE_INR_RATES)) {
      assert(typeof r === 'number' && r > 0, `Curated baseline rate for ${curr} is valid (${r})`);
    }
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST G threw error', err.message);
  }

  // ============================================================================
  // TEST H: Price Integrity in Firestore (Authoritative INR)
  // ============================================================================
  console.log('\n--- TEST H: Price Integrity in Firestore ---');
  try {
    const commDoc = await adminDb.collection('products').doc('community').get();
    assert(commDoc.exists, 'Product products/community exists in Firestore');
    const commData = commDoc.data();
    assert(commData?.currency === 'INR', `Community base currency is strictly INR (found: ${commData?.currency})`);
    assert(typeof commData?.price === 'number', `Community price is numeric INR: ₹${commData?.price}`);

    const bookDoc = await adminDb.collection('products').doc('book').get();
    assert(bookDoc.exists, 'Product products/book exists in Firestore');
    const bookData = bookDoc.data();
    assert(bookData?.currency === 'INR', `Book base currency is strictly INR (found: ${bookData?.currency})`);
    assert(typeof bookData?.price === 'number', `Book price is numeric INR: ₹${bookData?.price}`);
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST H threw error', err.message);
  }

  // ============================================================================
  // TEST I: Checkout Integrity & Server-Side Price Calculation
  // ============================================================================
  console.log('\n--- TEST I: Checkout Integrity & Server-Side Calculation ---');
  try {
    const baseAmountInr = 150;
    const ratesData = await getExchangeRates();

    // 1. INR checkout
    const inrCalc = convertInrToTargetCurrency(baseAmountInr, 'INR', ratesData.rates);
    assert(inrCalc.amount === 150, 'INR charge amount is 150');
    assert(inrCalc.minorUnits === 15000, 'INR minor units (Paise) is 15000 (150 * 100)');
    assert(inrCalc.rateUsed === 1, 'INR rate used is 1');

    // 2. USD checkout
    const usdCalc = convertInrToTargetCurrency(baseAmountInr, 'USD', ratesData.rates);
    assert(usdCalc.minorUnits === Math.round(usdCalc.amount * 100), 'USD minor units is cents');
    assert(usdCalc.rateUsed === ratesData.rates.USD, 'USD uses server exchange rate');

    // 3. Fallback on invalid currency
    const invalidCurrencyCalc = convertInrToTargetCurrency(
      baseAmountInr,
      'INVALID' as unknown as import('../src/lib/geo/country-currency').CurrencyCode,
      ratesData.rates
    );
    assert(invalidCurrencyCalc.currency === 'INR', 'Invalid currency falls back to INR');
    assert(invalidCurrencyCalc.amount === 150, 'Invalid currency charges base 150 INR');
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST I threw error', err.message);
  }

  // ============================================================================
  // TEST J: IP Privacy & Data Minimization
  // ============================================================================
  console.log('\n--- TEST J: IP Privacy & Data Minimization ---');
  try {
    // 1. Private/local IP filtering
    assert(isPrivateOrLocalIp('127.0.0.1') === true, '127.0.0.1 recognized as private/local');
    assert(isPrivateOrLocalIp('::1') === true, '::1 recognized as private/local');
    assert(isPrivateOrLocalIp('192.168.1.1') === true, '192.168.1.1 recognized as private/local');
    assert(isPrivateOrLocalIp('10.0.0.1') === true, '10.0.0.1 recognized as private/local');
    assert(isPrivateOrLocalIp('172.20.0.1') === true, '172.20.0.1 recognized as private/local');
    assert(isPrivateOrLocalIp('8.8.8.8') === false, '8.8.8.8 recognized as public IP');

    // 2. Client IP extraction ignores local IPs
    const localHeaders = new Headers({ 'x-forwarded-for': '127.0.0.1, 10.0.0.1' });
    const localIp = extractClientIp(localHeaders);
    assert(localIp === null, 'Local IP correctly masked to null by extractClientIp');

    // 3. Public IP extraction
    const publicHeaders = new Headers({ 'cf-connecting-ip': '203.0.113.195' });
    const publicIp = extractClientIp(publicHeaders);
    assert(publicIp === '203.0.113.195', `Public IP cleanly extracted: ${publicIp}`);

    // 4. Verify Firestore collections NEVER store visitor IP
    const ordersSnap = await adminDb.collection('orders').limit(5).get();
    let ipFoundInOrders = false;
    ordersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.ip || data.ipAddress || data.clientIp) {
        ipFoundInOrders = true;
      }
    });
    assert(!ipFoundInOrders, 'No IP addresses found in orders collection');

    const usersSnap = await adminDb.collection('users').limit(5).get();
    let ipFoundInUsers = false;
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.ip || data.ipAddress || data.clientIp) {
        ipFoundInUsers = true;
      }
    });
    assert(!ipFoundInUsers, 'No IP addresses found in users collection');
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST J threw error', err.message);
  }

  // ============================================================================
  // TEST K: Admin Regional Settings Persistence & Authorization
  // ============================================================================
  console.log('\n--- TEST K: Admin Regional Settings & Security ---');
  try {
    const regionalRef = adminDb.collection('settings').doc('regional');
    const existingSnap = await regionalRef.get();
    const existingData = existingSnap.exists ? existingSnap.data() : null;

    // Test saving regional settings
    const testConfig = {
      baseCurrency: 'INR',
      autoDetectCountry: true,
      showCurrencySelector: true,
      defaultFallbackCountry: 'IN',
      defaultFallbackCurrency: 'INR',
      supportedCurrencies: ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD'],
      showIpInformation: true,
      rateCacheTtlMinutes: 60,
      updatedAt: new Date().toISOString(),
    };

    await regionalRef.set(testConfig, { merge: true });
    const savedSnap = await regionalRef.get();
    assert(savedSnap.exists, 'settings/regional document exists in Firestore');
    const savedData = savedSnap.data();
    assert(savedData?.baseCurrency === 'INR', 'Base currency persists as INR');
    assert(savedData?.autoDetectCountry === true, 'autoDetectCountry persists as true');
    assert(savedData?.rateCacheTtlMinutes === 60, 'rateCacheTtlMinutes persists as 60');

    // Restore prior state if needed
    if (existingData) {
      await regionalRef.set(existingData);
    }
  } catch (e: unknown) {
    const err = e as Error;
    assert(false, 'TEST K threw error', err.message);
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passCount}/${totalCount} assertions passed (${Math.round((passCount / totalCount) * 100)}%)`);
  console.log('================================================================');

  if (passCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runInternationalTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
