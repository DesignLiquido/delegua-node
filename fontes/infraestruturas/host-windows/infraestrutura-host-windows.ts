import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { InfraestruturaWindows } from '@designliquido/delegua-interface-grafica';

// ─────────────────────────────────────────────────────────────────────────────
// Script PowerShell gravado no diretório temporário
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Script PowerShell que implementa o host de interface gráfica com WinForms.
 *
 * Protocolo (mesmo de InfraestruturaProcessoExterno):
 *   - Envia `{"tipo":"pronto"}` ao stdout assim que estiver pronto para receber mensagens.
 *   - Lê mensagens JSON (linha por linha) do stdin e cria/atualiza controles WinForms.
 *   - Emite eventos de volta ao Node.js via stdout JSON lines.
 *
 * Notas de implementação PowerShell:
 *   - Funções são declaradas com `function global:` para ficarem acessíveis dentro
 *     de handlers de eventos WinForms (Add_Tick, Add_Click etc.), que executam em
 *     escopo global no PowerShell 5.1, não no escopo do script.
 *   - A leitura do stdin é feita por uma classe C# compilada com `Add-Type`, que
 *     roda em thread .NET puro sem precisar de runspace PowerShell.
 *   - O timer WinForms (30 ms) drena a fila de mensagens na thread de UI.
 */
const SCRIPT_POWERSHELL = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# Leitor de stdin em C# puro: thread .NET sem runspace PowerShell
Add-Type @"
using System;
using System.Collections.Concurrent;
using System.Threading;
public class DguaStdinLeitor {
    public static void Iniciar(ConcurrentQueue<string> fila) {
        var t = new Thread(() => {
            try {
                string linha;
                while ((linha = Console.In.ReadLine()) != null) {
                    var l = linha.Trim();
                    if (l.Length > 0) fila.Enqueue(l);
                }
            } catch {}
            fila.Enqueue("{\\"tipo\\":\\"encerrar\\"}");
        });
        t.IsBackground = true;
        t.Start();
    }
}
"@

$script:fila              = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
$script:elementos         = [System.Collections.Hashtable]::new()
$script:textosComponentes = [System.Collections.Hashtable]::new()

# ── Funções globais ─────────────────────────────────────────────────────────
# Devem ser "global:" para ficarem acessíveis em handlers de eventos WinForms.

function global:DguaEnviar([hashtable]$obj) {
    $json = ($obj | ConvertTo-Json -Compress -Depth 3)
    [Console]::Out.WriteLine($json)
    [Console]::Out.Flush()
}

function global:DguaCriarPainel([string]$paiId, [string]$id, $dir) {
    $p = New-Object System.Windows.Forms.FlowLayoutPanel
    $p.FlowDirection = $dir
    $p.WrapContents  = $false
    $p.AutoSize      = $true
    $p.AutoSizeMode  = [System.Windows.Forms.AutoSizeMode]::GrowAndShrink
    $script:elementos[$paiId].Controls.Add($p)
    $script:elementos[$id] = $p
}

