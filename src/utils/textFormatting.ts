/**
 * Text Formatting Utilities
 * 
 * This module provides functions for advanced text formatting in chat applications.
 * It handles various formats including code blocks, text alignment, styling, and more.
 */
import Prism from 'prismjs';
// Import basic Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';

/**
 * Interface for line wrapping options
 */
interface WrapOptions {
  width?: number;
  indent?: number;
  trim?: boolean;
}

/**
 * Wraps text to a specified width
 * @param text - Text to wrap
 * @param options - Wrapping options
 * @returns Wrapped text
 */
export const wrapText = (text: string, options: WrapOptions = {}): string => {
  const { width = 80, indent = 0, trim = true } = options;
  
  if (!text) return '';
  
  // Split into lines
  const lines = text.split('\n');
  const wrappedLines = lines.map(line => {
    if (trim) line = line.trim();
    if (line.length <= width) return ' '.repeat(indent) + line;
    
    // Wrap line
    let result = '';
    let currentLine = ' '.repeat(indent);
    const words = line.split(' ');
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width + indent) {
        currentLine += (currentLine.trim().length === 0 ? '' : ' ') + word;
      } else {
        result += currentLine + '\n';
        currentLine = ' '.repeat(indent) + word;
      }
    }
    
    result += currentLine;
    return result;
  });
  
  return wrappedLines.join('\n');
};

/**
 * Centers text within a specified width
 * @param text - Text to center
 * @param width - Total width to center within
 * @returns Centered text
 */
export const centerText = (text: string, width: number = 80): string => {
  const lines = text.split('\n');
  return lines.map(line => {
    const padding = Math.max(0, width - line.length) / 2;
    return ' '.repeat(Math.floor(padding)) + line;
  }).join('\n');
};

/**
 * Aligns text to the left
 * @param text - Text to align
 * @param width - Total width to align within
 * @returns Left-aligned text
 */
export const leftAlign = (text: string, width: number = 80): string => {
  return text.split('\n').map(line => line.padEnd(width)).join('\n');
};

/**
 * Aligns text to the right
 * @param text - Text to align
 * @param width - Total width to align within
 * @returns Right-aligned text
 */
export const rightAlign = (text: string, width: number = 80): string => {
  return text.split('\n').map(line => line.padStart(width)).join('\n');
};

/**
 * Creates a text table from rows of data
 * @param headers - Array of column headers
 * @param rows - 2D array of table data
 * @param options - Table options
 * @returns Formatted table string
 */
export const createTable = (
  headers: string[],
  rows: any[][],
  options: { padding?: number; borders?: boolean } = {}
): string => {
  const { padding = 2, borders = true } = options;
  
  // Calculate column widths
  const columnWidths = headers.map((h, i) => {
    const contentWidths = rows.map(row => String(row[i]).length);
    return Math.max(h.length, ...contentWidths) + padding;
  });
  
  // Format a row with proper spacing
  const formatRow = (cells: string[]) => {
    return cells.map((cell, i) => cell.padEnd(columnWidths[i])).join(borders ? '│ ' : ' ');
  };
  
  // Create header row
  const headerRow = formatRow(headers);
  
  // Create separator row
  const separator = borders 
    ? '┼' + columnWidths.map(w => '─'.repeat(w + 1)).join('┼') + '┼'
    : columnWidths.map(w => '─'.repeat(w)).join(' ');
  
  // Format data rows
  const dataRows = rows.map(row => formatRow(row.map(cell => String(cell))));
  
  // Build complete table
  let table = headerRow + '\n' + separator + '\n' + dataRows.join('\n');
  
  // Add border if requested
  if (borders) {
    const topBorder = '┌' + columnWidths.map(w => '─'.repeat(w + 1)).join('┬') + '┐';
    const bottomBorder = '└' + columnWidths.map(w => '─'.repeat(w + 1)).join('┴') + '┘';
    table = topBorder + '\n' + table + '\n' + bottomBorder;
  }
  
  return table;
};

/**
 * Formats code blocks with syntax highlighting (mimics markdown code blocks)
 * @param code - Code content
 * @param language - Programming language for syntax
 * @returns Formatted code block
 */
export const formatCodeBlock = (code: string, language: string = ''): string => {
  return `\`\`\`${language}\n${code}\n\`\`\``;
};

/**
 * Formats inline code
 * @param code - Inline code content
 * @returns Formatted inline code
 */
export const formatInlineCode = (code: string): string => {
  return `\`${code}\``;
};

/**
 * Applies syntax highlighting to code using Prism.js
 * @param code - The code to highlight
 * @param language - The programming language
 * @returns Highlighted HTML
 */
