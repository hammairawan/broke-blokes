(function () {
  var views = document.querySelectorAll('.view');
  var links = document.querySelectorAll('.nav-list a');
  var btn = document.querySelector('.menu-btn');
  var list = document.querySelector('.nav-list');

  function show() {
    var name = location.hash.replace('#', '');
    if (!document.getElementById('view-' + name)) name = 'home';
    views.forEach(function (v) {
      v.classList.toggle('hidden', v.id !== 'view-' + name);
    });
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = document.getElementById('view-' + name).getAttribute('data-title') + ' | Broke Blokes';
    list.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', show);
  show();

  btn.addEventListener('click', function () {
    var open = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();

(function () {
  var money = document.getElementById('money');
  var days = document.getElementById('days');
  var daily = document.getElementById('daily');
  var dailyOut = document.getElementById('dailyOut');
  var cur = document.getElementById('currency');
  var result = document.getElementById('result');
  var fill = document.getElementById('meterFill');
  if (!money) return;

  function fmt(n) {
    return cur.value + ' ' + Math.round(n).toLocaleString();
  }

  function update() {
    var m = parseFloat(money.value);
    var d = parseInt(days.value, 10);
    var perDay = parseFloat(daily.value);
    dailyOut.textContent = fmt(perDay);

    if (isNaN(m) || m < 0 || isNaN(d) || d < 1) {
      result.innerHTML = '<p class="error">Enter the money you have (0 or more) and at least 1 day until your next allowance.</p>';
      fill.style.width = '0%';
      return;
    }

    var lasts = perDay > 0 ? Math.floor(m / perDay) : Infinity;
    var ratio = perDay > 0 ? (m / perDay) / d : Infinity;
    var need = perDay * d;                 // total cost of reaching the next allowance
    var safeDaily = m / d;                 // the most you can spend each day and still make it

    var state = ratio >= 1 ? 'safe' : (ratio >= 0.75 ? 'warn' : 'danger');
    var label = { safe: 'Safe', warn: 'Getting tight', danger: 'Danger zone' }[state];

    fill.className = 'meter-fill ' + (state === 'safe' ? '' : state);
    fill.style.width = Math.min(100, ratio * 100) + '%';

    var html = '<span class="status ' + state + '">' + label + '</span>';
    if (state === 'safe') {
      html += '<p class="big">You make it to your next allowance.</p>';
      html += '<p>At ' + fmt(perDay) + ' a day you finish with about ' + fmt(m - need) + ' left over.</p>';
    } else {
      var broke = new Date();
      broke.setDate(broke.getDate() + lasts);
      var dateText = broke.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
      var gap = d - lasts;
      var weeks = d / 7;
      html += '<p class="big">You run out of money on ' + dateText + '.</p>';
      html += '<p>That is ' + gap + ' day' + (gap === 1 ? '' : 's') + ' before your next allowance, with a shortfall of about ' + fmt(need - m) + '.</p>';
      html += '<div class="stats">' +
        '<div class="stat"><b>' + fmt(safeDaily) + '</b>daily limit that gets you there</div>' +
        '<div class="stat"><b>' + fmt((need - m) / weeks) + '</b>extra income needed per week</div>' +
        '<div class="stat"><b>' + fmt(Math.max(0, perDay - safeDaily)) + '</b>to cut from each day</div>' +
        '</div>';
      html += '<p class="small muted" style="margin-top:16px">Fix it: lower your daily spend, or earn the weekly amount above. See <a href="tips.html">Stay Un-Broke</a> and <a href="hustles.html">Get Paid</a>.</p>';
    }
    result.innerHTML = html;
  }

  [money, days, daily, cur].forEach(function (el) {
    el.addEventListener('input', update);
  });
  update();
})();


(function () {
  var chips = document.querySelectorAll('[data-filter]');
  var tips = document.querySelectorAll('.tip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', 'true');
      var f = chip.getAttribute('data-filter');
      tips.forEach(function (t) {
        t.classList.toggle('hidden', f !== 'all' && t.getAttribute('data-cat') !== f);
      });
    });
  });


  var bill = document.getElementById('bill');
  if (!bill) return;
  var tip = document.getElementById('tip');
  var count = document.getElementById('people');
  var mode = document.getElementById('mode');
  var rows = document.getElementById('rows');
  var out = document.getElementById('splitOut');

  function buildRows() {
    var n = Math.min(12, Math.max(2, parseInt(count.value, 10) || 2));
    var old = rows.querySelectorAll('.person');
    var saved = [];
    old.forEach(function (p) {
      saved.push([p.querySelector('.pname').value, p.querySelector('.item').value]);
    });
    rows.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var div = document.createElement('div');
      div.className = 'person';
      var name = document.createElement('input');
      name.className = 'pname'; name.type = 'text'; name.placeholder = 'Friend ' + (i + 1);
      name.setAttribute('aria-label', 'Name of person ' + (i + 1));
      var item = document.createElement('input');
      item.className = 'item'; item.type = 'number'; item.min = '0'; item.step = '0.01'; item.placeholder = 'Their items';
      item.setAttribute('aria-label', 'Items ordered by person ' + (i + 1));
      if (saved[i]) { name.value = saved[i][0]; item.value = saved[i][1]; }
      div.appendChild(name); div.appendChild(item);
      rows.appendChild(div);
    }
    rows.setAttribute('data-mode', mode.value);
    calculate();
  }

  function calculate() {
    out.innerHTML = '';
    var total = parseFloat(bill.value);
    var pct = parseFloat(tip.value) || 0;
    var people = rows.querySelectorAll('.person');
    var n = people.length;
    if (isNaN(total) || total <= 0 || pct < 0) {
      out.innerHTML = '<p class="muted">Enter the bill total to see who owes what.</p>';
      return;
    }
    var grand = Math.round(total * (1 + pct / 100) * 100);   
    var shares = [];
    var i;

    if (mode.value === 'equal') {
      var base = Math.floor(grand / n), extra = grand - base * n;
      for (i = 0; i < n; i++) shares.push(base + (i < extra ? 1 : 0));
    } else {

      var items = [], sum = 0;
      people.forEach(function (p) {
        var v = Math.round((parseFloat(p.querySelector('.item').value) || 0) * 100);
        items.push(v); sum += v;
      });
      var billC = Math.round(total * 100);
      if (sum > billC) {
        out.innerHTML = '<p class="error">The items add up to more than the bill total. Check the amounts.</p>';
        return;
      }
      var shared = (billC - sum) / n, used = 0;
      for (i = 0; i < n; i++) {
        var s = Math.round((items[i] + shared) * (1 + pct / 100));
        shares.push(s); used += s;
      }
      shares[0] += grand - used;   
    }

    var list = document.createElement('ul');
    list.className = 'split-result';
    people.forEach(function (p, idx) {
      var li = document.createElement('li');
      var who = document.createElement('span');
      who.textContent = p.querySelector('.pname').value.trim() || ('Friend ' + (idx + 1));
      var amt = document.createElement('b');
      amt.textContent = (shares[idx] / 100).toFixed(2);
      li.appendChild(who); li.appendChild(amt);
      list.appendChild(li);
    });
    var head = document.createElement('p');
    head.className = 'big';
    head.textContent = 'Total to pay: ' + (grand / 100).toFixed(2);
    out.appendChild(head);
    out.appendChild(list);
  }

  count.addEventListener('input', buildRows);
  mode.addEventListener('change', buildRows);
  [bill, tip].forEach(function (el) { el.addEventListener('input', calculate); });
  rows.addEventListener('input', calculate);
  buildRows();
})();

