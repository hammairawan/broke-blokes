function toggleMenu() {
    let menu = document.getElementById('menu');
    let open = menu.classList.toggle('open');
    document.querySelector('.menu-btn').setAttribute('aria-expanded', String(open));
}


// 2. Broke-O-Meter: income minus expenses.
function calculateMoney() {
    let money = parseFloat(document.getElementById('money').value);
    let days = parseFloat(document.getElementById('days').value);
    let daily = parseFloat(document.getElementById('daily').value);
    let currency = document.getElementById('currency').value;
    let result = document.getElementById('result');
    let meter = document.getElementById('meterFill');
    document.getElementById('dailyOut').textContent = currency + ' ' + daily;
    if (!Number.isFinite(money) || money < 0 || !Number.isInteger(days) || days < 1 || days > 365) {
        result.textContent = 'Enter valid money and days.';
        meter.style.width = '0%';
        return;
    }
    let cost = days * daily;
    let remaining = money - cost;
    let safeDaily = money / days;
    let percent = 100;
    if (cost > 0) percent = Math.min(100, money / cost * 100);
    meter.style.width = percent + '%';
    let state = 'safe';
    let label = 'Budget on track';
    let message = 'Money left after expenses';
    let detail = 'You can reach your next allowance.';
    if (remaining < 0) {
        state = 'danger';
        if (percent >= 75) state = 'warn';
        label = 'Budget shortfall';
        message = 'Money you are short';
        let lasts = Math.floor(money / daily);
        let date = new Date();
        date.setDate(date.getDate() + lasts);
        detail = 'Money lasts ' + lasts + ' full days. First uncovered day: ' + date.toLocaleDateString();
    }
    meter.className = 'meter-fill ' + state;
    result.innerHTML = '<div class="result-hero ' + state + '"><span class="result-label">' + label + '</span><p>' + message + '</p><strong>' + currency + ' ' + Math.abs(remaining).toFixed(2) + '</strong><p>' + detail + '</p></div>';
    result.innerHTML += '<div class="coverage-label">Budget coverage <b>' + percent.toFixed(0) + '%</b></div>';
    result.innerHTML += '<div class="result-grid">' + resultStat('Total expenses', currency + ' ' + cost.toFixed(2)) + resultStat('Safe daily budget', currency + ' ' + safeDaily.toFixed(2)) + resultStat('Daily spending cut', currency + ' ' + Math.max(0, daily-safeDaily).toFixed(2)) + resultStat('Extra income / week', currency + ' ' + Math.max(0, -remaining*7/days).toFixed(2)) + '</div>';
    if (remaining < 0) result.innerHTML += '<div class="result-actions"><a class="btn btn-primary" href="explore.html">Saving tips</a><a class="btn btn-secondary" href="details.html">Get Paid</a></div>';

}

// A reusable small statistic card.
function resultStat(label, value) {
    return '<div class="result-stat"><span>' + label + '</span><b>' + value + '</b></div>';
}

