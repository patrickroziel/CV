import { NextResponse } from "next/server";
import { SITE_LANGUAGE_CODES } from "@/lib/site-translation";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

const MAX_ITEMS = 80;
const MAX_TOTAL_CHARS = 28_000;
const DEFAULT_PROJECT_ID = "project-65d3abe6-8784-439b-a77";
const DEFAULT_REGION = "us-central1";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const auth = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });

// Production on Vercel uses short-lived OIDC credentials through Google Cloud
// Workload Identity Federation. Local development keeps using the ADC login on
// Patrick's Mac, so no secret or service-account key is stored in Vercel.
const GCP_PROJECT_NUMBER = "192476117892";
const GCP_WIF_POOL_ID = "vercel";
const GCP_WIF_PROVIDER_ID = "vercel";
const GCP_SERVICE_ACCOUNT_EMAIL =
  "vercel-translate@project-65d3abe6-8784-439b-a77.iam.gserviceaccount.com";
const GCP_WIF_AUDIENCE = `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_WIF_POOL_ID}/providers/${GCP_WIF_PROVIDER_ID}`;

let federatedAccessTokenCache: { token: string; expiresAt: number } | null = null;
let federatedAccessTokenPromise: Promise<string> | null = null;

const DIALECT_TARGETS = {
  "nouchi-ci": {
    name: "nouchi ivoirien",
    instruction:
      "Utilise un nouchi ivoirien contemporain, naturel et lisible, tel qu’on peut le rencontrer en Côte d’Ivoire. Garde le sens précis du texte. Pour les termes professionnels, techniques ou les libellés d’interface qui n’ont pas d’équivalent nouchi stable, emploie un français ivoirien naturel plutôt que d’inventer un mot. Évite de surcharger chaque phrase d’argot : le résultat doit rester fluide et compréhensible.",
  },
  "gcf-antilles": {
    name: "créole antillais (Guadeloupe et Martinique)",
    instruction:
      "Utilise un créole antillais à base lexicale française, naturel et largement compréhensible en Guadeloupe et en Martinique. Ne produis pas du créole haïtien. Pour les formulations qui diffèrent entre Guadeloupe et Martinique, privilégie une forme commune ou neutre plutôt qu'une forme très locale.",
  },
  "ar-maghreb": {
    name: "arabe maghrébin",
    instruction:
      "Utilise un arabe maghrébin contemporain, naturel et compréhensible à travers le Maroc, l'Algérie et la Tunisie. Écris en alphabet arabe. Évite de rendre le texte exclusivement marocain, algérien ou tunisien lorsqu'une formulation maghrébine plus commune est possible.",
  },
  "ar-egypt": {
    name: "arabe égyptien (masri)",
    instruction:
      "Utilise l'arabe égyptien contemporain (masri), naturel et idiomatique, écrit en alphabet arabe. Le résultat doit ressembler à la manière dont un Égyptien écrirait naturellement le même message, sans basculer vers l'arabe littéraire sauf lorsque le contexte l'exige.",
  },
  "snk-soninke": {
    name: "soninké (Sooninkanxanne)",
    instruction:
      "Utilise un soninké contemporain naturel et idiomatique, écrit en alphabet latin. Privilégie des formulations largement compréhensibles par les locuteurs soninkés d'Afrique de l'Ouest. Ne remplace pas le soninké par du bambara, du wolof ou du français. Pour les libellés d'interface, reste bref et naturel.",
  },
} as const;

type DialectTarget = keyof typeof DIALECT_TARGETS;

function cleanTexts(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const texts = value.map((item) => (typeof item === "string" ? item : ""));
  if (!texts.length || texts.length > MAX_ITEMS) return null;
  const total = texts.reduce((sum, item) => sum + item.length, 0);
  if (total > MAX_TOTAL_CHARS) return null;
  return texts;
}

function fallbackTarget(target: string) {
  if (target === "en-GB" || target === "en-US") return "en";
  if (target === "pt-PT") return "pt";
  if (target === "ar-msa") return "ar";
  return target;
}

function isDialectTarget(target: string): target is DialectTarget {
  return Object.prototype.hasOwnProperty.call(DIALECT_TARGETS, target);
}

