const COMMANDS = [
  {
    id: 'resta',
    label: v => `Resta ${v} a ambos lados`,
    aliases: ['resta X', 'restar X', 'quita X'],
    regex: /^(?:resta|restar|sustrae?|sustraer|quita|quitar)\s+(.+?)(?:\s+(?:a|de|en)?\s*ambos\s+lados)?$/i,
    mode: 'apply', op: '-', valueGroup: 1,
  },
  {
    id: 'suma',
    label: v => `Suma ${v} a ambos lados`,
    aliases: ['suma X', 'sumar X', 'añade X'],
    regex: /^(?:suma|sumar|a[ñn]ade?|a[ñn]adir|agrega|agregar)\s+(.+?)(?:\s+(?:a\s+)?ambos\s+lados)?$/i,
    mode: 'apply', op: '+', valueGroup: 1,
  },
  {
    id: 'divide',
    label: v => `Divide ambos lados entre ${v}`,
    aliases: ['divide entre X', 'divide por X'],
    regex: /^(?:divide|dividir|div(?:idir)?)\s+(?:entre|por|\/)\s+(.+?)(?:\s+(?:en\s+)?ambos\s+lados)?$/i,
    mode: 'apply', op: '/', valueGroup: 1,
  },
  {
    id: 'multiplica',
    label: v => `Multiplica ambos lados por ${v}`,
    aliases: ['multiplica por X', 'multiplicar por X'],
    regex: /^(?:multiplica|multiplicar|mult)\s+(?:por|x|\*)\s+(.+?)(?:\s+(?:en\s+)?ambos\s+lados)?$/i,
    mode: 'apply', op: '*', valueGroup: 1,
  },
  {
    id: 'simplifica',
    label: () => 'Simplifica',
    aliases: ['simplifica', 'cancela', 'reduce'],
    regex: /^(?:simplifica|simplificar|simplify|reduce|reducir|cancela|cancelar|simplif)$/i,
    mode: 'simplify',
  },
  {
    id: 'expande',
    label: () => 'Expande',
    aliases: ['expande', 'desarrolla'],
    regex: /^(?:expande|expandir|expand|desarrolla|desarrollar)$/i,
    mode: 'expand',
  },
  {
    id: 'factoriza',
    label: () => 'Factoriza',
    aliases: ['factoriza', 'factor'],
    regex: /^(?:factori[zs]a|factori[zs]ar|factor)$/i,
    mode: 'factor',
  },
  {
    id: 'resuelve',
    label: v => `Resuelve para ${v}`,
    aliases: ['resuelve', 'resuelve x', 'despeja'],
    regex: /^(?:resuelve|resolver|solve|despeja|despejar)(?:\s+([a-zA-Z]))?$/i,
    mode: 'solve',
    getVar: m => (m[1] || 'x').trim(),
  },
  {
    id: 'eleva',
    label: v => `Eleva al ${v === '2' ? 'cuadrado' : v}`,
    aliases: ['eleva al cuadrado', 'eleva a la N'],
    regex: /^(?:eleva|elevar)(?:\s+(?:ambos\s+lados\s+)?(?:al?\s+cuadrado|a\s+la\s+(.+)))?$|^(?:al\s+)?cuadrado$/i,
    mode: 'power',
    getVal: m => (m[1] || '2').trim(),
  },
  {
    id: 'raiz',
    label: () => 'Raíz cuadrada a ambos lados',
    aliases: ['raíz', 'raíz cuadrada', 'sqrt'],
    regex: /^(?:ra[íi]z(?:\s+cuadrada)?|sqrt|racionaliza)$/i,
    mode: 'sqrt',
  },
];

let state = {
  steps: [],
  currentAlg: null,
};