(function () {
  var box = document.getElementById('hustleList');
  if (!box) return;
  var hoursEl = document.getElementById('hours');
  var styleEl = document.getElementById('style');

  var hustles = [
    { name: 'Tutoring', desc: 'Teach school students or juniors a subject you did well in.', hours: 2, style: 'in-person', cost: 'None', warn: 'Agree on rates and times before the first lesson.' },
    { name: 'Freelance writing or editing', desc: 'Write, proofread or edit for small businesses, blogs and other students.', hours: 3, style: 'online', cost: 'None', warn: 'Use a platform with payment protection until you trust a client.' },
    { name: 'Design or video editing', desc: 'Make posters, logos, social posts or short edited videos.', hours: 4, style: 'online', cost: 'Low (software, often free tiers)', warn: 'Agree the number of revisions in writing.' },
    { name: 'Selling things you no longer use', desc: 'List textbooks, clothes and gadgets on marketplaces or campus groups.', hours: 2, style: 'online', cost: 'None', warn: 'Meet buyers in public places and never share banking passwords or codes.' },
    { name: 'Campus part-time job', desc: 'Library, cafe, research assistant or admin roles run by the university.', hours: 6, style: 'in-person', cost: 'None', warn: 'Check your university rules on maximum working hours.' },
    { name: 'Event or brand ambassador', desc: 'Help at events or promote products on campus for a fee.', hours: 4, style: 'in-person', cost: 'None', warn: 'Confirm the pay rate and payment date in writing.' },
    { name: 'Data entry or transcription', desc: 'Type up audio or enter records for approved companies.', hours: 3, style: 'online', cost: 'None', warn: 'Many fake listings exist. A real job never asks you to pay first.' },
    { name: 'Delivery or driver gigs', desc: 'Deliver food or parcels with a bike or vehicle you already have.', hours: 8, style: 'in-person', cost: 'Low (fuel and upkeep)', warn: 'Check licence, insurance and local rules first.' }
  ];

  function render() {
    var h = parseInt(hoursEl.value, 10);
    var s = styleEl.value;
    var matches = hustles.filter(function (x) {
      return x.hours <= h && (s === 'any' || x.style === s);
    });
    box.innerHTML = '';
    if (!matches.length) {
      var p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'No match yet. Try more hours per week or switch to "Either".';
      box.appendChild(p);
      return;
    }
    matches.forEach(function (x) {
      var card = document.createElement('article');
      card.className = 'card';
      var title = document.createElement('h3'); title.textContent = x.name;
      var desc = document.createElement('p'); desc.textContent = x.desc;
      var tags = document.createElement('p');
      [x.hours + '+ hrs/week', x.style, 'Start-up: ' + x.cost].forEach(function (t) {
        var span = document.createElement('span'); span.className = 'tag'; span.textContent = t; tags.appendChild(span);
      });
      var warn = document.createElement('p'); warn.className = 'small muted';
      warn.textContent = 'Watch out: ' + x.warn;
      [title, desc, tags, warn].forEach(function (el) { card.appendChild(el); });
      box.appendChild(card);
    });
  }

  hoursEl.addEventListener('input', render);
  styleEl.addEventListener('change', render);
  render();
})();

