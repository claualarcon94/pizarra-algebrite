const COMMANDS = [
  {
    id: 'suma',
    label: v => `Suma ${v}`,
    aliases: ['suma X', 'sumar X'],
    regex: /^(?:suma|sumar|a[ñn]ade?|a[ñn]adir)\s+(.+)$/i,
    mode: 'apply', op: '+', valueGroup: 1,
  },
  {
    id: 'resta',
    label: v => `Resta ${v}`,
    aliases: ['resta X', 'restar X'],
    regex: /^(?:resta|restar|sustrae?|sustraer|quita?|quitar)\s+(.+)$/i,
    mode: 'apply', op: '-', valueGroup: 1,
  },
  {
    id: 'multiplica',
    label: v => `Multiplica por ${v}`,
    aliases: ['multiplica por X', 'mult X'],
    regex: /^(?:multiplica|multiplicar|mult)\s+(?:por|x|\*)\s+(.+)$/i,
    mode: 'apply', op: '*', valueGroup: 1,
  },
  {
    id: 'divide',
    label: v => `Divide entre ${v}`,
    aliases: ['divide entre X', 'divide X'],
    regex: /^(?:divide|dividir|div(?:idir)?)\s+(?:entre|por|\/)\s+(.+)$/i,
    mode: 'apply', op: '/', valueGroup: 1,
  },
  {
    id: 'simplifica',
    label: () => 'Simplifica',
    aliases: ['simplifica', 'simplify', 'reduce'],
    regex: /^(?:simplifica|simplificar|simplify|reduce|reducir|cancela|cancelar|simplif)$/i,
    mode: 'simplify',
  },
  {
    id: 'expande',
    label: () => 'Expande',
    aliases: ['expande', 'expand'],
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
    id: 'cuadrado',
    label: () => 'Eleva al cuadrado',
    aliases: ['cuadrado', 'al cuadrado', 'eleva al cuadrado'],
    regex: /^(?:cuadrado|al\s+cuadrado|eleva(?:r)?(?:\s+al\s+cuadrado)?)$/i,
    mode: 'power', value: '2',
  },
  {
    id: 'cubo',
    label: () => 'Eleva al cubo',
    aliases: ['cubo', 'al cubo', 'eleva al cubo'],
    regex: /^(?:cubo|al\s+cubo|eleva(?:r)?(?:\s+al\s+cubo)?)$/i,
    mode: 'power', value: '3',
  },
  {
    id: 'eleva',
    label: v => `Eleva a ${v}`,
    aliases: ['eleva a N', 'eleva X'],
    regex: /^(?:eleva|elevar)\s+(?:a\s+)?(.+)$/i,
    mode: 'power', valueGroup: 1,
  },
  {
    id: 'raiz',
    label: () => 'Raíz cuadrada',
    aliases: ['raiz', 'raíz', 'sqrt'],
    regex: /^(?:ra[ií]z(?:\s+cuadrada)?|sqrt)$/i,
    mode: 'sqrt',
  },
  {
    id: 'seno',
    label: () => 'Seno',
    aliases: ['seno', 'sen'],
    regex: /^(?:seno|sen|sin)\s*(?:de)?$/i,
    mode: 'trig', func: 'sin',
  },
  {
    id: 'coseno',
    label: () => 'Coseno',
    aliases: ['coseno', 'cos'],
    regex: /^(?:coseno|cos)\s*(?:de)?$/i,
    mode: 'trig', func: 'cos',
  },
  {
    id: 'tangente',
    label: () => 'Tangente',
    aliases: ['tangente', 'tan'],
    regex: /^(?:tangente|tan)\s*(?:de)?$/i,
    mode: 'trig', func: 'tan',
  },
  {
    id: 'exponencial',
    label: () => 'Exponencial',
    aliases: ['exponencial', 'exp'],
    regex: /^(?:exponencial|exp)\s*(?:de)?$/i,
    mode: 'trig', func: 'exp',
  },
  {
    id: 'logaritmo',
    label: () => 'Logaritmo natural',
    aliases: ['logaritmo', 'log', 'ln'],
    regex: /^(?:logaritmo|log|ln)\s*(?:natural|de)?$/i,
    mode: 'trig', func: 'log',
  },
  {
    id: 'absoluto',
    label: () => 'Valor absoluto',
    aliases: ['absoluto', 'valor absoluto', 'abs'],
    regex: /^(?:absoluto|valor\s+absoluto|abs)$/i,
    mode: 'trig', func: 'abs',
  },
  {
    id: 'arcoseno',
    label: () => 'Arco seno',
    aliases: ['arco seno', 'arcoseno', 'arcsen', 'asin'],
    regex: /^(?:arco\s+seno|arcoseno|arcsen|asin)$/i,
    mode: 'trig', func: 'asin',
  },
  {
    id: 'arcocoseno',
    label: () => 'Arco coseno',
    aliases: ['arco coseno', 'arcocoseno', 'arccos', 'acos'],
    regex: /^(?:arco\s+coseno|arcocoseno|arccos|acos)$/i,
    mode: 'trig', func: 'acos',
  },
  {
    id: 'arcotangente',
    label: () => 'Arco tangente',
    aliases: ['arco tangente', 'arcotangente', 'arctan', 'atan'],
    regex: /^(?:arco\s+tangente|arcotangente|arctan|atan)$/i,
    mode: 'trig', func: 'atan',
  },
];

