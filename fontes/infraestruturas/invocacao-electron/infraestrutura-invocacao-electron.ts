import * as child_process from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';

import { InfraestruturaGraficaInterface, ComponenteInterfaceGraficaInterface } from '@designliquido/delegua-interface-grafica';

// ─────────────────────────────────────────────────────────────────────────────
// Conteúdo dos arquivos estáticos gravados no diretório temporário
// ─────────────────────────────────────────────────────────────────────────────

const ELECTRON_MAIN_JS = `
'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const net     = require('net');
const path    = require('path');
const readline = require('readline');

let mainWindow = null;
const pendentes = [];
let carregou = false;

// Socket de IPC com o processo Node.js pai
let socketHost  = null;
const filaTcp   = [];   // mensagens enviadas antes da conexão estar pronta

process.on('uncaughtException', (err) => {
    process.stderr.write('[InterfaceGrafica] Erro não tratado: ' + err.stack + '\\n');
});

function enviarAoHost(msg) {
    const linha = JSON.stringify(msg) + '\\n';
    if (socketHost) {
        socketHost.write(linha);
    } else {
        filaTcp.push(linha);
    }
}

function enviarAoRenderer(msg) {
    if (carregou && mainWindow) {
        mainWindow.webContents.send('mensagem', msg);
    } else {
        pendentes.push(msg);
    }
}

app.whenReady().then(() => {
    const rendererPath = process.argv[2];
    const porta        = parseInt(process.argv[3], 10);
    if (!rendererPath || isNaN(porta)) {
        process.stderr.write('[InterfaceGrafica] Argumentos inválidos\\n');
        app.quit();
        return;
    }

    // ── Conexão TCP de volta ao servidor do processo pai ──────────────────────
    const cliente = net.createConnection(porta, '127.0.0.1');

    cliente.on('error', (err) => {
        process.stderr.write('[InterfaceGrafica] Erro de conexão TCP: ' + err.message + '\\n');
        app.quit();
    });

    cliente.on('connect', () => {
        socketHost = cliente;
        for (const msg of filaTcp) socketHost.write(msg);
        filaTcp.length = 0;
    });

    const rl = readline.createInterface({ input: cliente, terminal: false });

    rl.on('close', () => app.quit());

    rl.on('line', (linha) => {
        if (!linha.trim()) return;
        try {
            const msg = JSON.parse(linha);
            if (msg.tipo === 'criar-janela' && !mainWindow) {
                mainWindow = new BrowserWindow({
                    width:  msg.largura || 800,
                    height: (msg.altura  || 400) + 40,
                    title:  msg.titulo  || 'Delégua',
                    show:   false,
                    webPreferences: {
                        preload: path.join(__dirname, 'preload.js'),
                        contextIsolation: true,
                        nodeIntegration: false,
                    },
                });

                mainWindow.loadFile(rendererPath);

                mainWindow.webContents.on('did-finish-load', () => {
                    carregou = true;
                    for (const m of pendentes) {
                        mainWindow.webContents.send('mensagem', m);
                    }
                    pendentes.length = 0;
                    mainWindow.show();
                    // No Windows, setAlwaysOnTop contorna a proteção contra roubo de foco.
                    if (process.platform === 'win32') {
                        mainWindow.setAlwaysOnTop(true, 'screen-saver');
                        mainWindow.setAlwaysOnTop(false);
                    }
                    mainWindow.focus();
                });

                mainWindow.webContents.on('did-fail-load', (_e, errCode, errDesc) => {
                    process.stderr.write('[InterfaceGrafica] Falha ao carregar renderer: ' + errCode + ' ' + errDesc + '\\n');
                });

                mainWindow.on('closed', () => {
                    enviarAoHost({ tipo: 'fechado' });
                    mainWindow = null;
                    app.quit();
                });
            }
            enviarAoRenderer(msg);
        } catch (e) {
            process.stderr.write('[InterfaceGrafica] Erro ao processar mensagem: ' + e.message + '\\n');
        }
    });

    // Eventos do renderer (cliques, texto alterado, etc.) → socket TCP
    ipcMain.on('mensagem', (_event, msg) => {
        enviarAoHost(msg);
    });
});

app.on('window-all-closed', () => app.quit());
`;

const PRELOAD_JS = `
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    enviar:  (msg)      => ipcRenderer.send('mensagem', msg),
    receber: (callback) => ipcRenderer.on('mensagem', (_, msg) => callback(msg)),
});
`;

