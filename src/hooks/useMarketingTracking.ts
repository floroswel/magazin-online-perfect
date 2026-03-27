// Marketing tracking hook — GA4, GTM, Facebook Pixel, TikTok, Pinterest, Google Ads
// Respects cookie consent (marketing category)

type CookiePrefs = { necessary: boolean; analytics: boolean; marketing: boolean };

function getCookieConsent(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem("ventuza_cookie_consent");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function hasMarketingConsent(): boolean {
  const prefs = getCookieConsent();
  return prefs?.marketing === true;
}

function hasAnalyticsConsent(): boolean {
  const prefs = getCookieConsent();
  return prefs?.analytics === true;
}

// ========== UTM ==========
const UTM_KEY = "megashop_utm";

export function captureUtmParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const utm: Record<string, string> = {};
    let hasUtm = false;
    for (const k of utmKeys) {
      const v = params.get(k);
      if (v) { utm[k] = v; hasUtm = true; }
    }
    if (hasUtm) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify({ ...utm, landing_url: window.location.href, timestamp: Date.now() }));
    }
  } catch {}
}

export function getUtmData(): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ========== Config cache ==========
let _configCache: Record<string, any> | null = null;
let _configLoading = false;
const _configCallbacks: ((c: Record<string, any>) => void)[] = [];

async function getTrackingConfig(): Promise<Record<string, any>> {
  if (_configCache) return _configCache;
  if (_configLoading) {
    return new Promise(resolve => _configCallbacks.push(resolve));
  }
  _configLoading = true;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const sb = createClient(url, key);
    const [pixelRes, integRes] = await Promise.all([
      sb.from("app_settings").select("value_json").eq("key", "pixel_tracking").maybeSingle(),
      sb.from("app_settings").select("value_json").eq("key", "marketing_integrations").maybeSingle(),
    ]);
    _configCache = {
      pixels: (pixelRes.data?.value_json as Record<string, any>) || {},
      integrations: (integRes.data?.value_json as Record<string, any>) || {},
    };
  } catch {
    _configCache = { pixels: {}, integrations: {} };
  }
  _configLoading = false;
  _configCallbacks.forEach(cb => cb(_configCache!));
  _configCallbacks.length = 0;
  return _configCache!;
}

// ========== Script injection ==========
const injectedScripts = new Set<string>();

function injectScript(id: string, src: string, attrs?: Record<string, string>) {
  if (injectedScripts.has(id) || typeof document === "undefined") return;
  injectedScripts.add(id);
  const el = document.createElement("script");
  el.async = true;
  el.src = src;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

function injectInline(id: string, code: string) {
  if (injectedScripts.has(id) || typeof document === "undefined") return;
  injectedScripts.add(id);
  const el = document.createElement("script");
  el.textContent = code;
  document.head.appendChild(el);
}

function injectMeta(name: string, content: string) {
  if (typeof document === "undefined" || !content) return;
  const existing = document.querySelector(`meta[name="${name}"]`);
  if (existing) return;
  const el = document.createElement("meta");
  el.setAttribute("name", name);
  el.setAttribute("content", content);
  document.head.appendChild(el);
}

// ========== Init scripts ==========
async function initTrackingScripts() {
  const config = await getTrackingConfig();
  const { pixels, integrations } = config;

  // Google Search Console verification
  if (integrations.google_search_console?.verification_code) {
    injectMeta("google-site-verification", integrations.google_search_console.verification_code);
  }

  // Only load marketing pixels with consent
  if (!hasMarketingConsent()) return;

  // GA4
  const ga4Id = integrations.ga4?.measurement_id;
  if (ga4Id && integrations.ga4?.active) {
    injectScript("ga4", `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`);
    injectInline("ga4-init", `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`);
  }

  // GTM
  const gtmId = integrations.gtm?.container_id;
  if (gtmId && integrations.gtm?.active) {
    injectInline("gtm", `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`);
    // noscript iframe
    if (!document.querySelector(`iframe[src*="gtm.js"]`)) {
      const noscript = document.createElement("noscript");
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }

  // Facebook Pixel
  const fbPixelId = pixels.meta_pixel?.id;
  if (fbPixelId && pixels.meta_pixel?.active) {
    injectInline("fb-pixel", `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`);
  }

  // TikTok Pixel
  const ttPixelId = pixels.tiktok_pixel?.id;
  if (ttPixelId && pixels.tiktok_pixel?.active) {
    injectInline("tt-pixel", `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${ttPixelId}');ttq.page();}(window,document,'ttq');`);
  }

  // Pinterest Tag
  const pinTagId = pixels.pinterest_tag?.id;
  if (pinTagId && pixels.pinterest_tag?.active) {
    injectInline("pin-tag", `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${pinTagId}');pintrk('page');`);
  }
}

// ========== Event firing ==========
function useGtm(): boolean {
  return !!((_configCache?.integrations?.gtm?.active) && (_configCache?.integrations?.gtm?.container_id));
}

function pushDataLayer(event: string, data: Record<string, any>) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...data });
}

