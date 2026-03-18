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
  {
    id: 'separa',
    label: () => 'Separa integral en sumas',
    aliases: ['separa', 'separar'],
    regex: /^(?:separa(?:r)?)$/i,
    mode: 'separate',
  },
];

let state = {
  steps: [],
  currentAlg: null,
  currentIntegral: null,
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

function parseIntegral(text) {
  const t = text.toLowerCase().trim();
  
  const definitePattern = /^(?:integral|int|∫)\s*(?:de\s+)?(.+?)\s+a\s+(.+?)\s+de\s+(.+?)\s*dx?$/i;
  const matchDef = t.match(definitePattern);
  if (matchDef) {
    const lower = matchDef[1].trim();
    const upper = matchDef[2].trim();
    const integrand = matchDef[3].trim();
    return {
      type: 'definite',
      integrand: integrand,
      lower: isNaN(lower) ? lower : parseFloat(lower),
      upper: isNaN(upper) ? upper : parseFloat(upper),
    };
  }
  
  const indefinitePattern = /^(?:integral|int|∫)\s*(?:de\s+)?(.+?)\s*dx?$/i;
  const matchIndef = t.match(indefinitePattern);
  if (matchIndef) {
    return {
      type: 'indefinite',
      integrand: matchIndef[1].trim(),
    };
  }
  
  return null;
}

function isIntegral(text) {
  return parseIntegral(text) !== null;
}

function toIntegralLatex(integral) {
  const algForm = toAlg(integral.integrand);
  const integrandLatex = toLatex(algForm);
  if (integral.type === 'definite') {
    return `\\int_{${integral.lower}}^{${integral.upper}} ${integrandLatex}\\,dx`;
  }
  return `\\int ${integrandLatex}\\,dx`;
}

function processIntegralCommand(text, integral) {
  for (const cmd of COMMANDS) {
    const match = text.match(cmd.regex);
    if (!match) continue;

    switch (cmd.mode) {
      case 'apply': {
        const rawVal = normalizeUserInput(match[cmd.valueGroup].trim());
        const valAlg = toAlg(rawVal);
        let newIntegrand;
        if (cmd.op === '/') {
          newIntegrand = `(${integral.integrand})/(${valAlg})`;
        } else if (cmd.op === '*') {
          newIntegrand = `(${integral.integrand})*(${valAlg})`;
        } else {
          newIntegrand = `${integral.integrand}${cmd.op}(${valAlg})`;
        }
        const newIntegral = { ...integral, integrand: newIntegrand };
        const newLatex = cmd.op === '+' 
          ? `\\int ${toLatex(newIntegrand)}\\,dx = \\int ${toLatex(integral.integrand)}\\,dx ${cmd.op === '+' ? '+' : ''} ${rawVal}`
          : cmd.op === '-'
          ? `\\int ${toLatex(newIntegrand)}\\,dx = \\int ${toLatex(integral.integrand)}\\,dx - ${rawVal}`
          : cmd.op === '*'
          ? `\\int ${toLatex(newIntegrand)}\\,dx = ${rawVal}\\left(\\int ${toLatex(integral.integrand)}\\,dx\\right)`
          : `\\int ${toLatex(newIntegrand)}\\,dx = \\dfrac{\\int ${toLatex(integral.integrand)}\\,dx}{${rawVal}}`;
        return {
          latex: toIntegralLatex(newIntegral),
          annotation: cmd.label(rawVal),
          newIntegral: newIntegral,
          done: false,
        };
      }

      case 'simplify': {
        const algForm = toAlg(integral.integrand);
        const newIntegrand = runAlg(`simplify(${algForm})`);
        if (!newIntegrand) return { error: 'No se pudo simplificar.' };
        const newIntegral = { ...integral, integrand: newIntegrand };
        return {
          latex: toIntegralLatex(newIntegral),
          annotation: cmd.label(),
          newIntegral: newIntegral,
          done: false,
        };
      }

      case 'expand': {
        const algForm = toAlg(integral.integrand);
        const newIntegrand = runAlg(`expand(${algForm})`);
        if (!newIntegrand) return { error: 'No se pudo expandir.' };
        const newIntegral = { ...integral, integrand: newIntegrand };
        return {
          latex: toIntegralLatex(newIntegral),
          annotation: cmd.label(),
          newIntegral: newIntegral,
          done: false,
        };
      }

      case 'factor': {
        const algForm = toAlg(integral.integrand);
        const newIntegrand = runAlg(`factor(${algForm})`);
        if (!newIntegrand) return { error: 'No se pudo factorizar.' };
        const newIntegral = { ...integral, integrand: newIntegrand };
        return {
          latex: toIntegralLatex(newIntegral),
          annotation: cmd.label(),
          newIntegral: newIntegral,
          done: false,
        };
      }

      case 'solve': {
        const algForm = toAlg(integral.integrand);
        const varName = cmd.getVar ? cmd.getVar(match) : 'x';
        const result = runAlg(`integrate(${algForm},${varName})`);
        if (!result || result.includes('Error')) return { error: 'No se pudo integrar.' };
        const resultLatex = toLatex(result);
        let finalLatex;
        if (integral.type === 'definite') {
          const lowerVal = runAlg(`${result}|${varName}=${integral.upper}`);
          const upperVal = runAlg(`${result}|${varName}=${integral.lower}`);
          const evaluated = runAlg(`(${lowerVal})-(${upperVal})`);
          finalLatex = toLatex(evaluated);
        } else {
          finalLatex = `${resultLatex}+C`;
        }
        return {
          latex: finalLatex,
          annotation: 'Integral resuelta',
          newIntegral: null,
          done: true,
        };
      }

      case 'power': {
        const exp = cmd.getVal ? cmd.getVal(match) : '2';
        const newIntegrand = `(${integral.integrand})^(${exp})`;
        const newIntegral = { ...integral, integrand: newIntegrand };
        return {
          latex: toIntegralLatex(newIntegral),
          annotation: cmd.label(exp),
          newIntegral: newIntegral,
          done: false,
        };
      }

      case 'sqrt': {
        const newIntegrand = `sqrt(${integral.integrand})`;
        const newIntegral = { ...integral, integrand: newIntegrand };
        return {
          latex: toIntegralLatex(newIntegral),
          annotation: cmd.label(),
          newIntegral: newIntegral,
          done: false,
        };
      }

      case 'separate': {
        const terms = [];
        let current = '';
        let parenDepth = 0;
        
        for (const char of integral.integrand) {
          if (char === '(') parenDepth++;
          else if (char === ')') parenDepth--;
          else if (char === '+' && parenDepth === 0) {
            if (current.trim()) terms.push(current.trim());
            current = '';
            continue;
          }
          current += char;
        }
        if (current.trim()) terms.push(current.trim());
        
        if (terms.length <= 1) {
          return { error: 'No hay términos separados para descomponer.' };
        }
        
        const separatedLatex = terms.map(term => {
          const newInt = { ...integral, integrand: term };
          return toIntegralLatex(newInt);
        }).join(' + ');
        
        return {
          latex: separatedLatex,
          annotation: 'Separa integral en sumas',
          newIntegral: null,
          done: false,
        };
      }
    }
  }

  return { error: `No reconocí "${text}". Prueba: simplifica, suma X, resta X, etc.` };
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
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
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

  if (isNewEquation(text)) {
    const parts = text.split('=');
    if (parts.length !== 2) return { error: 'Formato inválido. Ejemplo: 2x+5=10' };
    const lhsNorm = normalizeMathFunction(parts[0]);
    const rhsNorm = normalizeMathFunction(parts[1]);
    const lhsAlg = toAlg(lhsNorm);
    const rhsAlg = toAlg(rhsNorm);
    return {
      latex: buildEqLatex(lhsAlg, rhsAlg),
      annotation: 'Ecuación',
      newAlg: { lhs: lhsAlg, rhs: rhsAlg },
      isNew: true,
      done: false,
    };
  }

  const integral = parseIntegral(text);
  if (integral) {
    return {
      latex: toIntegralLatex(integral),
      annotation: integral.type === 'definite' ? 'Integral definida' : 'Integral indefinida',
      newIntegral: integral,
      isNew: true,
      done: false,
    };
  }

  if (state.currentAlg) {
    return processEquationCommand(text, state.currentAlg);
  }

  if (state.currentIntegral) {
    return processIntegralCommand(text, state.currentIntegral);
  }

  return { error: 'Escribe una ecuación (ej: 2x+5=10) o integral (ej: integral de x^2 dx)' };
}

function processEquationCommand(text, alg) {

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
        const hasSqrtNum = expr => /sqrt\(\d+\)/.test(expr);
        const newLhs = hasSqrtNum(alg.lhs) ? alg.lhs : runAlg(`simplify(${alg.lhs})`);
        const newRhs = hasSqrtNum(alg.rhs) ? alg.rhs : runAlg(`simplify(${alg.rhs})`);
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
        console.log('roots result:', result);
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
  state.currentIntegral = null;
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



  if (result.newIntegral) {
    state.currentIntegral = result.newIntegral;
    state.currentAlg = null;
  } else if (result.newAlg) {
    state.currentAlg = result.newAlg;
    state.currentIntegral = null;
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
  const suggestions = ['integral de seno de x dx', 'integral de logaritmo de x dx', 'integral de exponencial de x dx', 'seno de x = 0', 'simplifica', 'resuelve'];
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