function normalizeMathFunction(expr) {
  let result = expr;
  
  const replacements = [
    [/\b(logaritmo\s+natural|log\s+natural)\b/gi, 'log'],
    [/\blogaritmo\b/gi, 'log'],
    [/\bln\b/gi, 'log'],
    [/\blog\s*\(?\s*/gi, 'log('],
    [/\bseno\b/gi, 'sin'],
    [/\bsen\b/gi, 'sin'],
    [/\bcoseno\b/gi, 'cos'],
    [/\bcos\b/gi, 'cos'],
    [/\btangente\b/gi, 'tan'],
    [/\btan\b/gi, 'tan'],
    [/\bcotangente\b/gi, 'cot'],
    [/\bcot\b/gi, 'cot'],
    [/\bsecante\b/gi, 'sec'],
    [/\bsec\b/gi, 'sec'],
    [/\bcosecante\b/gi, 'csc'],
    [/\bcsc\b/gi, 'csc'],
    [/\barcoseno\b/gi, 'acos'],
    [/\barcseno\b/gi, 'asin'],
    [/\barctangente\b/gi, 'atan'],
    [/\barcsen\b/gi, 'asin'],
    [/\barccos\b/gi, 'acos'],
    [/\barctan\b/gi, 'atan'],
    [/\barcsin\b/gi, 'asin'],
    [/\barcarccos\b/gi, 'acos'],
    [/\barcarctan\b/gi, 'atan'],
    [/\barcarcsin\b/gi, 'asin'],
    [/\basen\b/gi, 'asin'],
    [/\bacos\b/gi, 'acos'],
    [/\batan\b/gi, 'atan'],
    [/\bra[íi]z\s+cuadrada\b/gi, 'sqrt'],
    [/\bra[íi]z\s+de\s+2\b/gi, 'sqrt'],
    [/\bra[íi]z\b/gi, 'sqrt'],
    [/\braiz\s+cubica\b/gi, 'cuberoot'],
    [/\braiz\s+de\s+3\b/gi, 'cuberoot'],
    [/\braiz\b/gi, 'sqrt'],
    [/\bexponencial\b/gi, 'exp'],
    [/\bexp\s+de\b/gi, 'exp'],
    [/\be\s+elevado\s+a\b/gi, 'exp'],
    [/\be\^\b/gi, 'exp'],
    [/\bvalor\s+absoluto\b/gi, 'abs'],
    [/\babsoluto\b/gi, 'abs'],
    [/\babs\b/gi, 'abs'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  
  result = result.replace(/\s*\^/g, '^');
  
  return result;
}

function isNewEquation(text) {
  return text.includes('=');
}

function toAlg(str) {
  let result = str.trim();
  
  const functions = [
    [/\b(logaritmo\s+natural|logaritmo|ln)\s+de\s+(.+)/gi, 'log($2)'],
    [/\blog\s+de\s+(.+)/gi, 'log($1)'],
    [/\b(log)\s*\(\s*(.+?)\s*\)/gi, 'log($2)'],
    [/\bseno\s+de\s+(.+)/gi, 'sin($1)'],
    [/\bsen\s+de\s+(.+)/gi, 'sin($1)'],
    [/\bsin\s+de\s+(.+)/gi, 'sin($1)'],
    [/\bcoseno\s+de\s+(.+)/gi, 'cos($1)'],
    [/\bcos\s+de\s+(.+)/gi, 'cos($1)'],
    [/\btangente\s+de\s+(.+)/gi, 'tan($1)'],
    [/\btan\s+de\s+(.+)/gi, 'tan($1)'],
    [/\barcoseno\s+de\s+(.+)/gi, 'asin($1)'],
    [/\barcsen\s+de\s+(.+)/gi, 'asin($1)'],
    [/\barcsin\s+de\s+(.+)/gi, 'asin($1)'],
    [/\barcocoseno\s+de\s+(.+)/gi, 'acos($1)'],
    [/\barccos\s+de\s+(.+)/gi, 'acos($1)'],
    [/\barctangente\s+de\s+(.+)/gi, 'atan($1)'],
    [/\barctan\s+de\s+(.+)/gi, 'atan($1)'],
    [/\bra[íi]z\s+de\s+(.+)/gi, 'sqrt($1)'],
    [/\braiz\s+de\s+(.+)/gi, 'sqrt($1)'],
    [/\bexponencial\s+de\s+(.+)/gi, 'exp($1)'],
    [/\bexp\s+de\s+(.+)/gi, 'exp($1)'],
    [/\be\^/gi, 'exp'],
  ];
  
  for (const [regex, replacement] of functions) {
    result = result.replace(regex, replacement);
  }
  
  result = result.replace(/\s+/g, '');
  result = result.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  result = result.replace(/(\d)(\!)/g, '$1$2');
  
  return result;
}

function normalizeUserInput(str) {
  return str
    .replace(/\bfactorial\b/gi, '!')
    .replace(/\bal\s+cubo\b/gi, '^3')
    .replace(/\bal\s+cuadrado\b/gi, '^2')
    .replace(/\bcuadrado\b/gi, '^2')
    .replace(/\bcubo\b/gi, '^3');
}

function runAlg(expr) {
  try { return Algebrite.run(expr).trim(); }
  catch(e) { console.error('Algebrite:', e); return null; }
}

function renderKatex(latex) {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: false });
  } catch(e) {
    return `<span style="color:var(--chalk-dim)">${latex}</span>`;
  }
}