type GoogleTranslationResponse = {
  translations?: Array<{ translatedText?: string; model?: string }>;
  error?: { message?: string; status?: string };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string; status?: string };
};

type StsResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type ImpersonationResponse = {
  accessToken?: string;
  expireTime?: string;
  error?: { message?: string; status?: string };
};

async function exchangeVercelOidcForGoogleAccessToken(oidcToken: string) {
  const stsResponse = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      audience: GCP_WIF_AUDIENCE,
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      scope: CLOUD_PLATFORM_SCOPE,
      subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
      subjectToken: oidcToken,
    }),
    cache: "no-store",
  });

  let stsPayload: StsResponse = {};
  try {
    stsPayload = (await stsResponse.json()) as StsResponse;
  } catch {
    // Keep the empty payload for the readable error below.
  }

  if (!stsResponse.ok || !stsPayload.access_token) {
    throw new Error(
      stsPayload.error_description ||
        stsPayload.error ||
        `Échange OIDC Vercel → Google refusé (${stsResponse.status}).`
    );
  }

  const impersonationResponse = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(
      GCP_SERVICE_ACCOUNT_EMAIL
    )}:generateAccessToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stsPayload.access_token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ scope: [CLOUD_PLATFORM_SCOPE] }),
      cache: "no-store",
    }
  );

  let impersonationPayload: ImpersonationResponse = {};
  try {
    impersonationPayload = (await impersonationResponse.json()) as ImpersonationResponse;
  } catch {
    // Keep the empty payload for the readable error below.
  }

  if (!impersonationResponse.ok || !impersonationPayload.accessToken) {
    throw new Error(
      impersonationPayload.error?.message ||
        `Impersonation du compte de service refusée (${impersonationResponse.status}).`
    );
  }

  const parsedExpiry = impersonationPayload.expireTime
    ? Date.parse(impersonationPayload.expireTime)
    : Number.NaN;
  const expiresAt = Number.isFinite(parsedExpiry)
    ? parsedExpiry
    : Date.now() + 50 * 60 * 1000;

  federatedAccessTokenCache = {
    token: impersonationPayload.accessToken,
    expiresAt,
  };

  return impersonationPayload.accessToken;
}

async function getVercelFederatedAccessToken(oidcToken: string) {
  if (
    federatedAccessTokenCache &&
    federatedAccessTokenCache.expiresAt - Date.now() > 60_000
  ) {
    return federatedAccessTokenCache.token;
  }

  if (!federatedAccessTokenPromise) {
    federatedAccessTokenPromise = exchangeVercelOidcForGoogleAccessToken(oidcToken).finally(() => {
      federatedAccessTokenPromise = null;
    });
  }

  return federatedAccessTokenPromise;
}

async function getLocalAdcAccessToken() {
  const client = await auth.getClient();
  const result = await client.getAccessToken();
  const token = typeof result === "string" ? result : result?.token;
  if (!token) throw new Error("ADC n’a pas fourni de jeton d’accès Google Cloud.");
  return token;
}

async function getAccessToken(request: Request) {
  const vercelOidcToken = request.headers.get("x-vercel-oidc-token")?.trim();
  if (vercelOidcToken) {
    return getVercelFederatedAccessToken(vercelOidcToken);
  }
  return getLocalAdcAccessToken();
}

