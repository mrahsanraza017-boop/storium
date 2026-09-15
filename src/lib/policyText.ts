export interface PolicySection {
  heading?: string;
  paragraphs: string[];
}

/**
 * Parse plain-text policy content into structured sections.
 * - Lines starting with "## " start a new section heading.
 * - Blank lines separate paragraphs.
 * - All other non-empty lines are joined into the current paragraph.
 */
export function parsePolicyTextToSections(raw: string): PolicySection[] {
  const sections: PolicySection[] = [];
  let current: PolicySection | null = null;
  let paragraph = '';

  const ensureSection = () => {
    if (!current) {
      current = { heading: undefined, paragraphs: [] };
      sections.push(current);
    }
  };

  const flushParagraph = () => {
    if (!paragraph.trim()) return;
    ensureSection();
    current!.paragraphs.push(paragraph.trim());
    paragraph = '';
  };

  for (const line of raw.replace(/\r/g, '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      current = { heading: trimmed.replace(/^##\s+/, ''), paragraphs: [] };
      sections.push(current);
      continue;
    }
    paragraph = paragraph ? `${paragraph} ${trimmed}` : trimmed;
  }
  flushParagraph();
  return sections;
}

/**
 * Replace {token} placeholders (e.g. {email}, {businessName}) inside policy
 * text with live values so the policies always reflect current business info.
 */
export function interpolatePolicyTokens(
  raw: string,
  tokens: Record<string, string>
): string {
  let out = raw;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{${key}}`).join(value);
  }
  return out;
}