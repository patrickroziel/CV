import { redirect } from "next/navigation";

/** Alias — the Portfolio universe lives at `/`. */
export default function PortfolioAliasPage() {
  redirect("/");
}