function gtagEvent(eventName: string, params: Record<string, any>) {
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

function fbqEvent(eventName: string, params?: Record<string, any>) {
  if (typeof (window as any).fbq === "function") {
    (window as any).fbq("track", eventName, params);
  }
}

function ttqEvent(eventName: string, params?: Record<string, any>) {
  if (typeof (window as any).ttq !== "undefined") {
    (window as any).ttq.track(eventName, params);
  }
}

function pinEvent(eventName: string, params?: Record<string, any>) {
  if (typeof (window as any).pintrk === "function") {
    (window as any).pintrk("track", eventName, params);
  }
}

// ========== Public API ==========

export async function initTracking() {
  captureUtmParams();
  await initTrackingScripts();
}

export function trackViewItem(product: { id: string; name: string; price: number; category?: string; brand?: string }) {
  if (!hasMarketingConsent()) return;
  const itemData = { item_id: product.id, item_name: product.name, price: product.price, item_category: product.category, item_brand: product.brand };

  if (useGtm()) {
    pushDataLayer("view_item", { ecommerce: { items: [itemData] } });
  } else {
    gtagEvent("view_item", { items: [itemData] });
  }

  fbqEvent("ViewContent", { content_ids: [product.id], content_name: product.name, value: product.price, currency: "RON", content_type: "product" });
  ttqEvent("ViewContent", { content_id: product.id, content_name: product.name, value: product.price, currency: "RON" });
  pinEvent("pagevisit", { line_items: [{ product_id: product.id, product_name: product.name }] });
}

export function trackViewItemList(items: { id: string; name: string; price: number }[], listName: string) {
  if (!hasMarketingConsent()) return;
  const ecomItems = items.map((p, i) => ({ item_id: p.id, item_name: p.name, price: p.price, index: i }));
  if (useGtm()) {
    pushDataLayer("view_item_list", { ecommerce: { item_list_name: listName, items: ecomItems } });
  } else {
    gtagEvent("view_item_list", { item_list_name: listName, items: ecomItems });
  }
}

export function trackAddToCart(product: { id: string; name: string; price: number }, quantity: number = 1) {
  if (!hasMarketingConsent()) return;
  const itemData = { item_id: product.id, item_name: product.name, price: product.price, quantity };

  if (useGtm()) {
    pushDataLayer("add_to_cart", { ecommerce: { items: [itemData] } });
  } else {
    gtagEvent("add_to_cart", { items: [itemData], value: product.price * quantity, currency: "RON" });
  }

  fbqEvent("AddToCart", { content_ids: [product.id], content_name: product.name, value: product.price * quantity, currency: "RON", content_type: "product" });
  ttqEvent("AddToCart", { content_id: product.id, value: product.price * quantity, currency: "RON" });
  pinEvent("addtocart", { value: product.price * quantity, currency: "RON", line_items: [{ product_id: product.id }] });
}

export function trackRemoveFromCart(product: { id: string; name: string; price: number }, quantity: number = 1) {
  if (!hasMarketingConsent()) return;
  if (useGtm()) {
    pushDataLayer("remove_from_cart", { ecommerce: { items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity }] } });
  } else {
    gtagEvent("remove_from_cart", { items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity }] });
  }
}

