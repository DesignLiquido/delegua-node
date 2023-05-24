/**
 * Lexador JSON importado do pacote https://github.com/joeattardi/json-colorizer, 
 * com algumas modificações.
 */
export class LexadorJson {
  tokenTypes = [
    { regex: /^\s+/, tokenType: "WHITESPACE" },
    { regex: /^{/, tokenType: "OPEN_BRACE" },
    { regex: /^}/, tokenType: "CLOSE_BRACE" },
    { regex: /^\[/, tokenType: "OPEN_BRACKET" },
    { regex: /^\]/, tokenType: "CLOSE_BRACKET" },
    { regex: /^:/, tokenType: "COLON" },
    { regex: /^,/, tokenType: "COMMA" },
    { regex: /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i, tokenType: "NUMBER_LITERAL" },
    { regex: /^"(?:\\.|[^"\\])*"(?=\s*:)/, tokenType: "STRING_KEY" },
    { regex: /^"(?:\\.|[^"\\])*"/, tokenType: "STRING_LITERAL" },
    { regex: /^true|^false/, tokenType: "BOOLEAN_LITERAL" },
    { regex: /^null/, tokenType: "NULL_LITERAL" },
  ];

  getTokens(json: any, options: any = {}) {
    let input: any;

    if (options.pretty) {
      const inputObj = typeof json === "string" ? JSON.parse(json) : json;
      input = JSON.stringify(inputObj, null, 2);
    } else {
      input = typeof json === "string" ? json : JSON.stringify(json);
    }

    let tokens = [];
    let foundToken;

    do {
      foundToken = false;
      for (let i = 0; i < this.tokenTypes.length; i++) {
        const match = this.tokenTypes[i].regex.exec(input);
        if (match) {
          tokens.push({ type: this.tokenTypes[i].tokenType, value: match[0] });
          input = input.substring(match[0].length);
          foundToken = true;
          break;
        }
      }
    } while (this._allTokensAnalyzed(input, foundToken));

    return tokens;
  }

  /**
   * @author Willian Magalhães Gonçalves
   * @description Are all tokens analyzed?
   * @param {*} input - Input
   * @param {*} foundToken - Found token
   * @returns {boolean} checkResult - Check result
   * @private
   */
  private _allTokensAnalyzed(input: any, foundToken: any) {
    const safeInput = input || {};

    const inputLength = safeInput.length;
    return inputLength > 0 && foundToken;
  }
}
