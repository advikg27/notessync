/**
 * Markdown Engine Package
 * Provides markdown parsing and cross-module reference resolution
 */

import { marked } from 'marked';

/**
 * Parse module references from markdown content
 * Matches pattern: @module:ID
 */
export function parseReferences(markdown: string): string[] {
  const regex = /@module:([a-zA-Z0-9_-]+)/g;
  const matches = markdown.matchAll(regex);
  const references = new Set<string>();

  for (const match of matches) {
    references.add(match[1]);
  }

  return Array.from(references);
}

/**
 * Convert markdown to HTML
 */
export async function convertMarkdownToHtml(markdown: string): Promise<string> {
  // Configure marked
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true,
  });

  return marked.parse(markdown);
}

/**
 * Resolve module references in HTML
 * Replaces @module:ID with clickable links
 */
export function resolveReferences(
  html: string,
  modules: Map<string, { id: string; title: string; type: string }>
): string {
  const regex = /@module:([a-zA-Z0-9_-]+)/g;

  return html.replace(regex, (match, moduleId) => {
    const module = modules.get(moduleId);
    if (module) {
      return `<a href="#module-${moduleId}" class="module-reference" data-module-type="${module.type}">${module.title}</a>`;
    }
    return match; // Keep original if module not found
  });
}

/**
 * Detect cyclic references in module dependencies
 */
export function detectCycles(
  moduleId: string,
  references: Map<string, string[]>
): string[] | null {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(id: string): boolean {
    visited.add(id);
    recursionStack.add(id);
    path.push(id);

    const refs = references.get(id) || [];
    for (const refId of refs) {
      if (!visited.has(refId)) {
        if (dfs(refId)) return true;
      } else if (recursionStack.has(refId)) {
        path.push(refId);
        return true;
      }
    }

    recursionStack.delete(id);
    path.pop();
    return false;
  }

  if (dfs(moduleId)) {
    return path;
  }

  return null;
}

/**
 * Generate table of contents from HTML
 */
export function generateTOC(html: string): string {
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  const headings: Array<{ level: number; text: string; id: string }> = [];

  let match;
  let counter = 0;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, ''); // Strip HTML tags
    const id = `heading-${counter++}`;
    headings.push({ level, text, id });
  }

  if (headings.length === 0) {
    return '';
  }

  let toc = '<nav class="table-of-contents">\n<h2>Table of Contents</h2>\n<ul>\n';
  let currentLevel = 1;

  for (const heading of headings) {
    while (currentLevel < heading.level) {
      toc += '<ul>\n';
      currentLevel++;
    }
    while (currentLevel > heading.level) {
      toc += '</ul>\n';
      currentLevel--;
    }
    toc += `<li><a href="#${heading.id}">${heading.text}</a></li>\n`;
  }

  while (currentLevel > 1) {
    toc += '</ul>\n';
    currentLevel--;
  }

  toc += '</ul>\n</nav>\n';

  return toc;
}

/**
 * Add IDs to headings in HTML for TOC linking
 */
export function addHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
    const id = `heading-${counter++}`;
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

/**
 * Strip markdown formatting from text
 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s+/g, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/__(.+?)__/g, '$1') // Bold
    .replace(/_(.+?)_/g, '$1') // Italic
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/!\[(.+?)\]\(.+?\)/g, '$1') // Images
    .replace(/>\s+/g, '') // Blockquotes
    .replace(/[-*+]\s+/g, '') // Lists
    .replace(/\d+\.\s+/g, ''); // Numbered lists
}

/**
 * Count words in markdown text
 */
export function countWords(markdown: string): number {
  const text = stripMarkdown(markdown);
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(markdown: string, wordsPerMinute: number = 200): number {
  const wordCount = countWords(markdown);
  return Math.ceil(wordCount / wordsPerMinute);
}

