// ==UserScript==
// @name         V2.Render LaTeX with KaTeX ($...$)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Renders LaTeX formulas using KaTeX on NotebookLM (including math in parentheses)
// @author       ergs0204
// @match        https://notebooklm.google.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js
// @resource     katexCSS https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css
// ==/UserScript==

(function () {
  'use strict';

  // Inject KaTeX CSS
  const addKaTeXStyles = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(link);
  };

  // Custom styles
  const addCustomStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .katex { font-size: 1.2em !important; display: block; }
      .katex-display { display: block; text-align: center; margin: 1em 0; }
    `;
    document.head.appendChild(style);
  };

  // Replace (LaTeX) -> $LaTeX$
  const preprocessParentheses = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent;

      // Detect expressions like "( x )" and wrap them as "$ x $"
      text = text.replace(
        /\($([^)$]+)$$/g,
        (_, content) => `$${content}$`
      );

      // Same for expressions like "( \frac{x^2}{2} + C )"
      text = text.replace(
        /\($([^)]+)$$/g,
        (_, content) => `$${content}$`
      );

      if (text !== node.textContent) {
        const span = document.createElement('span');
        span.innerHTML = text;
        return span;
      }
      return node;
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
      Array.from(node.childNodes).forEach(child => {
        const replaced = preprocessParentheses(child);
        if (replaced !== child) {
          node.replaceChild(replaced, child);
        }
      });
    }
    return node;
  };

  // Render LaTeX in the page
  const renderLaTeX = () => {
    try {
      preprocessParentheses(document.body);

      renderMathInElement(document.body, {
        strict: false,
        macros: window.katexMacros || {},
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      });
    } catch (e) {
      console.warn("KaTeX error:", e);
    }
  };

  // Observe DOM changes
  const observeMutations = () => {
    const observer = new MutationObserver(() => setTimeout(renderLaTeX, 500));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    addKaTeXStyles();
    addCustomStyles();
    window.katexMacros = {
      "\\R": "\\mathbb{R}",
      "\\Z": "\\mathbb{Z}"
    };
    setTimeout(renderLaTeX, 1000);
    observeMutations();
  });

  setInterval(renderLaTeX, 3000); // fallback

})();