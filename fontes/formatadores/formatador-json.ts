export class FormatadorJson {
    formatar(simbolos: { type: string, value: string }[]): string {
        let resultado = "";
        let indentacao = 0;
        let anterior = undefined;

        for (let elemento of simbolos) {
            switch (elemento.type) {
                case 'OPEN_BRACE':
                    if (anterior?.type === 'COLON') {
                        resultado += elemento.value + '\n';
                    } else {
                        resultado += ' '.repeat(indentacao) + elemento.value + '\n';
                    }
                    
                    indentacao += 2;
                    break;
                case 'OPEN_BRACKET':
                    resultado += ' '.repeat(indentacao) + elemento.value + '\n';
                    indentacao += 2;
                    break;
                case 'CLOSE_BRACE':
                    indentacao -= 2;
                    resultado += '\n' + ' '.repeat(indentacao) + elemento.value;
                    break;
                case 'CLOSE_BRACKET':
                    indentacao -= 2;

                    if (anterior?.type === 'CLOSE_BRACE') {
                        resultado += '\n' + ' '.repeat(indentacao) + elemento.value;
                    } else {
                        resultado += '\n' + elemento.value;
                    }

                    break;
                case 'COMMA':
                    resultado += elemento.value + '\n';
                    break;
                case 'COLON':
                    resultado += elemento.value + ' ';
                    break;
                default:
                    if (anterior?.type === 'COLON') {
                        resultado += elemento.value;
                    } else {
                        resultado += ' '.repeat(indentacao) + elemento.value;
                    }

                    break;
            }

            anterior = elemento;
        }

        return resultado;
    }
}