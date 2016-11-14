const IE9_RULE_LIMIT = 4095;
const hasInsertRule = Boolean(CSSStyleSheet.prototype.insertRule);

const StyletronClient = require('styletron-client');

/**
 * StyletronClientOldIE
 * @extends StyletronClient
 * @packagename styletron-client-old-ie
 * @example
 * const styleElement = document.querySelector('style');
 * const styletron = new StyletronClientOldIE(styleElement);
 */
class StyletronClientOldIE extends StyletronClient {
  /**
   * Create a new StyletronClient instance
   * @param {NodeList|HTMLCollection|HTMLStyleElement[]} serverStyles - List of server style elements
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Inject declaration into the stylesheet and return the unique class name
   * @return {string}      class name
   * @example
   * // <style id="styletron">.c0{color:red}</style>
   * const styletron = new StyletronClient(document.getElementsByClassName('_styletron_hydrate_'));
   * styletron.injectDeclaration({prop: 'color', val: 'blue'});
   * // → 'c1'
   * styletron.injectDeclaration({prop: 'color', val: 'red', media: '(min-width: 800px)'});
   * // → 'c2'
   * styletron.injectDeclaration({prop: 'color', val: 'red'});
   * // → 'c0'
   */
  injectDeclaration(decl) {
    const cached = this.getCachedDeclaration(decl);
    if (cached) {
      return cached;
    }
    if (decl.media) {
      if (this.mediaSheets[decl.media] && this.mediaSheets[decl.media].sheet.cssRules.length >= IE9_RULE_LIMIT) {
        const mediaRollover = document.createElement('style');
        this.mediaSheets[decl.media].parentNode.insertBefore(mediaRollover, this.mediaSheets[decl.media]);
        this.mediaSheets[decl.media] = mediaRollover.sheet;
      }
    } else if (this.mainSheet && this.mainSheet.sheet.cssRules.length >= IE9_RULE_LIMIT) {
      const rolloverSheet = document.createElement('style');
      this.mainSheet.parentNode.insertBefore(rolloverSheet, this.mainSheet);
      this.mainSheet = rolloverSheet.sheet;
    }
    // Use insertRule as normal if defined
    if (hasInsertRule) {
      return super.injectDeclaration(decl);
    }

    this.uniqueCount++;
    const className = `${this.prefix}${this.uniqueCount.toString(36)}`;

    // Otherwise, use addRule for IE8
    const declString = `${decl.prop}:${decl.val}`;
    let selector = `.${className}`;
    if (decl.pseudo) {
      selector += decl.pseudo;
    }
    
    let sheet;
    if (decl.media) {
      if (!this.mediaSheets[decl.media]) {
        const mediaSheet = document.createElement('style');
        this.mediaSheets[decl.media] = mediaSheet;
        this.mainSheet.parentNode.appendChild(mediaSheet);
      }
      sheet = this.mediaSheets[decl.media].sheet;
    } else {
      sheet = this.mainSheet.sheet;
    }
    sheet.addRule(selector, declString);
    return className;
  }
}

module.exports = StyletronClientOldIE;