async function callTranslationApi({
  texts,
  target,
  projectId,
  region,
  token,
  useLlm,
}: {
  texts: string[];
  target: string;
  projectId: string;
  region: string;
  token: string;
  useLlm: boolean;
}) {
  const endpoint = useLlm
    ? `https://translation.googleapis.com/v3/projects/${encodeURIComponent(projectId)}:translateText`
    : `https://translation.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/locations/global:translateText`;

  const googleTarget = useLlm ? target : fallbackTarget(target);
  const body = {
    contents: texts,
    mimeType: "text/plain",
    targetLanguageCode: googleTarget,
    ...(useLlm
      ? {
          model: `projects/${projectId}/locations/${region}/models/general/translation-llm`,
        }
      : {}),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": projectId,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: GoogleTranslationResponse = {};
  try {
    payload = (await response.json()) as GoogleTranslationResponse;
  } catch {
    // Keep an empty payload so the caller can return a readable error.
  }

  return { response, payload };
}

async function callDialectGemini({
  texts,
  target,
  projectId,
  token,
}: {
  texts: string[];
  target: DialectTarget;
  projectId: string;
  token: string;
}) {
  const dialect = DIALECT_TARGETS[target];
  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${encodeURIComponent(
    projectId
  )}/locations/global/publishers/google/models/gemini-3.5-flash:generateContent`;

  const prompt = [
    `Traduis chacun des textes français suivants vers ${dialect.name}.`,
    dialect.instruction,
    "Conserve strictement le sens, le ton, les noms propres, les chiffres, la ponctuation utile et la brièveté des libellés d'interface.",
    "Ne donne aucune explication, aucun commentaire et aucun préambule.",
    "Retourne exactement une chaîne traduite par chaîne d'entrée, dans le même ordre, sans fusionner ni découper les éléments.",
    `Textes à traduire (JSON) : ${JSON.stringify(texts)}`,
  ].join("\n");

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: { type: "string" },
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-goog-user-project": projectId,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: GeminiResponse = {};
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch {
    // Keep an empty payload so the caller can return a readable error.
  }

  if (!response.ok) {
    return {
      response,
      translations: null as string[] | null,
      error: payload.error?.message || "Google Gemini a refusé la traduction dialectale.",
    };
  }

  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.length === texts.length &&
      parsed.every((item) => typeof item === "string")
    ) {
      return { response, translations: parsed as string[], error: null };
    }
  } catch {
    // Fall through to the readable error below.
  }

  return {
    response,
    translations: null as string[] | null,
    error: "Gemini a renvoyé une traduction dialectale incomplète.",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { texts?: unknown; target?: unknown };
    const texts = cleanTexts(body.texts);
    const target = typeof body.target === "string" ? body.target : "";

    if (!texts || !SITE_LANGUAGE_CODES.has(target) || target === "fr") {
      return NextResponse.json({ error: "Requête de traduction invalide." }, { status: 400 });
    }

    const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID;
    const region = process.env.GOOGLE_TRANSLATE_REGION?.trim() || DEFAULT_REGION;

    let token: string;
    try {
      token = await getAccessToken(request);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Authentification Google Cloud indisponible.";
      return NextResponse.json(
        { error: `Authentification Google Cloud indisponible. ${detail}` },
        { status: 503 }
      );
    }

    // Nouchi, Antillean Creole, Maghrebi Arabic, Egyptian Arabic and Soninke are not
    // direct Cloud Translation target codes in this setup. Gemini is used only
    // for these stylistic/regional or unsupported variants; standard languages
    // such as Bambara, Lingala, Turkish and Vietnamese keep the fast Translation API.
    if (isDialectTarget(target)) {
      const result = await callDialectGemini({ texts, target, projectId, token });
      if (!result.response.ok || !result.translations) {
        return NextResponse.json(
          {
            error:
              result.error ||
              "La traduction dialectale Google n’est pas disponible. Vérifiez que l’API Vertex AI est activée.",
          },
          { status: result.response.status || 502 }
        );
      }
      return NextResponse.json({ translations: result.translations });
    }

    // Standard NMT is fastest for whole-page UI translation. We only try TLLM
    // first for the two English variants, where the regional distinction matters.
    const preferLlm = target === "en-GB" || target === "en-US";
    let result = await callTranslationApi({
      texts,
      target,
      projectId,
      region,
      token,
      useLlm: preferLlm,
    });

    if (!result.response.ok && preferLlm) {
      result = await callTranslationApi({
        texts,
        target,
        projectId,
        region,
        token,
        useLlm: false,
      });
    }

    if (!result.response.ok) {
      const message = result.payload.error?.message || "Google Cloud Translation a refusé la requête.";
      return NextResponse.json({ error: message }, { status: result.response.status });
    }

    const translations = result.payload.translations?.map((item) => item.translatedText ?? "") ?? [];
    if (translations.length !== texts.length) {
      return NextResponse.json({ error: "Réponse de traduction incomplète." }, { status: 502 });
    }

    return NextResponse.json({ translations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de traduire cette page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
