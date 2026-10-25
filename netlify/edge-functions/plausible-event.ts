// Relais des événements de mesure d'audience vers Plausible (stats.staff-meal.com).
// Une simple redirection Netlify ne suffit pas : Traefik, devant Plausible, écrase le
// X-Forwarded-For venu de Netlify, et Plausible verrait l'IP du serveur Netlify au lieu
// de celle du visiteur (tous les visiteurs fusionnés, pays faux). On transmet donc
// l'IP réelle dans X-Plausible-IP, que Plausible lit en priorité et que Traefik ne touche pas.
import type { Config, Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context): Promise<Response> => {
  const upstream = await fetch("https://stats.staff-meal.com/api/event", {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "text/plain",
      "User-Agent": request.headers.get("user-agent") ?? "",
      "X-Plausible-IP": context.ip,
    },
    body: await request.text(),
  });
  return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": "text/plain" } });
};

export const config: Config = { path: "/s/event", method: "POST" };