const RENDERER_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interface Gráfica – Delégua</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #f0f0f0;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .delegua-caixa-vertical   { display: flex; flex-direction: column;  gap: 8px; }
        .delegua-caixa-horizontal { display: flex; flex-direction: row; gap: 8px; align-items: center; }
        .delegua-caixa-livre {
            position: relative;
            width: 100%;
            min-height: 100%;
            flex: 1 1 auto;
        }
        .delegua-botao {
            padding: 6px 16px; font-size: 13px; cursor: pointer;
            border: 1px solid #999; border-radius: 3px; background: #e8e8e8;
            align-self: flex-start;
        }
        .delegua-rotulo  { font-size: 13px; color: #222; }
        .delegua-caixa-texto {
            font-size: 13px; padding: 5px 8px;
            border: 1px solid #999; border-radius: 3px;
        }
    </style>
</head>
<body>
    <div id="delegua-raiz"></div>
    <script>
        const elementos = {};

        window.electronAPI.receber((msg) => {
            switch (msg.tipo) {
                case 'criar-janela': {
                    // A janela já foi criada pelo processo principal; apenas registramos
                    // a área de conteúdo (o próprio body) como componente raiz.
                    elementos[msg.id] = document.getElementById('delegua-raiz');
                    break;
                }
                case 'criar-botao': {
                    const btn = document.createElement('button');
                    btn.className = 'delegua-botao';
                    btn.textContent = msg.rotulo;
                    btn.onclick = () => window.electronAPI.enviar({
                        tipo: 'evento', componenteId: msg.id, evento: 'clique'
                    });
                    elementos[msg.paiId].appendChild(btn);
                    elementos[msg.id] = btn;
                    break;
                }
                case 'criar-rotulo': {
                    const lbl = document.createElement('label');
                    lbl.className = 'delegua-rotulo';
                    lbl.textContent = msg.texto;
                    elementos[msg.paiId].appendChild(lbl);
                    elementos[msg.id] = lbl;
                    break;
                }
                case 'criar-caixa-texto': {
                    const inp = document.createElement('input');
                    inp.className = 'delegua-caixa-texto';
                    inp.type = 'text';
                    inp.value = msg.textoInicial || '';
                    inp.addEventListener('input', () => {
                        window.electronAPI.enviar({ tipo: 'valor-atualizado', id: msg.id, valor: inp.value });
                        window.electronAPI.enviar({
                            tipo: 'evento', componenteId: msg.id, evento: 'alterado', valor: inp.value
                        });
                    });
                    elementos[msg.paiId].appendChild(inp);
                    elementos[msg.id] = inp;
                    break;
                }
                case 'criar-caixa-vertical': {
                    const div = document.createElement('div');
                    div.className = 'delegua-caixa-vertical';
                    elementos[msg.paiId].appendChild(div);
                    elementos[msg.id] = div;
                    break;
                }
                case 'criar-caixa-horizontal': {
                    const div = document.createElement('div');
                    div.className = 'delegua-caixa-horizontal';
                    elementos[msg.paiId].appendChild(div);
                    elementos[msg.id] = div;
                    break;
                }
                case 'criar-caixa-livre': {
                    const div = document.createElement('div');
                    div.className = 'delegua-caixa-livre';
                    elementos[msg.paiId].appendChild(div);
                    elementos[msg.id] = div;
                    break;
                }
                case 'definir-texto': {
                    const el = elementos[msg.id];
                    if (el) {
                        if (el.tagName === 'INPUT') el.value = msg.texto;
                        else el.textContent = msg.texto;
                    }
                    break;
                }
                case 'definir-geometria': {
                    const el = elementos[msg.id];
                    if (el) {
                        if (msg.x !== undefined || msg.y !== undefined) {
                            el.style.position = 'absolute';
                        }
                        if (msg.x !== undefined) {
                            el.style.left = msg.x + 'px';
                        }
                        if (msg.y !== undefined) {
                            el.style.top = msg.y + 'px';
                        }
                        if (msg.largura !== undefined) {
                            el.style.width = msg.largura + 'px';
                        }
                        if (msg.altura !== undefined) {
                            el.style.height = msg.altura + 'px';
                        }
                    }
                    break;
                }
                case 'encerrar': {
                    document.getElementById('delegua-raiz').innerHTML = '';
                    window.close();
                    break;
                }
            }
        });
    </script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
// InfraestruturaInvocacaoElectron
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Infraestrutura de interface gráfica que spawna um processo Electron filho.
 *
 * Usada quando o programa Delégua roda na linha de comando (Node.js puro),
 * sem DOM e sem WebView do VS Code. Requer que o pacote `electron` esteja
 * instalado local ou globalmente.
 *
 * Protocolo de comunicação: servidor TCP local (127.0.0.1, porta aleatória).
 * O processo pai cria o servidor; o Electron conecta de volta como cliente.
 * Mensagens trocadas como JSON delimitadas por `\n` — idêntico ao protocolo
 * de `InfraestruturaWebView`, porém via socket em vez de stdin/stdout
 * (stdin é consumido pelo Chromium durante a inicialização no Windows).
 */
export class InfraestruturaInvocacaoElectron implements InfraestruturaGraficaInterface {
    private contadorIds = 0;
    private readonly textosComponentes = new Map<string, string>();
    private resolverLaco: (() => void) | null = null;
    private processoFinalizou = false;
    private readonly tratadoresEventos = new Map<
        string,
        Map<string, (...argumentos: any[]) => Promise<void>>
    >();

    private processo: child_process.ChildProcess | null = null;
    private readonly servidor: net.Server;
    private socket: net.Socket | null = null;
    private readonly filaEnvio: string[] = [];

    constructor(caminhoBinario: string) {
        const dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'delegua-gui-'));
        const caminhoMain     = path.join(dirTemp, 'electron-main.js');
        const caminhoPreload  = path.join(dirTemp, 'preload.js');
        const caminhoRenderer = path.join(dirTemp, 'renderer.html');

        fs.writeFileSync(caminhoMain,     ELECTRON_MAIN_JS,  'utf-8');
        fs.writeFileSync(caminhoPreload,  PRELOAD_JS,        'utf-8');
        fs.writeFileSync(caminhoRenderer, RENDERER_HTML,     'utf-8');

        // Servidor TCP local: Electron conecta de volta depois de iniciar.
        // Usamos TCP em vez de stdin/stdout porque o Chromium consome fd 0
        // durante a inicialização no Windows, descartando os dados do pipe.
        this.servidor = net.createServer();

        this.servidor.once('connection', (socket) => {
            this.servidor.close();
            this.socket = socket;

            socket.on('error', () => this._encerrarInterno());
            socket.on('close', () => this._encerrarInterno());

            const leitor = readline.createInterface({ input: socket });
            leitor.on('line', (linha) => {
                try { this._processarMensagem(JSON.parse(linha)); } catch (_) {}
            });

            // Descarrega mensagens enviadas antes da conexão estar pronta
            for (const msg of this.filaEnvio) socket.write(msg);
            this.filaEnvio.length = 0;
        });

        this.servidor.listen(0, '127.0.0.1', () => {
            const porta = (this.servidor.address() as net.AddressInfo).port;

            this.processo = child_process.spawn(
                caminhoBinario,
                [caminhoMain, caminhoRenderer, String(porta)],
                { stdio: ['ignore', 'ignore', 'pipe'] }
            );

            this.processo.stderr?.on('data', (dados) => process.stderr.write(dados));

            this.processo.on('error', (err) => {
                process.stderr.write('[InterfaceGrafica] Erro ao iniciar Electron: ' + err.message + '\n');
                this._encerrarInterno();
            });

            this.processo.on('close', () => this._encerrarInterno());
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers internos
    // ─────────────────────────────────────────────────────────────────────────

    private proximoId(): string {
        return `delegua-gui-${++this.contadorIds}`;
    }

    private _enviar(msg: object): void {
        const linha = JSON.stringify(msg) + '\n';
        if (this.socket) {
            this.socket.write(linha);
        } else {
            this.filaEnvio.push(linha);
        }
    }

    private _encerrarInterno(): void {
        if (this.resolverLaco) {
            this.resolverLaco();
            this.resolverLaco = null;
        } else {
            this.processoFinalizou = true;
        }
    }

    private _processarMensagem(msg: any): void {
        if (msg.tipo === 'evento') {
            const tratadores = this.tratadoresEventos.get(msg.componenteId);
            if (tratadores) {
                const cb = tratadores.get(msg.evento);
                if (cb) {
                    const args = msg.valor !== undefined ? [msg.valor] : [];
                    cb(...args).catch(console.error);
                }
            }
        } else if (msg.tipo === 'valor-atualizado') {
            this.textosComponentes.set(msg.id, msg.valor);
        } else if (msg.tipo === 'fechado') {
            this._encerrarInterno();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Criação de componentes
    // ─────────────────────────────────────────────────────────────────────────

    criarJanela(largura: number, altura: number, titulo: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-janela', id: idComponente, largura, altura, titulo });
        return { idComponente };
    }

    criarBotao(pai: ComponenteInterfaceGraficaInterface, rotulo: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-botao', id: idComponente, paiId: pai.idComponente, rotulo });
        return { idComponente };
    }

    criarRotulo(pai: ComponenteInterfaceGraficaInterface, texto: string): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.textosComponentes.set(idComponente, texto);
        this._enviar({ tipo: 'criar-rotulo', id: idComponente, paiId: pai.idComponente, texto });
        return { idComponente };
    }

    criarCaixaTexto(
        pai: ComponenteInterfaceGraficaInterface,
        textoInicial: string
    ): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this.textosComponentes.set(idComponente, textoInicial);
        this._enviar({ tipo: 'criar-caixa-texto', id: idComponente, paiId: pai.idComponente, textoInicial });
        return { idComponente };
    }

    criarCaixaVertical(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-caixa-vertical', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    criarCaixaHorizontal(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-caixa-horizontal', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    criarCaixaLivre(pai: ComponenteInterfaceGraficaInterface): ComponenteInterfaceGraficaInterface {
        const idComponente = this.proximoId();
        this._enviar({ tipo: 'criar-caixa-livre', id: idComponente, paiId: pai.idComponente });
        return { idComponente };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Leitura e escrita de propriedades
    // ─────────────────────────────────────────────────────────────────────────

    definirTexto(componente: ComponenteInterfaceGraficaInterface, texto: string): void {
        this.textosComponentes.set(componente.idComponente, texto);
        this._enviar({ tipo: 'definir-texto', id: componente.idComponente, texto });
    }

    obterTexto(componente: ComponenteInterfaceGraficaInterface): string {
        return this.textosComponentes.get(componente.idComponente) ?? '';
    }

    definirPosicao(componente: ComponenteInterfaceGraficaInterface, x: number, y: number): void {
        this._enviar({ tipo: 'definir-geometria', id: componente.idComponente, x, y });
    }

    definirTamanho(componente: ComponenteInterfaceGraficaInterface, largura: number, altura: number): void {
        this._enviar({ tipo: 'definir-geometria', id: componente.idComponente, largura, altura });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Eventos
    // ─────────────────────────────────────────────────────────────────────────

    conectarEvento(
        componente: ComponenteInterfaceGraficaInterface,
        evento: string,
        callback: (...argumentos: any[]) => Promise<void>
    ): void {
        if (!this.tratadoresEventos.has(componente.idComponente)) {
            this.tratadoresEventos.set(componente.idComponente, new Map());
        }
        this.tratadoresEventos.get(componente.idComponente)!.set(evento, callback);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Ciclo de vida
    // ─────────────────────────────────────────────────────────────────────────

    async iniciarLaco(): Promise<void> {
        if (this.processoFinalizou) return;
        return new Promise<void>((resolve) => {
            this.resolverLaco = resolve;
        });
    }

    encerrar(): void {
        this._enviar({ tipo: 'encerrar' });
        this._encerrarInterno();
        this.socket?.destroy();
        this.servidor.close();
        try { this.processo?.kill(); } catch (_) {}
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitário: localizar o binário do Electron
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tenta localizar o binário do Electron instalado como pacote npm.
 * Verifica primeiro nas dependências locais e depois no diretório global do npm.
 * Retorna `null` se o Electron não estiver disponível.
 */
/**
 * Tenta obter o binário do Electron a partir do `index.js` do pacote, usando
 * `require`. O `index.js` do pacote Electron já resolve `path.txt` corretamente
 * (inclusive quando o executável está em uma subpasta como `dist/`).
 *
 * @param diretorioPacote Caminho absoluto para o diretório do pacote `electron`.
 */
function resolverBinarioDoIndexJs(diretorioPacote: string): string | null {
    try {
        const indexJs = path.join(diretorioPacote, 'index.js');
        if (!fs.existsSync(indexJs)) return null;
        const caminho = require(indexJs) as string;
        if (typeof caminho === 'string' && fs.existsSync(caminho)) return caminho;
    } catch (_) {}
    return null;
}

/**
 * Tenta localizar o binário do Electron instalado como pacote npm.
 * Verifica primeiro nas dependências locais e depois no diretório global do npm.
 * Retorna `null` se o Electron não estiver disponível.
 */
export function localizarElectron(): string | null {
    // 1. Dependência local do projeto atual (require resolve normal)
    try {
        const caminho = require('electron') as string;
        if (typeof caminho === 'string' && fs.existsSync(caminho)) return caminho;
    } catch (_) {}

    // 2. Instalação global do npm — requer o index.js do pacote diretamente
    try {
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const globalRoot = child_process
            .execSync(`${npm} root -g`, { encoding: 'utf-8' })
            .trim();

        // 2a. global/electron
        const resultado = resolverBinarioDoIndexJs(path.join(globalRoot, 'electron'));
        if (resultado) return resultado;

        // 2b. global/delegua/node_modules/electron
        const resultadoDelegua = resolverBinarioDoIndexJs(
            path.join(globalRoot, 'delegua', 'node_modules', 'electron')
        );
        if (resultadoDelegua) return resultadoDelegua;
    } catch (_) {}

    return null;
}