let state = {
  steps: [],
  currentExpr: null,
};

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

function normalizeExpr(expr) {
  let result = expr.trim();
  result = result.replace(/\s+/g, '');
  result = result.replace(/(\d)\(/g, '$1*(');
  result = result.replace(/\)\(/g, ')*(');
  while (/^\([^()]+\)$/.test(result)) {
    result = result.slice(1, -1);
  }
  return result;
}

function toAlg(str) {
  let result = str.trim();
  result = result.replace(/\s+/g, '');
  result = result.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  result = result.replace(/(\d)\(/g, '$1*(');
  result = result.replace(/\)\(/g, ')*(');
  return result;
}

function toLatex(algExpr) {
  if (!algExpr || algExpr.includes('latex(')) {
    return (algExpr || '').replace(/\*/g, '').replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  }
  const algForLatex = algExpr.replace(/(\d)(\()/g, '$1*$2').replace(/(\))(\d)/g, '$1*$2').replace(/\)\s*\*\s*\(/g, ')*(').replace(/\)\(/g, ')(');
  let r = runAlg(`latex(${algForLatex})`);
  if (r) {
    r = r.replace(/^"|"$/g, '').trim();
    if (!r.startsWith('latex(') && !r.includes('Error') && !r.includes('Stop')) {
      return r;
    }
  }
  return algExpr
    .replace(/\)\s*\*\s*\(/g, ')\\cdot (')
    .replace(/\)\(/g, ')(')
    .replace(/\*/g, '')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
}

function isExpression(text) {
  return !text.includes('=') && !text.toLowerCase().includes('integral');
}

function parseTerms(str) {
  const terms = [];
  let current = '';
  let depth = 0;
  let isNegative = false;
  
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(' || c === '[') {
      depth++;
      current += c;
    } else if (c === ')' || c === ']') {
      depth--;
      current += c;
    } else if ((c === '-' || c === '+') && depth === 0) {
      if (current.length === 0) {
        isNegative = c === '-';
        continue;
      }
      terms.push((isNegative ? '-' : '') + current);
      current = '';
      isNegative = c === '-';
      continue;
    } else {
      if (isNegative) {
        current = '-';
        isNegative = false;
      }
      current += c;
    }
  }
  if (current.length > 0) {
    terms.push((isNegative ? '-' : '') + current);
  }
  return terms;
}

function manualExpand(expr) {
  if (!expr.includes('(')) return null;
  
  let remaining = expr;
  let iterations = 0;
  const maxIterations = 50;
  
  while (iterations < maxIterations) {
    iterations++;
    
    const parenMatch = remaining.match(/\(([^()]+)\)\s*\(/);
    
    if (parenMatch) {
      const startIdx = parenMatch.index;
      const left = parenMatch[1];
      const afterLeft = remaining.slice(startIdx + parenMatch[0].length);
      const rightMatch = afterLeft.match(/^([^()]+)\)/);
      
      if (rightMatch) {
        const right = rightMatch[1];
        const expanded = doExpand(left, right);
        const before = remaining.slice(0, startIdx);
        const after = afterLeft.slice(rightMatch[0].length);
        remaining = before + '(' + expanded + ')' + after;
        continue;
      }
    }
    
    const numParenMatch = remaining.match(/(\d+)\s*\*?\s*\(/);
    if (numParenMatch) {
      const num = numParenMatch[1];
      const startIdx = numParenMatch.index;
      const rest = remaining.slice(startIdx + numParenMatch[0].length);
      const innerMatch = rest.match(/^([^()]+)\)/);
      if (innerMatch) {
        const inner = innerMatch[1];
        const terms = parseTerms(inner);
        const products = terms.map(t => runAlg(`${num}*${t}`) || `${num}*${t}`);
        const expanded = products.join('+');
        const before = remaining.slice(0, startIdx);
        const after = remaining.slice(startIdx + numParenMatch[0].length + innerMatch[0].length);
        remaining = before + expanded + after;
        continue;
      }
    }
    
    const parenNumMatch = remaining.match(/\)\s*(\d+)$/);
    if (parenNumMatch) {
      const num = parenNumMatch[1];
      const startIdx = parenNumMatch.index;
      const before = remaining.slice(0, startIdx);
      const parenMatch2 = before.match(/\(([^()]+)\)$/);
      if (parenMatch2) {
        const inner = parenMatch2[1];
        const before2 = before.slice(0, parenMatch2.index);
        const terms = parseTerms(inner);
        const products = terms.map(t => runAlg(`${t}*${num}`) || `${t}*${num}`);
        const expanded = products.join('+');
        remaining = before2 + expanded;
        continue;
      }
    }
    
    const starMatch = remaining.match(/\)([^*]+)\*\s*\(/);
    if (starMatch) {
      const startIdx = starMatch.index;
      const before = remaining.slice(0, startIdx);
      const rest = remaining.slice(startIdx);
      const leftMatch = rest.match(/^([^)]+)\)\s*\*\s*\(([^()]+)\)/);
      if (leftMatch) {
        const left = leftMatch[1];
        const right = leftMatch[2];
        const after = rest.slice(leftMatch[0].length);
        const expanded = doExpand(left, right);
        remaining = before + '(' + expanded + ')' + after;
        continue;
      }
    }
    
    break;
  }
  
  return { expr: remaining };
}

