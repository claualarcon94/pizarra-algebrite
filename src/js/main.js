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

function isNewEquation(text) {
  return text.includes('=');
}

function toAlg(str) {
  return str.trim()
    .replace(/\s+/g, '')
    .replace(/(\d)([a-zA-Z])/g, '$1*$2');
}

function runAlg(expr) {
  try { return Algebrite.run(expr).trim(); }
  catch(e) { console.error('Algebrite:', e); return null; }
}

function toLatex(algExpr) {
  let r = runAlg(`latex(${algExpr})`);
  if (r) {
    r = r.replace(/^"|"$/g, '').trim();
    if (!r.startsWith('latex(') && !r.includes('Error')) {
      return r;
    }
  }
  return algExpr.replace(/\*/g, '');
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
  return /^[a-zA-Z]$/.test(l) && !/[a-zA-Z]/.test(r);
}

function processInstruction(text) {
  text = text.trim();

  if (isNewEquation(text)) {
    const parts = text.split('=');
    if (parts.length !== 2) return { error: 'Formato inválido. Ejemplo: 2x+5=10' };
    const lhsAlg = toAlg(parts[0]);
    const rhsAlg = toAlg(parts[1]);
    return {
      latex: buildEqLatex(lhsAlg, rhsAlg),
      annotation: 'Ecuación inicial',
      newAlg: { lhs: lhsAlg, rhs: rhsAlg },
      isNew: true,
      done: false,
    };
  }

  if (!state.currentAlg) {
    return { error: 'Primero escribe una ecuación, por ejemplo: 2x+5=10' };
  }

  const alg = state.currentAlg;

  for (const cmd of COMMANDS) {
    const match = text.match(cmd.regex);
    if (!match) continue;

    switch (cmd.mode) {

      case 'apply': {
        const rawVal = match[cmd.valueGroup].trim();
        const valAlg = toAlg(rawVal);
        let newLhs, newRhs;
        if (cmd.op === '/') {
          newLhs = `(${alg.lhs})/(${valAlg})`;
          newRhs = `(${alg.rhs})/(${valAlg})`;
        } else if (cmd.op === '*') {
          newLhs = `(${alg.lhs})*(${valAlg})`;
          newRhs = `(${alg.rhs})*(${valAlg})`;
        } else {
          newLhs = `${alg.lhs}${cmd.op}(${valAlg})`;
          newRhs = `${alg.rhs}${cmd.op}(${valAlg})`;
        }
        return {
          latex: buildApplyLatex(alg.lhs, alg.rhs, cmd.op, rawVal),
          annotation: cmd.label(rawVal),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'simplify': {
        const newLhs = runAlg(`simplify(${alg.lhs})`);
        const newRhs = runAlg(`simplify(${alg.rhs})`);
        if (!newLhs || !newRhs) return { error: 'No se pudo simplificar.' };
        const done = isSolved(newLhs, newRhs);
        return {
          latex: buildEqLatex(newLhs, newRhs),
          annotation: cmd.label(),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done,
        };
      }

      case 'expand': {
        let newLhs = runAlg(`expand(${alg.lhs})`);
        let newRhs = runAlg(`expand(${alg.rhs})`);
        let latexLhs = newLhs;
        let latexRhs = newRhs;
        
        function expandFactorial(expr) {
          return expr.replace(/(\d+)!/g, (match, num) => {
            const n = parseInt(num);
            return Array.from({length: n}, (_, i) => n - i).join('\\cdot ');
          });
        }
        
        if (alg.lhs.includes('!')) {
          latexLhs = expandFactorial(alg.lhs);
        }
        if (alg.rhs.includes('!')) {
          latexRhs = expandFactorial(alg.rhs);
        }
        if (!newLhs || !newRhs) return { error: 'No se pudo expandir.' };
        const latex = `${latexLhs}=${latexRhs}`;
        return {
          latex,
          annotation: cmd.label(),
          newAlg: { lhs: alg.lhs, rhs: alg.rhs },
          done: false,
        };
      }

function isNumberOnly(expr) {
  return /^-?\d+(\.\d+)?$/.test(expr);
}

      case 'factor': {
        const shouldFactorLhs = !isNumberOnly(alg.lhs);
        const shouldFactorRhs = !isNumberOnly(alg.rhs);
        const lhsExpr = shouldFactorLhs ? `factor(simplify(${alg.lhs}))` : alg.lhs;
        const rhsExpr = shouldFactorRhs ? `factor(simplify(${alg.rhs}))` : alg.rhs;
        const newLhs = shouldFactorLhs ? runAlg(lhsExpr) : alg.lhs;
        const newRhs = shouldFactorRhs ? runAlg(rhsExpr) : alg.rhs;
        if (!newLhs || !newRhs) return { error: 'No se pudo factorizar.' };
        if (!shouldFactorLhs && !shouldFactorRhs) {
          return { error: 'No hay términos algebraicos para factorizar.' };
        }
        return {
          latex: buildEqLatex(newLhs, newRhs),
          annotation: cmd.label(),
          newAlg: { lhs: newLhs, rhs: newRhs },
          done: false,
        };
      }

      case 'solve': {
        const varName = cmd.getVar(match);
        const diff    = `(${alg.lhs})-(${alg.rhs})`;
        const result  = runAlg(`roots(${diff},${varName})`);
        if (!result || result === '0') return { error: `No se pudo resolver para ${varName}.` };
        return {
          latex: `${varName}=${toLatex(result)}`,
          annotation: cmd.label(varName),
          newAlg: { lhs: varName, rhs: result },
          done: true,
        };
      }

      case 'power': {
        const exp    = cmd.getVal(match);
        const expAlg = toAlg(exp);
        return {
          latex: `\\left(${toLatex(alg.lhs)}\\right)^{${exp}}=\\left(${toLatex(alg.rhs)}\\right)^{${exp}}`,
          annotation: cmd.label(exp),
          newAlg: { lhs: `(${alg.lhs})^(${expAlg})`, rhs: `(${alg.rhs})^(${expAlg})` },
          done: false,
        };
      }

      case 'sqrt': {
        return {
          latex: `\\sqrt{${toLatex(alg.lhs)}}=\\sqrt{${toLatex(alg.rhs)}}`,
          annotation: cmd.label(),
          newAlg: { lhs: `sqrt(${alg.lhs})`, rhs: `sqrt(${alg.rhs})` },
          done: false,
        };
      }
    }
  }

  return {
    error: `No reconocí "${text}". Comandos: ${COMMANDS.map(c => c.id).join(', ')}`,
  };
}

function renderKatex(latex) {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: false });
  } catch(e) {
    return `<span style="color:var(--chalk-dim)">${latex}</span>`;
  }
}

