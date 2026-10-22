import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Story, Verdict } from "@/lib/types";

// schema.org structured data for a File: NewsArticle + one ClaimReview per checked
// claim (Google's fact-check markup) + FAQPage.

const RATING: Record<Verdict, [number, string]> = {
  confirmed: [5, "True"],
  likely: [4, "Mostly true"],
  unverified: [3, "Unproven"],
  misleading: [2, "Misleading"],
  false: [1, "False"],
};

export function storyUrl(s: Story) {
  return `${SITE_URL}/story/${s.slug}`;
}

export function storyJsonLd(s: Story) {
  const url = storyUrl(s);
  const publisher = { "@type": "NewsMediaOrganization", name: SITE_NAME, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/mark.svg` } };
  const graph: object[] = [
    {
      "@type": "NewsArticle",
      headline: s.headline,
      description: s.seo?.description ?? s.dek,
      datePublished: s.publishedAt,
      dateModified: s.publishedAt,
      mainEntityOfPage: url,
      url,
      image: [`${url}/opengraph-image`],
      keywords: s.seo?.keywords?.join(", "),
      articleSection: s.category,
      author: { "@type": "Organization", name: `${SITE_NAME} Newsroom`, url: `${SITE_URL}/about` },
      publisher,
    },
    ...s.claims.map((c) => ({
      "@type": "ClaimReview",
      url,
      claimReviewed: c.claim,
      datePublished: s.publishedAt,
      author: publisher,
      itemReviewed: { "@type": "Claim", author: { "@type": "Person", name: c.claimant } },
      reviewRating: { "@type": "Rating", ratingValue: RATING[c.verdict][0], bestRating: 5, worstRating: 1, alternateName: RATING[c.verdict][1] },
    })),
  ];
  // The story's hard question leads the FAQ: people search in questions.
  const faq = [...(s.question ? [{ q: s.question.text, a: s.question.short }] : []), ...(s.seo?.faq ?? [])];
  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function readMinutes(s: Story) {
  const words = [...s.body, ...s.coreFacts.map((f) => f.text)].join(" ").split(/\s+/).length;
  return Math.max(2, Math.round(words / 230));
}
