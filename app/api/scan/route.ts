import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type Matcher = {
  type: 'header' | 'cookie' | 'html' | 'script' | 'meta';
  key?: string; // For header/cookie/meta name
  pattern: RegExp;
  confidence: number;
};

type Technology = {
  name: string;
  category: string;
  matchers: Matcher[];
};

const technologies: Technology[] = [
  {
    name: 'PHP',
    category: 'Backend',
    matchers: [
      { type: 'header', key: 'x-powered-by', pattern: /php/i, confidence: 100 },
      { type: 'cookie', key: 'PHPSESSID', pattern: /.*/, confidence: 100 },
      { type: 'html', pattern: /\.php/i, confidence: 40 },
    ]
  },
  {
    name: 'Python',
    category: 'Backend',
    matchers: [
      { type: 'header', key: 'server', pattern: /(gunicorn|werkzeug|waitress)/i, confidence: 100 },
      { type: 'cookie', key: 'csrftoken', pattern: /.*/, confidence: 80 },
      { type: 'cookie', key: 'session', pattern: /.*/, confidence: 50 },
    ]
  },
  {
    name: 'Ruby',
    category: 'Backend',
    matchers: [
      { type: 'header', key: 'x-powered-by', pattern: /(Phusion Passenger|Rack)/i, confidence: 100 },
      { type: 'header', key: 'server', pattern: /(webrick|puma|thin)/i, confidence: 100 },
      { type: 'cookie', key: '_session_id', pattern: /.*/, confidence: 80 },
    ]
  },
  {
    name: 'ASP.NET',
    category: 'Backend',
    matchers: [
      { type: 'header', key: 'x-powered-by', pattern: /ASP\.NET/i, confidence: 100 },
      { type: 'header', key: 'x-aspnet-version', pattern: /.*/, confidence: 100 },
      { type: 'cookie', key: 'ASP\.NET_SessionId', pattern: /.*/, confidence: 100 },
      { type: 'html', pattern: /__VIEWSTATE/, confidence: 100 },
    ]
  },
  {
    name: 'Next.js',
    category: 'Frontend',
    matchers: [
      { type: 'html', pattern: /__NEXT_DATA__/i, confidence: 100 },
      { type: 'script', pattern: /_next\/static/i, confidence: 100 },
      { type: 'header', key: 'x-powered-by', pattern: /Next\.js/i, confidence: 100 },
    ]
  },
  {
    name: 'React',
    category: 'Frontend',
    matchers: [
      { type: 'html', pattern: /data-reactroot/i, confidence: 100 },
      { type: 'script', pattern: /react.*\.js/i, confidence: 90 },
      { type: 'html', pattern: /_reactRootContainer/i, confidence: 100 },
    ]
  },
  {
    name: 'Vue',
    category: 'Frontend',
    matchers: [
      { type: 'html', pattern: /data-v-/i, confidence: 80 },
      { type: 'script', pattern: /vue.*\.js/i, confidence: 90 },
      { type: 'html', pattern: /__VUE__/i, confidence: 100 },
    ]
  },
  {
    name: 'Angular',
    category: 'Frontend',
    matchers: [
      { type: 'html', pattern: /ng-app/i, confidence: 100 },
      { type: 'html', pattern: /ng-version/i, confidence: 100 },
      { type: 'script', pattern: /angular.*\.js/i, confidence: 90 },
    ]
  },
  {
    name: 'jQuery',
    category: 'Frontend',
    matchers: [
      { type: 'script', pattern: /jquery.*\.js/i, confidence: 100 },
    ]
  },
  {
    name: 'WordPress',
    category: 'CMS',
    matchers: [
      { type: 'html', pattern: /wp-content/i, confidence: 100 },
      { type: 'html', pattern: /wp-includes/i, confidence: 100 },
      { type: 'meta', key: 'generator', pattern: /WordPress/i, confidence: 100 },
    ]
  },
  {
    name: 'Shopify',
    category: 'CMS',
    matchers: [
      { type: 'html', pattern: /cdn\.shopify\.com/i, confidence: 100 },
      { type: 'script', pattern: /shopify/i, confidence: 90 },
      { type: 'header', key: 'x-shopid', pattern: /.*/, confidence: 100 },
    ]
  },
  {
    name: 'Squarespace',
    category: 'CMS',
    matchers: [
      { type: 'html', pattern: /static\.squarespace\.com/i, confidence: 100 },
      { type: 'header', key: 'server', pattern: /Squarespace/i, confidence: 100 },
    ]
  },
  {
    name: 'Wix',
    category: 'CMS',
    matchers: [
      { type: 'html', pattern: /static\.wixstatic\.com/i, confidence: 100 },
      { type: 'header', key: 'x-wix-request-id', pattern: /.*/, confidence: 100 },
    ]
  },
  {
    name: 'Nginx',
    category: 'Server',
    matchers: [
      { type: 'header', key: 'server', pattern: /nginx/i, confidence: 100 },
    ]
  },
  {
    name: 'Apache',
    category: 'Server',
    matchers: [
      { type: 'header', key: 'server', pattern: /apache/i, confidence: 100 },
    ]
  },
  {
    name: 'IIS',
    category: 'Server',
    matchers: [
      { type: 'header', key: 'server', pattern: /IIS/i, confidence: 100 },
    ]
  },
  {
    name: 'Cloudflare',
    category: 'CDN',
    matchers: [
      { type: 'header', key: 'server', pattern: /cloudflare/i, confidence: 100 },
      { type: 'cookie', key: '__cfduid', pattern: /.*/, confidence: 100 },
      { type: 'cookie', key: '__cf_bm', pattern: /.*/, confidence: 100 },
    ]
  },
  {
    name: 'Akamai',
    category: 'CDN',
    matchers: [
      { type: 'header', key: 'server', pattern: /AkamaiGHost/i, confidence: 100 },
      { type: 'header', key: 'x-akamai-request-id', pattern: /.*/, confidence: 100 },
    ]
  },
  {
    name: 'Google Analytics',
    category: 'Analytics',
    matchers: [
      { type: 'script', pattern: /google-analytics\.com\/analytics\.js/i, confidence: 100 },
      { type: 'script', pattern: /googletagmanager\.com\/gtag\/js/i, confidence: 100 },
    ]
  },
  {
    name: 'Fathom',
    category: 'Analytics',
    matchers: [
      { type: 'script', pattern: /cdn\.usefathom\.com/i, confidence: 100 },
    ]
  }
];