function addStepToDOM(step) {
  const container = document.getElementById('steps');
  const isFirst   = state.steps.length === 1;
  const div       = document.createElement('div');
  div.className   = `step${step.done ? ' solved' : ''}${isFirst ? ' initial' : ''}`;

  const eqDiv = document.createElement('div');
  eqDiv.className = 'step-eq';
  eqDiv.innerHTML = renderKatex(step.latex);

  const annDiv = document.createElement('div');
  annDiv.className = 'step-annotation';
  annDiv.textContent = step.annotation;

  div.appendChild(eqDiv);
  div.appendChild(annDiv);
  container.appendChild(div);

  if (step.done) {
    const badge = document.createElement('div');
    badge.className = 'solved-badge';
    badge.innerHTML = '✓ &nbsp;Ecuación resuelta';
    container.appendChild(badge);
  }

  document.getElementById('emptyState').style.display = 'none';
  const board = document.getElementById('board');
  setTimeout(() => board.scrollTop = board.scrollHeight, 80);
}

function showBoardError(msg) {
  const container = document.getElementById('steps');
  const div = document.createElement('div');
  div.className = 'board-error';
  div.textContent = '⚠ ' + msg;
  container.appendChild(div);
  document.getElementById('board').scrollTop = 99999;
  setTimeout(() => div.remove(), 5000);
}

function clearBoard() {
  state.steps = [];
  state.currentAlg = null;
  document.getElementById('steps').innerHTML = '';
  document.getElementById('emptyState').style.display = 'flex';
}

function handleSend() {
  const input = document.getElementById('userInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const result = processInstruction(text);

  if (result.error) {
    showBoardError(result.error);
    return;
  }

  if (result.isNew && state.steps.length > 0) clearBoard();

  state.currentAlg = result.newAlg;
  const step = { latex: result.latex, annotation: result.annotation, done: !!result.done };
  state.steps.push(step);
  addStepToDOM(step);
}

function useSuggestion(text) {
  document.getElementById('userInput').value = text;
  document.getElementById('userInput').focus();
}

document.getElementById('userInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSend();
});

function buildUI() {
  const suggestions = ['resta 5', 'suma 3', 'divide entre 2', 'multiplica por 3', 'simplifica', 'expande', 'factoriza', 'resuelve'];
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

buildUI();