function toLatex(algExpr) {
  let r = runAlg(`latex(${algExpr})`);
  if (r) {
    r = r.replace(/^"|"$/g, '').trim();
    if (!r.startsWith('latex(') && !r.includes('Error')) {
      r = r.replace(/\\abs\{([^}]+)\}/g, '|$1|');
      r = r.replace(/\\frac\{1\}\{([^{}]+)\}/g, (match, inner) => `\\sqrt{${inner}}`);
      r = r.replace(/\\sqrt\{([^{}]+)\}/g, (match, inner) => `\\sqrt{${inner}}`);
      r = r.replace(/\^\{?1\/2\}?/g, '');
      r = r.replace(/\{(\d+)\}\s*\^\s*\\frac\{1\}\{\d+\}/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/\\sqrt\{(\d+)\}\s*\^\s*\\frac\{1\}\{\d+\}/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/(\w+)\s*\^\s*\\frac\{1\}\{\d+\}/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/\^\s*\\frac\{1\}\{\d+\}/g, '');
      r = r.replace(/(\w+)\^\{1\/2\}/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/(\w+)\s*\^\s*\(1\/2\)/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/\^\s*\(1\/2\)/g, '');
      r = r.replace(/(\w+)\s*\^\s*1\/2/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/(\w+)\^1\/2/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/(-?\d+)\^\(1\/2\)/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/\((-?\d+)\)\^\(1\/2\)/g, (match, base) => `\\sqrt{${base}}`);
      r = r.replace(/(-?\d+)\^1\/2/g, (match, base) => `\\sqrt{${base}}`);
      return r;
    }
  }
  return algExpr
    .replace(/\*/g, '')
    .replace(/abs\(([^)]+)\)/g, '|$1|')
    .replace(/(\w+)\^1\/2/g, 'sqrt($1)')
    .replace(/(\w+)\^\(1\/2\)/g, 'sqrt($1)')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
}


function buildApplyLatex(lhsAlg, rhsAlg, op, rawVal) {
  const lhs = toLatex(lhsAlg);
  const rhs = toLatex(rhsAlg);
  const v   = rawVal.trim();
  if (op === '+') return `${lhs}+${v}=${rhs}+${v}`;
  if (op === '-') return `${lhs}-${v}=${rhs}-${v}`;
  if (op === '*') return `\\left(${lhs}\\right)\\cdot ${v}=\\left(${rhs}\\right)\\cdot ${v}`;
  if (op === '/') return `\\dfrac{${lhs}}{${v}}=\\dfrac{${rhs}}{${v}}`;
  return `${lhs}=${rhs}`;
}

function buildEqLatex(lhsAlg, rhsAlg) {
  return `${toLatex(lhsAlg)}=${toLatex(rhsAlg)}`;
}