function global:DguaProcessar([string]$linha) {
    try {
        $msg = $linha | ConvertFrom-Json
    } catch {
        [Console]::Error.WriteLine('[DG] JSON invalido: ' + $linha)
        return
    }
    switch ($msg.tipo) {
        'criar-janela' {
            $script:mainForm.Text   = if ($msg.titulo)  { $msg.titulo  } else { 'Delegua' }
            $script:mainForm.Width  = if ($msg.largura) { [int]$msg.largura } else { 800 }
            $script:mainForm.Height = if ($msg.altura)  { [int]$msg.altura + 40 } else { 440 }
            $script:elementos[$msg.id] = $script:painelRaiz
            $script:mainForm.Visible = $true
            $script:mainForm.BringToFront()
            $script:mainForm.Activate()
        }
        'criar-botao' {
            $id  = $msg.id
            $btn = New-Object System.Windows.Forms.Button
            $btn.Text     = $msg.rotulo
            $btn.AutoSize = $true
            $btn.Margin   = New-Object System.Windows.Forms.Padding(4)
            $btn.Add_Click({ DguaEnviar @{ tipo='evento'; componenteId=$id; evento='clique' } }.GetNewClosure())
            $script:elementos[$msg.paiId].Controls.Add($btn)
            $script:elementos[$id] = $btn
        }
        'criar-rotulo' {
            $lbl = New-Object System.Windows.Forms.Label
            $lbl.Text     = $msg.texto
            $lbl.AutoSize = $true
            $lbl.Margin   = New-Object System.Windows.Forms.Padding(4)
            $script:elementos[$msg.paiId].Controls.Add($lbl)
            $script:elementos[$msg.id] = $lbl
            $script:textosComponentes[$msg.id] = $msg.texto
        }
        'criar-caixa-texto' {
            $id  = $msg.id
            $inp = New-Object System.Windows.Forms.TextBox
            $inp.Text   = if ($msg.textoInicial) { $msg.textoInicial } else { '' }
            $inp.Width  = 200
            $inp.Margin = New-Object System.Windows.Forms.Padding(4)
            $inp.Add_TextChanged({
                $script:textosComponentes[$id] = $inp.Text
                DguaEnviar @{ tipo='valor-atualizado'; id=$id; valor=$inp.Text }
                DguaEnviar @{ tipo='evento'; componenteId=$id; evento='alterado'; valor=$inp.Text }
            }.GetNewClosure())
            $script:elementos[$msg.paiId].Controls.Add($inp)
            $script:elementos[$id]         = $inp
            $script:textosComponentes[$id] = $inp.Text
        }
        'criar-caixa-vertical' {
            DguaCriarPainel $msg.paiId $msg.id ([System.Windows.Forms.FlowDirection]::TopDown)
        }
        'criar-caixa-horizontal' {
            DguaCriarPainel $msg.paiId $msg.id ([System.Windows.Forms.FlowDirection]::LeftToRight)
        }
        'definir-texto' {
            $el = $script:elementos[$msg.id]
            if ($null -ne $el) { $el.Text = $msg.texto }
            $script:textosComponentes[$msg.id] = $msg.texto
        }
        'encerrar' { $script:mainForm.Close() }
    }
}

# ── Formulário principal ─────────────────────────────────────────────────────

$script:mainForm = New-Object System.Windows.Forms.Form
$script:mainForm.Visible    = $false
$script:mainForm.AutoScroll = $true

# Painel raiz: preenche o formulário sem AutoSize (conflita com Dock=Fill)
$script:painelRaiz = New-Object System.Windows.Forms.FlowLayoutPanel
$script:painelRaiz.FlowDirection = [System.Windows.Forms.FlowDirection]::TopDown
$script:painelRaiz.WrapContents  = $false
$script:painelRaiz.Dock          = [System.Windows.Forms.DockStyle]::Fill
$script:mainForm.Controls.Add($script:painelRaiz)

# Força criação do handle (necessário para que Invoke funcione antes do Show)
$null = $script:mainForm.Handle

$script:mainForm.Add_FormClosed({
    DguaEnviar @{ tipo='fechado' }
})

# ── Timer que drena a fila na thread de UI ───────────────────────────────────

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 30
$timer.Add_Tick({
    try {
        $item = [string]$null
        while ($script:fila.TryDequeue([ref]$item)) {
            DguaProcessar $item
        }
    } catch {
        [Console]::Error.WriteLine('[DG] Erro no timer: ' + $_.Exception.Message)
    }
})
$timer.Start()

# ── Inicia leitor de stdin (thread C#) ──────────────────────────────────────

[DguaStdinLeitor]::Iniciar($script:fila)

# Sinaliza que está pronto para receber mensagens (protocolo InfraestruturaProcessoExterno)
[Console]::Out.WriteLine('{"tipo":"pronto"}')
[Console]::Out.Flush()

[System.Windows.Forms.Application]::Run($script:mainForm)
`;

// ─────────────────────────────────────────────────────────────────────────────
// Fábrica pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria uma instância de `InfraestruturaWindows` apontando para um processo
 * PowerShell filho que exibe a janela com WinForms.
 *
 * Compatível com o protocolo `InfraestruturaProcessoExterno`: o script envia
 * `{"tipo":"pronto"}` antes de entrar no laço de eventos, garantindo que as
 * mensagens (criar-janela, criar-botao, …) só cheguem depois que o WinForms
 * já está inicializado.
 */
export function criarHostWindows(): InfraestruturaWindows {
    const dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'delegua-gui-'));
    const caminhoScript = path.join(dirTemp, 'delegua-gui.ps1');
    fs.writeFileSync(caminhoScript, SCRIPT_POWERSHELL, 'utf-8');

    return new InfraestruturaWindows({
        comando: 'powershell.exe',
        argumentos: [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy', 'Bypass',
            '-File', caminhoScript,
        ],
    });
}

/**
 * Retorna `true` se estamos no Windows, onde PowerShell e WinForms
 * estão disponíveis sem instalação adicional.
 */
export function podeUsarHostWindows(): boolean {
    return process.platform === 'win32';
}