export const highlightCode = (code: string, language: string = 'javascript'): string => {
  try {
    // Normalize language name
    language = language.toLowerCase().trim();
    
    // Map common language aliases
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'cs': 'csharp',
      'html': 'markup',
      'shell': 'bash',
      'sh': 'bash',
      'cpp': 'cpp',
      'jsx': 'jsx',
      'tsx': 'tsx',
      // Map PHP to plaintext to avoid errors
      'php': 'plaintext'
    };
    
    // Apply mapping if exists
    if (languageMap[language]) {
      language = languageMap[language];
    }
    
    // Default to plaintext if language not supported or empty
    if (!language || !Prism.languages[language]) {
      language = 'plaintext';
    }
    
    // Escape HTML entities to prevent injection
    const escapedCode = code.replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
    
    // Return code with proper classes for Prism to style
    return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
  } catch (error) {
    console.error('Error processing code block:', error);
    return `<pre><code>${code}</code></pre>`;
  }
};

/**
 * Parse and process text with markdown-like formatting
 * Handles:
 * - Bold (**text**)
 * - Italic (*text*)
 * - Links [text](url)
 * - Code blocks ```lang\ncode```
 * - Inline code `code`
 * - Lists (numbered and bulleted)
 * 
 * @param text - Input text with markdown formatting
 * @returns Processed text with HTML formatting
 */
export const parseMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Process code blocks first with syntax highlighting
  let processedText = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return highlightCode(code, lang || 'plaintext');
  });
  
  // Process inline code
  processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process bold - more precise to avoid accidental matching
  // Requires ** at word boundaries or space boundaries
  processedText = processedText.replace(/(\s|^)\*\*([^*\s](?:[^*]*[^*\s])?)\*\*(\s|$)/g, '$1<strong>$2</strong>$3');
  
  // Process italic - more precise to avoid accidental matching
  // Requires * at word boundaries or space boundaries, and not part of a ** (bold)
  processedText = processedText.replace(/(\s|^)\*([^*\s](?:[^*]*[^*\s])?)\*(\s|$)/g, '$1<em>$2</em>$3');
  
  // Process unordered lists - require actual bullet points at start of line
  // Requires a dash or asterisk at the beginning of the line followed by a space
  const listItemRegex = /^([\s]*)[-*] (.+)$/gm;
  const listItems = [];
  let listMatch;
  let hasListItems = false;
  
  // First collect all list items with their indentation levels
  while ((listMatch = listItemRegex.exec(processedText)) !== null) {
    const indentation = listMatch[1].length;
    const content = listMatch[2];
    listItems.push({ indentation, content, line: listMatch[0] });
    hasListItems = true;
  }
  
  // If we have list items, process them properly
  if (hasListItems) {
    // Group consecutive list items to avoid matching single items as lists
    let inList = false;
    const lines = processedText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(listItemRegex)) {
        if (!inList) {
          // Starting a new list
          lines[i] = line.replace(listItemRegex, '<li>$2</li>');
          lines.splice(i, 0, '<ul>'); // Insert opening ul tag
          i++; // Adjust index because we inserted a line
          inList = true;
        } else {
          // Continue existing list
          lines[i] = line.replace(listItemRegex, '<li>$2</li>');
        }
      } else if (inList && line.trim() === '') {
        // Empty line after list - close the list
        lines.splice(i, 0, '</ul>'); // Insert closing ul tag
        i++; // Adjust index because we inserted a line
        inList = false;
      }
    }
    
    // Make sure to close any open list at the end
    if (inList) {
      lines.push('</ul>');
    }
    
    processedText = lines.join('\n');
  }
  
  // Process ordered lists - similar careful approach
  const orderedListRegex = /^([\s]*)(\d+)\. (.+)$/gm;
  const orderedItems = [];
  let hasOrderedItems = false;
  
  // First collect all ordered list items with their indentation levels
  while ((listMatch = orderedListRegex.exec(processedText)) !== null) {
    const indentation = listMatch[1].length;
    const number = listMatch[2];
    const content = listMatch[3];
    orderedItems.push({ indentation, number, content, line: listMatch[0] });
    hasOrderedItems = true;
  }
  
  // If we have ordered list items, process them properly
  if (hasOrderedItems) {
    // Group consecutive ordered list items
    let inOrderedList = false;
    const lines = processedText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(orderedListRegex)) {
        if (!inOrderedList) {
          // Starting a new list
          lines[i] = line.replace(orderedListRegex, '<li>$3</li>');
          lines.splice(i, 0, '<ol>'); // Insert opening ol tag
          i++; // Adjust index because we inserted a line
          inOrderedList = true;
        } else {
          // Continue existing list
          lines[i] = line.replace(orderedListRegex, '<li>$3</li>');
        }
      } else if (inOrderedList && line.trim() === '') {
        // Empty line after list - close the list
        lines.splice(i, 0, '</ol>'); // Insert closing ol tag
        i++; // Adjust index because we inserted a line
        inOrderedList = false;
      }
    }
    
    // Make sure to close any open list at the end
    if (inOrderedList) {
      lines.push('</ol>');
    }
    
    processedText = lines.join('\n');
  }
  
  // Process links
  processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Process headings (# Heading)
  processedText = processedText.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  processedText = processedText.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  processedText = processedText.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  processedText = processedText.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  
  // Process quotes (> Quote)
  processedText = processedText.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Process horizontal rules (---)
  processedText = processedText.replace(/^---$/gm, '<hr>');
  
  // Add paragraph tags, but be careful about existing HTML
  const paragraphs = processedText.split('\n\n');
  processedText = paragraphs.map(p => {
    // Skip if paragraph already has HTML tags
    const trimmedP = p.trim();
    if (
      trimmedP.startsWith('<') && !trimmedP.startsWith('<code>') ||
      // Don't wrap these elements in paragraph tags
      trimmedP.startsWith('<ul>') || 
      trimmedP.startsWith('<ol>') || 
      trimmedP.startsWith('<li>') ||
      trimmedP.startsWith('<blockquote>') ||
      trimmedP.startsWith('<h') ||
      trimmedP.startsWith('<hr') ||
      trimmedP.startsWith('<pre')
    ) {
      return p;
    }
    return `<p>${p}</p>`;
  }).join('\n\n');
  
  return processedText;
};