function isSolved(lhsAlg, rhsAlg) {
  const l = (runAlg(`simplify(${lhsAlg})`) || '').trim();
  const r = (runAlg(`simplify(${rhsAlg})`) || '').trim();
  const solvedLeft = /^[a-zA-Z]$/.test(l) && !/[a-zA-Z]/.test(r);
  const solvedRight = !/[a-zA-Z]/.test(l) && /^[a-zA-Z]$/.test(r);
  return solvedLeft || solvedRight;
}

function processInstruction(text) {
  text = text.trim();
  const isCommand = COMMANDS.some(cmd => cmd.regex.test(text));

  if (state.currentAlg && isCommand) {
    return processEquationCommand(text, state.currentAlg);
  }

  const norm = normalizeMathFunction(normalizeFraction(text));
  const algExpr = toAlg(norm);
  return {
    latex: toLatex(algExpr),
    annotation: 'Expresión',
    newAlg: { lhs: algExpr, rhs: '0' },
    isNew: true,
    done: false,
  };
}

function processEquationCommand(text, alg) {
  const isExpressionOnly = alg.rhs === '0';

  for (const cmd of COMMANDS) {
    const match = text.match(cmd.regex);
    if (!match) continue;

    switch (cmd.mode) {

      case 'apply': {
        const rawVal = normalizeUserInput(match[cmd.valueGroup].trim());
        const valAlg = toAlg(rawVal);
        let newLhs, newRhs;
        if (cmd.op === '/') {
          newLhs = `(${alg.lhs})/(${valAlg})`;
          newRhs = isExpressionOnly ? '0' : `(${alg.rhs})/(${valAlg})`;
        } else if (cmd.op === '*') {
          newLhs = `(${alg.lhs})*(${valAlg})`;
          newRhs = isExpressionOnly ? '0' : `(${alg.rhs})*(${valAlg})`;
        } else {
          newLhs = `${alg.lhs}${cmd.op}(${valAlg})`;
          newRhs = isExpressionOnly ? '0' : `${alg.rhs}${cmd.op}(${valAlg})`;
        }
        const buildLatex = (newLhs, newRhs) => {
          if (isExpressionOnly) {
            return toLatex(newLhs);
          }
          return `${toLatex(newLhs)}=${toLatex(newRhs)}`;
        };
        return {
          latex: isExpressionOnly ? toLatex(newLhs) : buildLatex(alg.lhs, alg.rhs, cmd.op, rawVal),
          annotation: cmd.label(rawVal),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'simplify': {
        const newLhs = runAlg(`simplify(${alg.lhs})`);
        const newRhs = isExpressionOnly ? '0' : runAlg(`simplify(${alg.rhs})`);
        if (!newLhs || !newRhs) return { error: 'No se pudo simplificar.' };
        const latex = isExpressionOnly ? toLatex(newLhs) : `${toLatex(newLhs)}=${toLatex(newRhs)}`;
        return {
          latex,
          annotation: cmd.label(),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'expand': {
        const newLhs = runAlg(`expand(${alg.lhs})`);
        const newRhs = isExpressionOnly ? '0' : runAlg(`expand(${alg.rhs})`);
        if (!newLhs) return { error: 'No se pudo expandir.' };
        const latex = isExpressionOnly ? toLatex(newLhs) : `${toLatex(newLhs)}=${toLatex(newRhs)}`;
        return {
          latex,
          annotation: cmd.label(),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'factor': {
        const newLhs = runAlg(`factor(simplify(${alg.lhs}))`);
        const newRhs = isExpressionOnly ? '0' : runAlg(`factor(simplify(${alg.rhs}))`);
        if (!newLhs) return { error: 'No se pudo factorizar.' };
        const latex = isExpressionOnly ? toLatex(newLhs) : `${toLatex(newLhs)}=${toLatex(newRhs)}`;
        return {
          latex,
          annotation: cmd.label(),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'solve': {
        const varName = cmd.getVar ? cmd.getVar(match) : 'x';
        const diff = isExpressionOnly ? alg.lhs : `(${alg.lhs})-(${alg.rhs})`;
        const result = runAlg(`roots(${diff},${varName})`);
        if (!result || result === '0') return { error: `No se pudo resolver para ${varName}.` };
        return {
          latex: isExpressionOnly ? toLatex(result) : `${varName}=${toLatex(result)}`,
          annotation: cmd.label(varName),
          newAlg: { lhs: varName, rhs: result },
          done: true,
        };
      }

      case 'power': {
        const exp = cmd.getVal ? cmd.getVal(match) : '2';
        const newLhs = `(${alg.lhs})^(${exp})`;
        const newRhs = isExpressionOnly ? '0' : `(${alg.rhs})^(${exp})`;
        const latex = isExpressionOnly ? toLatex(newLhs) : `${toLatex(newLhs)}=${toLatex(newRhs)}`;
        return {
          latex,
          annotation: cmd.label(exp),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'sqrt': {
        const newLhs = `sqrt(${alg.lhs})`;
        const newRhs = isExpressionOnly ? '0' : `sqrt(${alg.rhs})`;
        const latex = isExpressionOnly ? toLatex(newLhs) : `${toLatex(newLhs)}=${toLatex(newRhs)}`;
        return {
          latex,
          annotation: cmd.label(),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }
    }
  }

  return { error: `No reconocí "${text}". Comandos: ${COMMANDS.map(c => c.id).join(', ')}` };
}

function processFraction(text) {
  const overMatch = text.match(/^(.+?)\s+(?:sobre|dividido\s+por|entre)\s+(.+)$/i);
  if (overMatch) {
    return {
      numerator: overMatch[1].trim(),
      denominator: overMatch[2].trim(),
    };
  }
  return null;
}

function normalizeFraction(text) {
  const frac = processFraction(text);
  if (frac) {
    const numAlg = toAlg(frac.numerator);
    const denAlg = toAlg(frac.denominator);
    return `(${numAlg})/(${denAlg})`;
  }
  return text;
}

function useSuggestion(text) {
  document.getElementById('userInput').value = text;
  document.getElementById('userInput').focus();
}

function handleSend() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const result = processInstruction(text);

  if (result.error) {
    alert(result.error);
    return;
  }

  if (result.newAlg) {
    state.currentAlg = result.newAlg;
  }

  const step = { latex: result.latex, annotation: result.annotation, done: !!result.done };
  addStepToDOM(step);
}

function buildUI() {
  const suggestions = ['x^2+2x', '3x+7=22', '(x+1)(x-1)', 'simplifica', 'expande'];
  const sugRow = document.getElementById('suggestionsRow');
  suggestions.forEach(s => {
    const chip = document.createElement('span');
    chip.className = 'suggestion-chip';
    chip.textContent = s;
    chip.onclick = () => useSuggestion(s);
    sugRow.appendChild(chip);
  });

  const grid = document.getElementById('commandsGrid');
  COMMANDS.forEach(cmd => {
    const row = document.createElement('div');
    row.className = 'cmd-row';
    row.innerHTML = `<span class="cmd-key">${cmd.id}</span><span class="cmd-desc">${cmd.aliases.join(' · ')}</span>`;
    grid.appendChild(row);
  });
}

function addStepToDOM(step) {
  const container = document.getElementById('steps');
  const div = document.createElement('div');
  div.className = 'step';
  const eqDiv = document.createElement('div');
  eqDiv.className = 'step-eq';
  eqDiv.innerHTML = renderKatex(step.latex);
  const annDiv = document.createElement('div');
  annDiv.className = 'step-annotation';
  annDiv.textContent = step.annotation;
  div.appendChild(eqDiv);
  div.appendChild(annDiv);
  container.appendChild(div);
  document.getElementById('emptyState').style.display = 'none';
}

function undoLast() {
  if (state.steps.length === 0) return;
  state.steps.pop();
  document.getElementById('steps').lastChild?.remove();
  if (state.steps.length === 0) {
    state.currentAlg = null;
    document.getElementById('emptyState').style.display = 'flex';
  }
}

function clearBoard() {
  state.steps = [];
  state.currentAlg = null;
  document.getElementById('steps').innerHTML = '';
  document.getElementById('emptyState').style.display = 'flex';
}

buildUI();