// 3. Filter saving tips.
function filterTips(button) {
    let tips = document.querySelectorAll('.tip');
    let buttons = document.querySelectorAll('.chip');
    let category = button.getAttribute('data-filter');
    for (let i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    for (let i = 0; i < tips.length; i++) {
        tips[i].style.display = 'none';
        if (category === 'all' || tips[i].getAttribute('data-cat') === category) tips[i].style.display = 'block';
    }
}

// 4. Bill splitter: create inputs, then calculate each share.
let savedPeople = [];
function buildPeople() {
    let oldRows = document.querySelectorAll("#rows .person");
    for (let i = 0; i < oldRows.length; i++) {
        savedPeople[i] = [oldRows[i].querySelector(".pname").value, oldRows[i].querySelector(".item").value];
    }
    let n = Number(document.getElementById('people').value);
    let mode = document.getElementById('mode').value;
    let rows = document.getElementById('rows');
    if (!Number.isInteger(n) || n < 2 || n > 12) { rows.innerHTML = ''; document.getElementById('splitOut').textContent = 'Enter 2 to 12 people.'; return; }
    rows.innerHTML = '';
    rows.setAttribute('data-mode', mode);
    for (let i = 0; i < n; i++) {
        let row = document.createElement('div');
        row.className = 'person';
        row.innerHTML = '<div><label for="personName' + i + '">Friend ' + (i+1) + ' name</label><input id="personName' + i + '" class="pname" placeholder="Optional"></div><div class="item-field"><label for="personCost' + i + '">Items cost</label><input id="personCost' + i + '" class="item" type="number" min="0" step="0.01"></div>';
        if (savedPeople[i]) {
            row.querySelector('.pname').value = savedPeople[i][0];
            row.querySelector('.item').value = savedPeople[i][1];
        }
        rows.appendChild(row);
    }
    splitBill();
}
function splitBill() {
    let bill = parseFloat(document.getElementById('bill').value);
    let tip = Number(document.getElementById('tip').value);
    let names = document.querySelectorAll('.pname');
    let items = document.querySelectorAll('.item');
    let n = names.length;
    let out = document.getElementById('splitOut');
    let mode = document.getElementById('mode').value;
    if (!Number.isFinite(bill) || bill <= 0 || !Number.isFinite(tip) || tip < 0 || tip > 100 || n < 2) { out.textContent = 'Enter valid bill details.'; return; }
    let sum = 0;
    if (mode === 'items') {
        for (let i = 0; i < n; i++) {
            let item = Number(items[i].value);
            if (item < 0) { out.textContent = 'Item costs cannot be negative.'; return; }
            sum += item;
        }
    }
    if (sum > bill) { out.textContent = 'Items exceed the bill.'; return; }
    let total = Math.round(bill * (1 + tip/100) * 100);
    out.innerHTML = '<div class="result-hero bill-hero"><span class="result-label">Total to pay</span><strong>' + (total/100).toFixed(2) + '</strong><p>Split between ' + n + ' people</p></div>';
    out.innerHTML += '<div class="result-grid">' + resultStat('Original bill', bill.toFixed(2)) + resultStat('Tip / service', (total/100-bill).toFixed(2)) + '</div><h4 class="payment-heading">Individual payments</h4>';
    let used = 0;
    for (let i = 0; i < n; i++) {
        let share = (bill - sum) / n;
        if (mode === 'items') share += Number(items[i].value);
        let cents = Math.round(share * (1 + tip/100) * 100);
        if (i === n-1) cents = total - used;
        used += cents;
        let name = names[i].value.trim();
        if (name === '') name = 'Friend ' + (i+1);
        let line = document.createElement('p');
        line.className = 'payment-row';
        let person = document.createElement('span');
        person.textContent = name;
        let amount = document.createElement('b');
        amount.textContent = (cents/100).toFixed(2);
        line.appendChild(person);
        line.appendChild(amount);
        out.appendChild(line);
    }
}

// 5. Get Paid: match available hours and work style.
let hustles = [
    { name: 'Tutoring', desc: 'Teach school students or juniors a subject you did well in.', hours: 2, style: 'in-person', cost: 'None', warn: 'Agree on rates and times before the first lesson.' },
    { name: 'Freelance writing or editing', desc: 'Write, proofread or edit for small businesses, blogs and other students.', hours: 3, style: 'online', cost: 'None', warn: 'Use a platform with payment protection until you trust a client.' },
    { name: 'Design or video editing', desc: 'Make posters, logos, social posts or short edited videos.', hours: 4, style: 'online', cost: 'Low (software, often free tiers)', warn: 'Agree the number of revisions in writing.' },
    { name: 'Selling things you no longer use', desc: 'List textbooks, clothes and gadgets on marketplaces or campus groups.', hours: 2, style: 'online', cost: 'None', warn: 'Meet buyers in public places and never share banking passwords or codes.' },
    { name: 'Campus part-time job', desc: 'Library, cafe, research assistant or admin roles run by the university.', hours: 6, style: 'in-person', cost: 'None', warn: 'Check your university rules on maximum working hours.' },
    { name: 'Event or brand ambassador', desc: 'Help at events or promote products on campus for a fee.', hours: 4, style: 'in-person', cost: 'None', warn: 'Confirm the pay rate and payment date in writing.' },
    { name: 'Data entry or transcription', desc: 'Type up audio or enter records for approved companies.', hours: 3, style: 'online', cost: 'None', warn: 'Many fake listings exist. A real job never asks you to pay first.' },
    { name: 'Delivery or driver gigs', desc: 'Deliver food or parcels with a bike or vehicle you already have.', hours: 8, style: 'in-person', cost: 'Low (fuel and upkeep)', warn: 'Check licence, insurance and local rules first.' }
  ];
let startSteps = ['Choose one subject, prepare a sample lesson and ask classmates or local families for referrals.', 'Create two writing samples and apply to small editing jobs with clear deadlines.', 'Build three sample designs or edits and share a portfolio with potential clients.', 'Photograph unused items, compare prices and arrange a safe handover.', 'Ask the campus office about vacancies and check shifts against your timetable.', 'Contact campus societies or event organisers and confirm duties before accepting.', 'Practise typing and spreadsheets, then apply to verified employers.', 'Check local eligibility, calculate fuel costs and choose safe shifts.'];
function showHustles() {
    let hours = Number(document.getElementById('hours').value);
    let style = document.getElementById('style').value;
    let box = document.getElementById('hustleList');
    box.innerHTML = '';
    for (let i = 0; i < hustles.length; i++) {
        let h = hustles[i];
        if (h.hours <= hours && (style === 'any' || style === h.style)) {
            box.innerHTML += '<article class="card"><h3>' + h.name + '</h3><p>' + h.desc + '</p><p>' + h.hours + '+ hours/week | ' + h.style + '</p><p>Cost: ' + h.cost + '</p><p><strong>How to start:</strong> ' + startSteps[i] + '</p><p><strong>Watch out:</strong> ' + h.warn + '</p></article>';
        }
    }
    if (box.innerHTML === '') box.textContent = 'No matching jobs.';
}

// 6. Money Jargon: search an array of terms.
let terms = [
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
function showTerms() {
    let search = document.getElementById('search').value.toLowerCase().trim();
    let category = document.getElementById('category').value;
    let body = document.getElementById('glossBody');
    let count = 0;
    body.innerHTML = '';
    for (let i = 0; i < terms.length; i++) {
        let t = terms[i];
        if ((t[0].toLowerCase().includes(search) || t[2].toLowerCase().includes(search)) && (category === 'all' || category === t[1])) {
            body.innerHTML += '<tr><td>' + t[0] + '</td><td>' + t[1] + '</td><td>' + t[2] + '</td></tr>';
            count++;
        }
    }
    document.getElementById('count').textContent = count + ' of ' + terms.length + ' terms shown';
}

// 7. Quiz: compare selected answer with correct answer.
let questions = [
    { q: 'In the 50/30/20 guideline, what does the 20% usually go to?', o: ['Wants like eating out', 'Saving or paying off debt', 'Rent and bills', 'Gifts'], a: 1, e: 'The 20% is for saving and debt repayment. Needs take about 50% and wants about 30%.' },
    { q: 'What is an emergency fund for?', o: ['Sales and discounts', 'Holidays', 'Unexpected essential costs', 'Investing in a friend\'s idea'], a: 2, e: 'It is a buffer for surprises such as medical bills or urgent repairs, so you do not need to borrow.' },
    { q: 'You want a new gadget you had not planned to buy. What is a good first step?', o: ['Buy it before the price changes', 'Wait 24 hours, then decide', 'Borrow from a friend', 'Skip lunch for a week'], a: 1, e: 'A short waiting period lets the urge pass and gives you time to check your budget.' },
    { q: 'What does inflation do?', o: ['Raises what your money can buy', 'Lowers what your money can buy over time', 'Cancels interest', 'Only affects the rich'], a: 1, e: 'Inflation is a general rise in prices, so the same amount buys less than before.' },
    { q: 'Which habit protects your savings best?', o: ['Save whatever is left at the end', 'Move savings out as soon as money arrives', 'Save only in good months', 'Keep savings in your spending wallet'], a: 1, e: 'Paying yourself first makes saving automatic instead of depending on leftovers.' },
    { q: 'You have three streaming subscriptions and use one. What should you do?', o: ['Keep all three just in case', 'Cancel the ones you do not use', 'Add a fourth', 'Ignore it'], a: 1, e: 'Small recurring charges add up. Review subscriptions regularly and cancel unused ones.' },
    { q: 'What happens if you only pay the minimum on a credit card balance?', o: ['The debt disappears faster', 'Interest keeps building on what is left', 'Interest stops', 'Nothing changes'], a: 1, e: 'Unpaid balances keep charging interest, so paying only the minimum makes debt last longer and cost more.' },
    { q: 'An online job asks you to pay a "registration fee" before you start. What is the safest response?', o: ['Pay quickly to secure the spot', 'Treat it as a likely scam and walk away', 'Pay half', 'Share your bank PIN to verify'], a: 1, e: 'Genuine employers do not charge you to be hired. Upfront fees are a classic scam sign.' }
  ];
let questionIndex = 0;
let score = 0;
function showQuestion() {
    let box = document.getElementById('quizBox');
    document.getElementById('bar').style.width = (questionIndex / questions.length * 100) + '%';
    if (questionIndex === questions.length) {
        box.innerHTML = '<h2>Your score: ' + score + '/' + questions.length + '</h2><button class="btn" data-action="restart">Try again</button>';
        return;
    }
    let q = questions[questionIndex];
    box.innerHTML = '<p>Question ' + (questionIndex+1) + ' of ' + questions.length + '</p><h2>' + q.q + '</h2><div class="options" id="answers"></div><div id="feedback"></div>';
    for (let i = 0; i < q.o.length; i++) {
        document.getElementById('answers').innerHTML += '<button class="option" data-answer="' + i + '">' + q.o[i] + '</button>';
    }
}
function checkAnswer(choice) {
    let q = questions[questionIndex];
    let buttons = document.querySelectorAll('#answers button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
        if (i === q.a) buttons[i].classList.add('correct');
        else if (i === choice) buttons[i].classList.add('wrong');
    }
    let message = 'Not quite. ';
    if (choice === q.a) { score++; message = 'Correct! '; }
    document.getElementById('feedback').innerHTML = '<p>' + message + q.e + '</p><button class="btn" data-action="next">Next</button>';
}
function nextQuestion() { questionIndex++; showQuestion(); }
function restartQuiz() { questionIndex = 0; score = 0; showQuestion(); }

// Contact form: validate locally, without sending data.
function validateContact(event) {
    event.preventDefault();
    let fields = ['name', 'email', 'topic', 'message'];
    let valid = true;
    let success = document.getElementById('contactSuccess');
    success.hidden = true;
    for (let i = 0; i < fields.length; i++) {
        document.getElementById(fields[i] + 'Error').textContent = '';
        document.getElementById(fields[i]).removeAttribute('aria-invalid');
    }
    let name = document.getElementById('name').value.trim();
    let email = document.getElementById('email').value.trim();
    let topic = document.getElementById('topic').value.trim();
    let message = document.getElementById('message').value.trim();
    let at = email.indexOf('@');
    let dot = email.indexOf('.', at + 1);
    function error(field, text) {
        document.getElementById(field + 'Error').textContent = text;
        document.getElementById(field).setAttribute('aria-invalid', 'true');
        valid = false;
    }
    if (name === '') error('name', 'Enter your name.');
    if (at < 1 || dot <= at + 1 || dot === email.length - 1 || email.includes(' ') || email.indexOf('@', at + 1) !== -1) error('email', 'Enter a valid email address.');
    if (topic === '') error('topic', 'Choose a topic.');
    if (message.length < 10) error('message', 'Enter at least 10 characters.');
    if (valid) {
        success.textContent = 'Thanks, your form passed our checks. This demo does not send or store messages.';
        success.hidden = false;
        event.target.reset();
    }
}

// Only initialize features that exist on the current page.
if (document.getElementById('money')) calculateMoney();
if (document.getElementById('bill')) buildPeople();
if (document.getElementById('hustleList')) showHustles();
if (document.getElementById('glossBody')) showTerms();
if (document.getElementById('quizBox')) showQuestion();
let contactForm = document.getElementById('contactForm');
if (contactForm) contactForm.addEventListener('submit', validateContact);

// Connect controls only when they exist on this page.
function listen(id, event, handler) {
    let element = document.getElementById(id);
    if (element) element.addEventListener(event, handler);
}
document.querySelector('.menu-btn').addEventListener('click', toggleMenu);
document.querySelectorAll('.chip').forEach(function(button) {
    button.addEventListener('click', function() { filterTips(button); });
});
['money', 'days', 'daily'].forEach(function(id) { listen(id, 'input', calculateMoney); });
listen('currency', 'change', calculateMoney);
listen('bill', 'input', splitBill);
listen('tip', 'input', splitBill);
listen('people', 'input', buildPeople);
listen('mode', 'change', buildPeople);
listen('rows', 'input', splitBill);
listen('hours', 'change', showHustles);
listen('style', 'change', showHustles);
listen('search', 'input', showTerms);
listen('category', 'change', showTerms);
listen('quizBox', 'click', function(event) {
    let button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-answer')) checkAnswer(Number(button.dataset.answer));
    if (button.dataset.action === 'next') nextQuestion();
    if (button.dataset.action === 'restart') restartQuiz();
});