/**
 * Formats numbers with padding
 * @param num - Number to format
 * @param width - Total width
 * @param padChar - Character to use for padding
 * @returns Formatted number string
 */
export const formatNumber = (num: number, width: number = 2, padChar: string = '0'): string => {
  return String(num).padStart(width, padChar);
};

/**
 * Formats floating point numbers with specific precision
 * @param num - Number to format
 * @param precision - Number of decimal places
 * @returns Formatted number string
 */
export const formatDecimal = (num: number, precision: number = 2): string => {
  return num.toFixed(precision);
};

/**
 * Detects and formats URLs in text
 * @param text - Input text
 * @returns Text with URLs formatted as clickable links
 */
export const formatLinks = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, url => 
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
};

/**
 * Makes text uppercase
 * @param text - Input text
 * @returns Uppercase text
 */
export const toUpperCase = (text: string): string => {
  return text.toUpperCase();
};

/**
 * Makes text lowercase
 * @param text - Input text
 * @returns Lowercase text
 */
export const toLowerCase = (text: string): string => {
  return text.toLowerCase();
};

/**
 * Converts text to title case (first letter of each word capitalized)
 * @param text - Input text
 * @returns Title case text
 */
export const toTitleCase = (text: string): string => {
  return text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

/**
 * Removes leading and trailing whitespace
 * @param text - Input text
 * @returns Trimmed text
 */
export const trimWhitespace = (text: string): string => {
  return text.trim();
};

/**
 * Creates a tabular representation of data
 * @param data - 2D array of data
 * @param hasHeader - Whether first row is a header
 * @returns Formatted table string
 */
export const createSimpleTable = (data: string[][], hasHeader: boolean = true): string => {
  if (data.length === 0) return '';
  
  const table = document.createElement('table');
  
  if (hasHeader && data.length > 0) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    data[0].forEach(cell => {
      const th = document.createElement('th');
      th.textContent = cell;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body with remaining rows
    const tbody = document.createElement('tbody');
    for (let i = 1; i < data.length; i++) {
      const tr = document.createElement('tr');
      data[i].forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  } else {
    // No header, all rows as body
    const tbody = document.createElement('tbody');
    data.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }
  
  return table.outerHTML;
};

/**
 * Process raw text into a formatted display text
 * This is the main entry point that can apply multiple formatting functions
 */
export const processText = (text: string): string => {
  if (!text) return '';
  
  // Process text with markdown and other formatting
  let processedText = parseMarkdown(text);
  
  // Format URLs that weren't caught by markdown parsing
  processedText = formatLinks(processedText);
  
  return processedText;
};

export default {
  wrapText,
  centerText,
  leftAlign,
  rightAlign,
  createTable,
  formatCodeBlock,
  formatInlineCode,
  highlightCode,
  parseMarkdown,
  formatNumber,
  formatDecimal,
  formatLinks,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  trimWhitespace,
  createSimpleTable,
  processText
}; 