(function () {
  var body = document.getElementById('glossBody');
  if (!body) return;
  var search = document.getElementById('search');
  var cat = document.getElementById('category');
  var count = document.getElementById('count');

  var terms = [
    ['Allowance', 'Basics', 'Money you receive regularly, for example from family, to cover your living costs.'],
    ['Budget', 'Basics', 'A plan that sets how much money you expect to receive and how much you will spend in each category.'],
    ['Income', 'Earning', 'Any money coming in, such as an allowance, wages, or payment for freelance work.'],
    ['Gross income', 'Earning', 'Your pay before tax and other deductions are taken out.'],
    ['Net income', 'Earning', 'The money you actually receive after tax and deductions.'],
    ['Fixed expense', 'Basics', 'A cost that stays about the same each period, such as rent or a subscription.'],
    ['Variable expense', 'Basics', 'A cost that changes from period to period, such as food, transport or entertainment.'],
    ['Cash flow', 'Basics', 'The movement of money in and out of your accounts over a period of time.'],
    ['Emergency fund', 'Saving', 'Money set aside only for unexpected costs, such as a medical bill or a broken laptop.'],
    ['Savings goal', 'Saving', 'A specific amount you want to save by a specific date.'],
    ['50/30/20 rule', 'Saving', 'A budgeting guideline: about 50% of income for needs, 30% for wants and 20% for saving or paying off debt. Adjust the split to fit your situation.'],
    ['Pay yourself first', 'Saving', 'Moving money into savings as soon as you receive income, before spending on anything else.'],
    ['Interest', 'Borrowing', 'The cost of borrowing money, or the reward for keeping money in a savings account.'],
    ['Compound interest', 'Saving', 'Interest calculated on both your original amount and the interest already added to it.'],
    ['Debt', 'Borrowing', 'Money you owe to another person or organisation and must repay, usually with interest.'],
    ['Overdraft', 'Borrowing', 'Spending more than your account holds. Banks usually charge fees or interest for this.'],
    ['Inflation', 'Basics', 'A general rise in prices over time, which reduces what the same amount of money can buy.'],
    ['Opportunity cost', 'Basics', 'The value of the next best option you give up when you make a choice.'],
    ['Impulse buy', 'Basics', 'An unplanned purchase made on the spot, without comparing options or checking your budget.']
  ];

  function render() {
    var q = search.value.trim().toLowerCase();
    var c = cat.value;
    body.innerHTML = '';
    var shown = 0;
    terms.forEach(function (t) {
      var matchText = !q || t[0].toLowerCase().indexOf(q) > -1 || t[2].toLowerCase().indexOf(q) > -1;
      var matchCat = c === 'all' || t[1] === c;
      if (matchText && matchCat) {
        var tr = document.createElement('tr');
        t.forEach(function (cell) {
          var td = document.createElement('td'); td.textContent = cell; tr.appendChild(td);
        });
        body.appendChild(tr);
        shown++;
      }
    });
    if (!shown) {
      var row = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 3; td.className = 'muted'; td.style.fontWeight = '400';
      td.textContent = 'No terms found. Try a shorter search or choose "All topics".';
      row.appendChild(td); body.appendChild(row);
    }
    count.textContent = shown + ' of ' + terms.length + ' terms shown';
  }

  search.addEventListener('input', render);
  cat.addEventListener('change', render);
  render();
})();

