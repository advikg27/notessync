import puppeteer from 'puppeteer';
import { resolveReferences, generateTOC, addHeadingIds, detectCycles } from '../markdown';

interface Module {
  id: string;
  title: string;
  type: string;
  versions: Array<{
    contentMarkdown: string;
    contentHtml: string | null;
  }>;
  author: {
    id: string;
    name: string;
  };
  outgoingRefs?: Array<{
    referencedModule: {
      id: string;
      title: string;
      type: string;
    };
  }>;
}

/**
 * Build module reference map for cycle detection
 */
function buildReferenceMap(modules: Module[]): Map<string, string[]> {
  const refMap = new Map<string, string[]>();

  for (const module of modules) {
    const refs = module.outgoingRefs?.map((r) => r.referencedModule.id) || [];
    refMap.set(module.id, refs);
  }

  return refMap;
}

/**
 * Check for cyclic dependencies
 */
function checkForCycles(modules: Module[]): void {
  const refMap = buildReferenceMap(modules);

  for (const module of modules) {
    const cycle = detectCycles(module.id, refMap);
    if (cycle) {
      throw new Error(`Cyclic dependency detected: ${cycle.join(' -> ')}`);
    }
  }
}

/**
 * Compile modules to HTML
 */
export async function compileToHtml(modules: Module[], title: string): Promise<string> {
  // Check for cycles
  checkForCycles(modules);

  // Build module map for reference resolution
  const moduleMap = new Map<string, { id: string; title: string; type: string }>();
  for (const module of modules) {
    moduleMap.set(module.id, {
      id: module.id,
      title: module.title,
      type: module.type,
    });

    // Add referenced modules to map
    if (module.outgoingRefs) {
      for (const ref of module.outgoingRefs) {
        moduleMap.set(ref.referencedModule.id, {
          id: ref.referencedModule.id,
          title: ref.referencedModule.title,
          type: ref.referencedModule.type,
        });
      }
    }
  }

  // Compile each module's HTML with resolved references
  let compiledContent = '';

  for (const module of modules) {
    const latestVersion = module.versions[0];
    let html = latestVersion.contentHtml || '';

    // Resolve references
    html = resolveReferences(html, moduleMap);

    // Add heading IDs for TOC
    html = addHeadingIds(html);

    // Wrap module content
    compiledContent += `
<section class="module" id="module-${module.id}" data-module-type="${module.type}">
  <div class="module-header">
    <span class="module-type">${module.type}</span>
    <h2 class="module-title">${module.title}</h2>
    <span class="module-author">by ${module.author.name}</span>
  </div>
  <div class="module-content">
    ${html}
  </div>
</section>
`;
  }

  // Generate TOC from all content
  const toc = generateTOC(compiledContent);

  // Build complete HTML document
  const fullHtml = buildHtmlTemplate(title, toc, compiledContent);

  return fullHtml;
}

/**
 * Compile modules to PDF
 */
export async function compileToPdf(modules: Module[], title: string): Promise<Buffer> {
  // First compile to HTML
  const html = await compileToHtml(modules, title);

  // Launch puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Build HTML template with styles
 */
function buildHtmlTemplate(title: string, toc: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: #fff;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
      line-height: 1.3;
    }

    h1 { font-size: 2.5rem; border-bottom: 3px solid #2563eb; padding-bottom: 0.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }

    p {
      margin-bottom: 1rem;
    }

    code {
      background: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    .table-of-contents {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .table-of-contents h2 {
      margin-top: 0;
      font-size: 1.5rem;
      color: #1f2937;
    }

    .table-of-contents ul {
      list-style-type: none;
      padding-left: 0;
    }

    .table-of-contents ul ul {
      padding-left: 1.5rem;
    }

    .table-of-contents li {
      margin: 0.5rem 0;
    }

    .table-of-contents a {
      color: #2563eb;
      text-decoration: none;
      transition: color 0.2s;
    }

    .table-of-contents a:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }

    .module {
      margin-bottom: 3rem;
      padding: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fefefe;
      page-break-inside: avoid;
    }

    .module-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .module-type {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .module[data-module-type="definition"] .module-type { background: #059669; }
    .module[data-module-type="example"] .module-type { background: #d97706; }
    .module[data-module-type="explanation"] .module-type { background: #7c3aed; }
    .module[data-module-type="diagram"] .module-type { background: #db2777; }
    .module[data-module-type="proof"] .module-type { background: #dc2626; }
    .module[data-module-type="problem"] .module-type { background: #0891b2; }

    .module-title {
      margin-top: 0.5rem;
      margin-bottom: 0.25rem;
      color: #1f2937;
    }

    .module-author {
      color: #6b7280;
      font-size: 0.875rem;
      font-style: italic;
    }

    .module-content {
      color: #374151;
    }

    .module-reference {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      background: #eff6ff;
      transition: background 0.2s;
    }

    .module-reference:hover {
      background: #dbeafe;
      text-decoration: underline;
    }

    blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 1rem;
      margin: 1rem 0;
      color: #4b5563;
      font-style: italic;
    }

    ul, ol {
      margin-bottom: 1rem;
      padding-left: 2rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }

    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem;
      text-align: left;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 5px;
      margin: 1rem 0;
    }

    @media print {
      body {
        max-width: 100%;
        padding: 0;
      }

      .module {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p style="color: #6b7280; margin-bottom: 2rem;">Generated on ${new Date().toLocaleDateString()}</p>
  </header>

  ${toc}

  <main>
    ${content}
  </main>

  <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center;">
    <p>Generated by Distributed Textbook Compiler</p>
  </footer>
</body>
</html>`;
}