const enterpriseSignatures = [
  { name: 'Tyler Technologies (Odyssey)', pattern: /tylertech|odyssey/i },
  { name: 'JBITS', pattern: /jbits/i },
  { name: 'LexisNexis', pattern: /lexisnexis/i }
];

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    });

    const html = await response.text();
    const headers = response.headers;
    const cookies = headers.get('set-cookie') || '';

    const $ = cheerio.load(html);
    const scripts = $('script').map((i, el) => $(el).attr('src') || '').get();
    const metas = $('meta').map((i, el) => ({ name: $(el).attr('name') || $(el).attr('property') || '', content: $(el).attr('content') || '' })).get();

    const results: Record<string, { category: string; confidence: number }> = {};

    for (const tech of technologies) {
      let maxConfidence = 0;

      for (const matcher of tech.matchers) {
        let matched = false;

        if (matcher.type === 'header' && matcher.key) {
          const headerVal = headers.get(matcher.key);
          if (headerVal && matcher.pattern.test(headerVal)) matched = true;
        } else if (matcher.type === 'cookie' && matcher.key) {
          if (cookies.includes(matcher.key)) matched = true;
        } else if (matcher.type === 'html') {
          if (matcher.pattern.test(html)) matched = true;
        } else if (matcher.type === 'script') {
          if (scripts.some(s => matcher.pattern.test(s))) matched = true;
        } else if (matcher.type === 'meta' && matcher.key) {
          if (metas.some(m => m.name.toLowerCase() === matcher.key?.toLowerCase() && matcher.pattern.test(m.content))) matched = true;
        }

        if (matched && matcher.confidence > maxConfidence) {
          maxConfidence = matcher.confidence;
        }
      }

      if (maxConfidence > 0) {
        results[tech.name] = { category: tech.category, confidence: maxConfidence };
      }
    }

    // --- Granular Data Discovery ---
    const ogImage = metas.find(m => m.name === 'og:image' || m.name === 'twitter:image')?.content || null;

    const inputs = $('input, select').map((i, el) => ({
      tag: el.tagName.toLowerCase(),
      name: $(el).attr('name') || null,
      id: $(el).attr('id') || null
    })).get().filter(input => input.name || input.id);

    const scriptContents = $('script:not([src])').map((i, el) => $(el).html() || '').get();
    
    let foundVariables: string[] = [];
    scriptContents.forEach(content => {
      if (/API_BASE_URL/i.test(content)) foundVariables.push('API_BASE_URL');
      if (/__REDUX_STATE__/i.test(content) || /window\.__PRELOADED_STATE__/i.test(content)) foundVariables.push('Redux State Store');
      if (/__INITIAL_STATE__/i.test(content) || /window\.__INITIAL_STATE__/i.test(content)) foundVariables.push('Vuex/Generic State Store');
      if (/window\.[a-zA-Z0-9_]+\s*=\s*\{/i.test(content)) foundVariables.push('Global JSON Configuration');
    });

    let foundEnterprise: string[] = [];
    enterpriseSignatures.forEach(sig => {
      if (sig.pattern.test(html) || scripts.some(src => sig.pattern.test(src))) {
        foundEnterprise.push(sig.name);
      }
    });

    const genericInputPatterns = /caseType|partyRole|caseId|partyId|documentType|filingType/i;
    const hasGenericInputs = inputs.some(input => 
      (input.name && genericInputPatterns.test(input.name)) || 
      (input.id && genericInputPatterns.test(input.id))
    );

    let isModern = false;
    if (results['React'] || results['Vue'] || results['Angular'] || results['Next.js']) {
      isModern = true;
    }

    return NextResponse.json({ 
      url: targetUrl, 
      status: response.status,
      technologies: results,
      ogImage,
      inputs,
      foundVariables: Array.from(new Set(foundVariables)),
      foundEnterprise: Array.from(new Set(foundEnterprise)),
      hasGenericInputs,
      isModern
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to scan URL' }, { status: 500 });
  }
}