(function () {
  var box = document.getElementById('quizBox');
  if (!box) return;

  var questions = [
    { q: 'In the 50/30/20 guideline, what does the 20% usually go to?', o: ['Wants like eating out', 'Saving or paying off debt', 'Rent and bills', 'Gifts'], a: 1, e: 'The 20% is for saving and debt repayment. Needs take about 50% and wants about 30%.' },
    { q: 'What is an emergency fund for?', o: ['Sales and discounts', 'Holidays', 'Unexpected essential costs', 'Investing in a friend\'s idea'], a: 2, e: 'It is a buffer for surprises such as medical bills or urgent repairs, so you do not need to borrow.' },
    { q: 'You want a new gadget you had not planned to buy. What is a good first step?', o: ['Buy it before the price changes', 'Wait 24 hours, then decide', 'Borrow from a friend', 'Skip lunch for a week'], a: 1, e: 'A short waiting period lets the urge pass and gives you time to check your budget.' },
    { q: 'What does inflation do?', o: ['Raises what your money can buy', 'Lowers what your money can buy over time', 'Cancels interest', 'Only affects the rich'], a: 1, e: 'Inflation is a general rise in prices, so the same amount buys less than before.' },
    { q: 'Which habit protects your savings best?', o: ['Save whatever is left at the end', 'Move savings out as soon as money arrives', 'Save only in good months', 'Keep savings in your spending wallet'], a: 1, e: 'Paying yourself first makes saving automatic instead of depending on leftovers.' },
    { q: 'You have three streaming subscriptions and use one. What should you do?', o: ['Keep all three just in case', 'Cancel the ones you do not use', 'Add a fourth', 'Ignore it'], a: 1, e: 'Small recurring charges add up. Review subscriptions regularly and cancel unused ones.' },
    { q: 'What happens if you only pay the minimum on a credit card balance?', o: ['The debt disappears faster', 'Interest keeps building on what is left', 'Interest stops', 'Nothing changes'], a: 1, e: 'Unpaid balances keep charging interest, so paying only the minimum makes debt last longer and cost more.' },
    { q: 'An online job asks you to pay a "registration fee" before you start. What is the safest response?', o: ['Pay quickly to secure the spot', 'Treat it as a likely scam and walk away', 'Pay half', 'Share your bank PIN to verify'], a: 1, e: 'Genuine employers do not charge you to be hired. Upfront fees are a classic scam sign.' }
  ];

  var i = 0, score = 0;
  var bar = document.getElementById('bar');

  function showQuestion() {
    var item = questions[i];
    bar.style.width = (i / questions.length * 100) + '%';
    box.innerHTML = '';
    var count = document.createElement('p'); count.className = 'muted small';
    count.textContent = 'Question ' + (i + 1) + ' of ' + questions.length;
    var h = document.createElement('h2'); h.textContent = item.q;
    var opts = document.createElement('div'); opts.className = 'options';
    var fb = document.createElement('div'); fb.className = 'feedback'; fb.setAttribute('aria-live', 'polite');

    item.o.forEach(function (text, idx) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'option'; b.textContent = text;
      b.addEventListener('click', function () { answer(idx, opts, fb); });
      opts.appendChild(b);
    });
    [count, h, opts, fb].forEach(function (el) { box.appendChild(el); });
  }

  function answer(choice, opts, fb) {
    var item = questions[i];
    var buttons = opts.querySelectorAll('button');
    buttons.forEach(function (b, idx) {
      b.disabled = true;
      if (idx === item.a) b.classList.add('correct');
      else if (idx === choice) b.classList.add('wrong');
    });
    if (choice === item.a) score++;
    var p = document.createElement('p');
    p.textContent = (choice === item.a ? 'Correct. ' : 'Not quite. ') + item.e;
    var next = document.createElement('button');
    next.type = 'button'; next.className = 'btn btn-primary';
    next.textContent = i === questions.length - 1 ? 'See my result' : 'Next question';
    next.addEventListener('click', function () { i++; i < questions.length ? showQuestion() : showResult(); });
    fb.appendChild(p); fb.appendChild(next);
    next.focus();
  }

  function showResult() {
    bar.style.width = '100%';
    var level, state, msg;
    if (score >= 7) { level = 'Broke-proof'; state = 'safe'; msg = 'You know your money basics. Keep tracking your spending and keep saving first.'; }
    else if (score >= 4) { level = 'Getting there'; state = 'warn'; msg = 'You have a solid base. Review the questions you missed on the Stay Un-Broke and Money Jargon pages.'; }
    else { level = 'Needs work'; state = 'danger'; msg = 'Start with the Broke-O-Meter and the Money Jargon page, then try again.'; }
    box.innerHTML =
      '<span class="status ' + state + '">' + level + '</span>' +
      '<p class="big">You scored ' + score + ' out of ' + questions.length + '.</p>' +
      '<p>' + msg + '</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" id="again">Try again</button>' +
      '<a class="btn btn-secondary" href="predictor.html">Open the Broke-O-Meter</a></div>';
    document.getElementById('again').addEventListener('click', function () { i = 0; score = 0; showQuestion(); });
  }

  showQuestion();
})();