function doExpand(left, right) {
  if (!left.startsWith('(') || !left.endsWith(')')) {
    left = '(' + left + ')';
  }
  if (!right.startsWith('(') || !right.endsWith(')')) {
    right = '(' + right + ')';
  }
  
  left = left.slice(1, -1);
  right = right.slice(1, -1);
  
  const leftTerms = parseTerms(left);
  const rightTerms = parseTerms(right);
  
  const products = [];
  for (const l of leftTerms) {
    for (const r of rightTerms) {
      if (l === '0' || r === '0') continue;
      
      let prod = `${l}*${r}`;
      prod = runAlg(prod) || prod;
      
      if (prod && prod !== '0') products.push(prod);
    }
  }
  
  if (products.length === 0) return '0';
  
  let result = products.join('+');
  if (/^\([^()]+\)$/.test(result)) {
    result = result.slice(1, -1);
  }
  return result;
}

function processExpressionCommand(text, expr) {
  for (const cmd of COMMANDS) {
    const match = text.match(cmd.regex);
    if (!match) continue;

    switch (cmd.mode) {
      case 'apply': {
        const rawVal = normalizeUserInput(match[cmd.valueGroup].trim());
        const valAlg = toAlg(rawVal);
        const hasVars = v => /[a-zA-Z]/.test(v);
        let newExpr;
        if (cmd.op === '/') {
          const wrap = v => hasVars(v) ? `(${v})` : v;
          newExpr = `(${expr})/${wrap(valAlg)}`;
        } else if (cmd.op === '*') {
          const wrap = v => hasVars(v) ? `(${v})` : v;
          newExpr = `(${expr})*${wrap(valAlg)}`;
        } else {
          const wrap = v => hasVars(v) ? `(${v})` : v;
          newExpr = `${expr}${cmd.op}${wrap(valAlg)}`;
        }
        return {
          latex: toLatex(newExpr),
          annotation: cmd.label(rawVal),
          newExpr: normalizeExpr(newExpr),
          done: false,
        };
      }

      case 'simplify': {
        const expanded = runAlg(`expand(${expr})`);
        const newExpr = normalizeExpr(expanded || expr);
        return {
          latex: toLatex(newExpr),
          annotation: cmd.label(),
          newExpr: newExpr,
          done: false,
        };
      }

      case 'expand': {
        const result = manualExpand(expr);
        let algExpr;
        if (result) {
          algExpr = normalizeExpr(result.expr);
        } else {
          algExpr = runAlg(`expand(${expr})`);
          if (!algExpr) return { error: 'No se pudo expandir.' };
          algExpr = normalizeExpr(algExpr);
        }
        return {
          latex: toLatex(algExpr),
          annotation: cmd.label(),
          newExpr: algExpr,
          done: false,
        };
      }

      case 'factor': {
        const hasMult = /\)\s*\*\s*\(/.test(expr);
        if (hasMult) {
          return {
            latex: toLatex(expr),
            annotation: 'Ya factorizado',
            newExpr: normalizeExpr(expr),
            done: false,
          };
        }
        const newExpr = runAlg(`factor(${expr})`);
        if (!newExpr) return { error: 'No se pudo factorizar.' };
        return {
          latex: toLatex(newExpr),
          newExpr: normalizeExpr(newExpr),
          annotation: cmd.label(),
          done: false,
        };
      }

      case 'power': {
        const exp = cmd.value || normalizeUserInput(match[cmd.valueGroup].trim());
        const newExpr = `(${expr})^(${exp})`;
        return {
          latex: toLatex(newExpr),
          annotation: cmd.label(exp),
          newExpr: normalizeExpr(newExpr),
          done: false,
        };
      }

      case 'sqrt': {
        const newExpr = `sqrt(${expr})`;
        return {
          latex: toLatex(newExpr),
          annotation: cmd.label(),
          newExpr: normalizeExpr(newExpr),
          done: false,
        };
      }

      case 'trig': {
        const newExpr = `${cmd.func}(${expr})`;
        return {
          latex: toLatex(newExpr),
          annotation: cmd.label(),
          newExpr: normalizeExpr(newExpr),
          done: false,
        };
      }
    }
  }

  return { error: `No reconocí "${text}". Comandos: simplifica, expande, factoriza, suma/resta/multiplica/divide X` };
}

function processInstruction(text) {
  text = text.trim();

  if (state.currentExpr) {
    const cmdResult = processExpressionCommand(text, state.currentExpr);
    if (!cmdResult.error) return cmdResult;
  }

  if (isExpression(text)) {
    const exprAlg = normalizeExpr(toAlg(text));
    return {
      latex: toLatex(exprAlg),
      annotation: 'Expresión',
      newExpr: exprAlg,
      isNew: true,
      done: false,
    };
  }

  return { error: 'Escribe una expresión para comenzar. Ej: x+7x+3' };
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
  state.currentExpr = null;
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

  if (result.newExpr) {
    state.currentExpr = result.newExpr;
  }

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
  const suggestions = ['x+7x+3', '(x+1)(x-1)', '(x+1)(x+2)(x+3)', 'x^2-1', 'x^2+2x+1'];
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
