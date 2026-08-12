import { API_TARGET_BASE_URL } from "@/lib/api-config";

type ProxyParams = {
  path?: string[];
};

type ProxyContext = {
  params: Promise<ProxyParams>;
};

const HOP_BY_HOP_HEADERS = new Set([
  "accept-encoding",
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "expires",
  "last-modified",
  "location",
  "pragma",
];

function appendPath(baseUrl: string, pathSegments: string[]): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const cleanPath = pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return cleanPath ? `${cleanBaseUrl}/${cleanPath}` : cleanBaseUrl;
}

async function getProxyUrl(request: Request, context: ProxyContext) {
  const params = await context.params;
  const requestUrl = new URL(request.url);
  const targetUrl = new URL(appendPath(API_TARGET_BASE_URL, params.path || []));

  requestUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

function getForwardHeaders(request: Request): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

function getResponseHeaders(response: Response): Headers {
  const headers = new Headers();

  RESPONSE_HEADERS.forEach((key) => {
    const value = response.headers.get(key);

    if (value) {
      headers.set(key, value);
    }
  });

  return headers;
}

async function proxyRequest(request: Request, context: ProxyContext) {
  try {
    const method = request.method.toUpperCase();
    const targetUrl = await getProxyUrl(request, context);
    const hasBody = !["GET", "HEAD"].includes(method);

    const response = await fetch(targetUrl, {
      method,
      headers: getForwardHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    return new Response(method === "HEAD" ? null : await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: getResponseHeaders(response),
    });
  } catch {
    return Response.json(
      {
        status: 502,
        message:
          "Impossible de contacter l'API Gotfit depuis le proxy Next.js.",
      },
      { status: 502 }
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
    },
  });
}

export async function GET(request: Request, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: Request, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: Request, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: Request, context: ProxyContext) {
  return proxyRequest(request, context);
}

export async function HEAD(request: Request, context: ProxyContext) {
  return proxyRequest(request, context);
}
