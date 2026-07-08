(function () {
  'use strict';

  
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const previewEl = document.getElementById('preview');
  const displayEl = document.getElementById('display');
  const btnGrid = document.getElementById('btnGrid');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const toastContainer = document.getElementById('toastContainer');

  
  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldResetInput = false;
  let lastExpression = '';
  let history = [];

  
  function formatNumber(num) {
    if (typeof num !== 'number' || !isFinite(num)) return 'Error';
    const rounded = parseFloat(num.toPrecision(12));
    const str = rounded.toString();
    if (str.length > 14) {
      return rounded.toExponential(6);
    }
    const parts = str.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function calculate(a, op, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return null;
    switch (op) {
      case '+': return numA + numB;
      case '−': return numA - numB;
      case '×': return numA * numB;
      case '÷':
        if (numB === 0) return null;
        return numA / numB;
      default: return null;
    }
  }

  function tryPreview() {
    if (operator && previousInput !== '' && currentInput !== '') {
      const res = calculate(previousInput, operator, currentInput);
      if (res !== null && isFinite(res)) {
        previewEl.textContent = '= ' + formatNumber(res);
        previewEl.classList.add('visible');
        return;
      }
    }
    previewEl.classList.remove('visible');
    previewEl.textContent = '';
  }

  function updateDisplay() {
    resultEl.textContent = currentInput;
    if (currentInput.length > 12) {
      resultEl.classList.add('shrink');
    } else {
      resultEl.classList.remove('shrink');
    }
    resultEl.classList.remove('error');

    document.querySelectorAll('.btn.op[data-action="operator"]').forEach(function (btn) {
      btn.classList.toggle('active-op', btn.dataset.value === operator && shouldResetInput);
    });

    tryPreview();
  }

  function inputNumber(num) {
    if (shouldResetInput) {
      currentInput = num;
      shouldResetInput = false;
    } else {
      if (currentInput === '0' && num !== '.') {
        currentInput = num;
      } else {
        if (currentInput.replace(/[^0-9]/g, '').length >= 15) return;
        currentInput += num;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (shouldResetInput) {
      currentInput = '0.';
      shouldResetInput = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    updateDisplay();
  }

  function inputOperator(op) {
    if (operator && !shouldResetInput) {
      const result = calculate(previousInput, operator, currentInput);
      if (result === null) {
        showError();
        return;
      }
      lastExpression = previousInput + ' ' + operator + ' ' + currentInput;
      currentInput = formatNumber(result).replace(/,/g, '');
      previousInput = currentInput;
    } else {
      previousInput = currentInput;
    }
    operator = op;
    shouldResetInput = true;
    expressionEl.textContent = previousInput + ' ' + op;
    updateDisplay();
  }

  function inputEquals() {
    if (!operator || previousInput === '') return;

    const result = calculate(previousInput, operator, currentInput);
    if (result === null) {
      showError();
      return;
    }

    const expr = previousInput + ' ' + operator + ' ' + currentInput;
    lastExpression = expr;
    expressionEl.textContent = expr + ' =';

    const formatted = formatNumber(result);
    addHistory(expr, formatted);

    currentInput = formatted.replace(/,/g, '');
    previousInput = '';
    operator = null;
    shouldResetInput = true;

    resultEl.textContent = formatted;
    if (formatted.length > 12) resultEl.classList.add('shrink');
    else resultEl.classList.remove('shrink');

    previewEl.classList.remove('visible');
    previewEl.textContent = '';

    document.querySelectorAll('.btn.op.active-op').forEach(function (b) {
      b.classList.remove('active-op');
    });

    
    resultEl.style.transform = 'scale(1.04)';
    setTimeout(function () { resultEl.style.transform = ''; }, 150);
  }

  function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetInput = false;
    lastExpression = '';
    expressionEl.textContent = '';
    previewEl.classList.remove('visible');
    previewEl.textContent = '';
    updateDisplay();
    displayEl.classList.add('active');
    setTimeout(function () { displayEl.classList.remove('active'); }, 300);
  }

  function backspace() {
    if (shouldResetInput) return;
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  function toggleNegate() {
    if (currentInput === '0') return;
    if (currentInput.startsWith('-')) {
      currentInput = currentInput.slice(1);
    } else {
      currentInput = '-' + currentInput;
    }
    updateDisplay();
  }

  function applyPercent() {
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    currentInput = formatNumber(num / 100).replace(/,/g, '');
    updateDisplay();
  }

  function showError() {
    resultEl.textContent = 'Cannot divide by zero';
    resultEl.classList.add('error');
    expressionEl.textContent = '';
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetInput = true;
    previewEl.classList.remove('visible');
    document.querySelectorAll('.btn.op.active-op').forEach(function (b) {
      b.classList.remove('active-op');
    });
    showToast('Division by zero is undefined');
  }

  
  function addHistory(expr, result) {
    history.unshift({ expr: expr, result: result });
    if (history.length > 50) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML =
        '<div class="history-empty">' +
        '<i class="fas fa-calculator"></i>' +
        'Your calculations will appear here' +
        '</div>';
      return;
    }
    historyList.innerHTML = history
      .map(function (item, i) {
        return (
          '<div class="history-item" data-index="' + i + '" tabindex="0" role="button" ' +
          'aria-label="Use result ' + item.result + '">' +
          '<div class="history-expr">' + item.expr + '</div>' +
          '<div class="history-result">= ' + item.result + '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  function useHistoryResult(index) {
    var item = history[index];
    if (!item) return;
    currentInput = item.result.replace(/,/g, '');
    shouldResetInput = true;
    expressionEl.textContent = '';
    updateDisplay();
    showToast('Result loaded: ' + item.result);
  }

  clearHistoryBtn.addEventListener('click', function () {
    history = [];
    renderHistory();
    showToast('History cleared');
  });

  historyList.addEventListener('click', function (e) {
    var item = e.target.closest('.history-item');
    if (item) useHistoryResult(parseInt(item.dataset.index));
  });

  historyList.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var item = e.target.closest('.history-item');
      if (item) useHistoryResult(parseInt(item.dataset.index));
    }
  });

  
  function showToast(message) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 2600);
  }

  

  function createRipple(btn, e) {
    var rect = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'ripple';
    var size = Math.max(rect.width, rect.height);
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    var x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
    var y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    btn.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 600);
  }

  
  btnGrid.addEventListener('mousemove', function (e) {
    var btn = e.target.closest('.btn');
    if (!btn) return;
    var rect = btn.getBoundingClientRect();
    var mx = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
    var my = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
    btn.style.setProperty('--mx', mx + '%');
    btn.style.setProperty('--my', my + '%');
  });

  
  function handleAction(action, value) {
    switch (action) {
      case 'number':    inputNumber(value); break;
      case 'decimal':   inputDecimal(); break;
      case 'operator':  inputOperator(value); break;
      case 'equals':    inputEquals(); break;
      case 'clear':     clearAll(); break;
      case 'backspace': backspace(); break;
      case 'negate':    toggleNegate(); break;
      case 'percent':   applyPercent(); break;
    }
  }

  
  btnGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn');
    if (!btn) return;
    createRipple(btn, e);
    handleAction(btn.dataset.action, btn.dataset.value);
  });

  
  
  var keyMap = {
    '0': { action: 'number', value: '0' },
    '1': { action: 'number', value: '1' },
    '2': { action: 'number', value: '2' },
    '3': { action: 'number', value: '3' },
    '4': { action: 'number', value: '4' },
    '5': { action: 'number', value: '5' },
    '6': { action: 'number', value: '6' },
    '7': { action: 'number', value: '7' },
    '8': { action: 'number', value: '8' },
    '9': { action: 'number', value: '9' },
    '.': { action: 'decimal' },
    '+': { action: 'operator', value: '+' },
    '-': { action: 'operator', value: '−' },
    '*': { action: 'operator', value: '×' },
    '/': { action: 'operator', value: '÷' },
    'Enter': { action: 'equals' },
    '=': { action: 'equals' },
    'Escape': { action: 'clear' },
    'Backspace': { action: 'backspace' },
    '%': { action: 'percent' },
  };

  document.addEventListener('keydown', function (e) {
    var mapping = keyMap[e.key];
    if (!mapping) return;
    e.preventDefault();

    
    var targetBtn = null;
    if (mapping.action === 'number') {
      targetBtn = btnGrid.querySelector('.btn[data-action="number"][data-value="' + mapping.value + '"]');
    } else if (mapping.action === 'operator') {
      targetBtn = btnGrid.querySelector('.btn[data-action="operator"][data-value="' + mapping.value + '"]');
    } else if (mapping.action === 'equals') {
      targetBtn = btnGrid.querySelector('.btn[data-action="equals"]');
    } else if (mapping.action === 'clear') {
      targetBtn = btnGrid.querySelector('.btn[data-action="clear"]');
    } else if (mapping.action === 'backspace') {
      targetBtn = btnGrid.querySelector('.btn[data-action="backspace"]');
    } else if (mapping.action === 'decimal') {
      targetBtn = btnGrid.querySelector('.btn[data-action="decimal"]');
    } else if (mapping.action === 'percent') {
      targetBtn = btnGrid.querySelector('.btn[data-action="percent"]');
    }

    if (targetBtn) {
      targetBtn.classList.add('active');
      createRipple(targetBtn, { clientX: 0, clientY: 0 });
      setTimeout(function () { targetBtn.classList.remove('active'); }, 120);
    }

    handleAction(mapping.action, mapping.value);
  });

  
  updateDisplay();
  renderHistory();
})();