export function trackBeginCheckout(items: { id: string; name: string; price: number; quantity: number }[], total: number) {
  if (!hasMarketingConsent()) return;
  const ecomItems = items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity }));

  if (useGtm()) {
    pushDataLayer("begin_checkout", { ecommerce: { items: ecomItems, value: total, currency: "RON" } });
  } else {
    gtagEvent("begin_checkout", { items: ecomItems, value: total, currency: "RON" });
  }

  fbqEvent("InitiateCheckout", { value: total, currency: "RON", num_items: items.length, content_ids: items.map(i => i.id) });
  ttqEvent("InitiateCheckout", { value: total, currency: "RON" });
  pinEvent("checkout", { value: total, currency: "RON", line_items: items.map(i => ({ product_id: i.id })) });
}

export function trackAddPaymentInfo(paymentMethod: string) {
  if (!hasMarketingConsent()) return;
  if (useGtm()) {
    pushDataLayer("add_payment_info", { ecommerce: { payment_type: paymentMethod } });
  } else {
    gtagEvent("add_payment_info", { payment_type: paymentMethod });
  }
  fbqEvent("AddPaymentInfo");
}

export function trackAddShippingInfo(shippingTier: string) {
  if (!hasMarketingConsent()) return;
  if (useGtm()) {
    pushDataLayer("add_shipping_info", { ecommerce: { shipping_tier: shippingTier } });
  } else {
    gtagEvent("add_shipping_info", { shipping_tier: shippingTier });
  }
}

export function trackPurchase(order: { id: string; total: number; items: { id: string; name: string; price: number; quantity: number }[] }) {
  if (!hasMarketingConsent()) return;
  const ecomItems = order.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity }));

  if (useGtm()) {
    pushDataLayer("purchase", { ecommerce: { transaction_id: order.id, value: order.total, currency: "RON", items: ecomItems } });
  } else {
    gtagEvent("purchase", { transaction_id: order.id, value: order.total, currency: "RON", items: ecomItems });
  }

  fbqEvent("Purchase", { value: order.total, currency: "RON", content_ids: order.items.map(i => i.id), content_type: "product" });
  ttqEvent("PlaceAnOrder", { value: order.total, currency: "RON" });
  ttqEvent("CompletePayment", { value: order.total, currency: "RON" });

  // Google Ads conversion
  const config = _configCache;
  const gadsConvId = config?.pixels?.google_ads?.id;
  const gadsLabel = config?.integrations?.google_ads_conversion?.label;
  if (gadsConvId && gadsLabel) {
    gtagEvent("conversion", { send_to: `${gadsConvId}/${gadsLabel}`, value: order.total, currency: "RON", transaction_id: order.id });
  }
}

export function trackSearch(searchTerm: string) {
  if (!hasMarketingConsent()) return;
  if (useGtm()) {
    pushDataLayer("search", { search_term: searchTerm });
  } else {
    gtagEvent("search", { search_term: searchTerm });
  }
  fbqEvent("Search", { search_string: searchTerm });
  ttqEvent("Search", { query: searchTerm });
}

export function trackCompleteRegistration() {
  if (!hasMarketingConsent()) return;
  fbqEvent("CompleteRegistration");
}

export function trackPageView() {
  if (!hasMarketingConsent()) return;
  // FB & TikTok auto-fire PageView on init, but for SPA we re-fire
  fbqEvent("PageView");
  if (typeof (window as any).ttq !== "undefined") {
    (window as any).ttq.page();
  }
  if (typeof (window as any).pintrk === "function") {
    (window as any).pintrk("page");
  }
}
