/* Wastely homepage demo: pick an item and a city, watch it get identified,
   checked against the local rule, and logged. */
(function () {
  var itemsEl = document.getElementById('wd-items');
  if (!itemsEl) { return; }

  var placesEl = document.getElementById('wd-places');
  var stepsEl = document.getElementById('wd-steps');
  var resultEl = document.getElementById('wd-result');
  var iconEl = document.getElementById('wd-icon');
  var scanEl = document.getElementById('wd-scanline');
  var camLabelEl = document.getElementById('wd-camlabel');
  var countEl = document.getElementById('wd-count');
  var logEl = document.getElementById('wd-log');

  var places = ['Berkeley, CA', 'Chicago, IL'];

  var bins = {
    Compost: { bg: '#EAF5EC', dot: '#17834A' },
    Recycling: { bg: '#E8EEFB', dot: '#1D4ED8' },
    Landfill: { bg: '#EFEFEB', dot: '#3A3D3A' }
  };

  var SVG_OPEN = '<svg class="rise" width="170" height="136" viewBox="0 0 150 120" fill="none" aria-hidden="true">';

  var items = [
    {
      label: 'Greasy pizza box',
      material: 'Cardboard, food-soiled',
      icon: SVG_OPEN + '<path d="M20 48l55-22 55 22-55 22-55-22z" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"></path><path d="M20 48v34l55 22 55-22V48" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"></path><path d="M75 70v34" stroke="#FFFFFF" stroke-width="2.4"></path><circle cx="58" cy="46" r="5" stroke="#5BE38F" stroke-width="2"></circle><circle cx="88" cy="50" r="4" stroke="#5BE38F" stroke-width="2"></circle></svg>',
      out: [
        { bin: 'Compost', rule: 'Food-soiled paper is accepted in the green compost bin.' },
        { bin: 'Landfill', rule: 'Greasy cardboard stays out of the Blue Cart and goes in the trash.' }
      ]
    },
    {
      label: 'Lined paper cup',
      material: 'Paper with a plastic lining',
      icon: SVG_OPEN + '<path d="M50 34h50l-6 70H56l-6-70z" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"></path><path d="M45 34h60" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"></path><path d="M51 34l3-12h42l3 12" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"></path><path d="M53 58h44M55 80h40" stroke="#5BE38F" stroke-width="2"></path></svg>',
      out: [
        { bin: 'Landfill', rule: 'Lined paper cups are not accepted in compost or recycling.' },
        { bin: 'Recycling', rule: 'Empty, dry paper cups are accepted in the Blue Cart.' }
      ]
    },
    {
      label: 'Aluminum can',
      material: 'Aluminum, empty',
      icon: SVG_OPEN + '<ellipse cx="75" cy="26" rx="24" ry="8" stroke="#FFFFFF" stroke-width="2.4"></ellipse><path d="M51 26v66c0 4.4 10.7 8 24 8s24-3.6 24-8V26" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"></path><path d="M69 25h12" stroke="#5BE38F" stroke-width="2.4" stroke-linecap="round"></path><path d="M51 44c0 4.4 10.7 8 24 8s24-3.6 24-8" stroke="#5BE38F" stroke-width="2"></path></svg>',
      out: [
        { bin: 'Recycling', rule: 'Empty cans go in container recycling.' },
        { bin: 'Recycling', rule: 'Aluminum cans are accepted in the Blue Cart.' }
      ]
    },
    {
      label: 'Plastic bag',
      material: 'Plastic film',
      icon: SVG_OPEN + '<path d="M44 46h62l-7 58H51l-7-58z" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"></path><path d="M60 46c0-14 6-24 15-24s15 10 15 24" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"></path><path d="M58 66c6 5 28 5 34 0" stroke="#5BE38F" stroke-width="2" stroke-linecap="round"></path></svg>',
      out: [
        { bin: 'Landfill', rule: 'Plastic bags and film are not accepted in recycling.' },
        { bin: 'Landfill', rule: 'Plastic bags must stay out of the Blue Cart.' }
      ]
    }
  ];

  function clock() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) { h = 12; }
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ap;
  }

  function esc(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var state = {
    item: 0,
    place: 0,
    phase: 3,
    count: 1,
    log: [{ item: 0, place: 0, time: clock() }]
  };
  var timer1 = null;
  var timer2 = null;
  var shownItem = -1;
  var shownResult = '';

  function chipStyle(on) {
    return 'min-height: 44px; padding: 0 16px; border-radius: 999px; cursor: pointer; font-size: 15px; font-weight: 500; ' +
      'background: ' + (on ? '#0A0A0B' : '#FFFFFF') + '; ' +
      'color: ' + (on ? '#FFFFFF' : '#0A0A0B') + '; ' +
      'border: 1px solid ' + (on ? '#0A0A0B' : '#C9CCC6');
  }

  function buildChips(container, labels, onPick) {
    labels.forEach(function (label, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', function () { onPick(index); });
      container.appendChild(button);
    });
  }

  function paintChips(container, active) {
    Array.prototype.forEach.call(container.children, function (button, index) {
      var on = index === active;
      button.setAttribute('style', chipStyle(on));
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderSteps() {
    var labels = ['1. Identify', '2. Check local law', '3. Log the proof'];
    stepsEl.innerHTML = labels.map(function (label, index) {
      var on = state.phase >= index + 1;
      return '<span style="display: inline-flex; align-items: center; min-height: 32px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500; ' +
        'background: ' + (on ? '#0A0A0B' : '#EFEFEB') + '; color: ' + (on ? '#FFFFFF' : '#5F635F') + '">' + label + '</span>';
    }).join('');
  }

  function renderResult() {
    var item = items[state.item];
    var place = places[state.place];
    if (state.phase < 3) {
      var status = state.phase === 1 ? 'Identifying the item' : 'Checking ' + place + ' rules';
      var existing = document.getElementById('wd-status');
      if (existing) {
        existing.textContent = status;
      } else {
        resultEl.innerHTML =
          '<div class="rise" style="display: flex; flex-direction: column; justify-content: center; gap: 16px; min-height: 250px">' +
          '<span id="wd-status" style="font-size: 26px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; color: #0A0A0B">' + esc(status) + '</span>' +
          '<div aria-hidden="true" class="pulse" style="height: 14px; width: 82%; border-radius: 999px; background: #EFEFEB"></div>' +
          '<div aria-hidden="true" class="pulse" style="height: 14px; width: 64%; border-radius: 999px; background: #EFEFEB"></div>' +
          '<div aria-hidden="true" class="pulse" style="height: 14px; width: 46%; border-radius: 999px; background: #EFEFEB"></div>' +
          '</div>';
      }
      shownResult = '';
      return;
    }
    var key = state.item + ':' + state.place;
    if (shownResult === key) { return; }
    shownResult = key;
    var result = item.out[state.place];
    var bin = bins[result.bin];
    var row = function (label, value, last) {
      return '<div style="display: flex; justify-content: space-between; gap: 16px; padding: 10px 0;' + (last ? '' : ' border-bottom: 1px solid #EDEDE8') + '">' +
        '<span style="flex: none; font-size: 15px; color: #5F635F">' + label + '</span>' +
        '<span style="font-size: 15px; font-weight: 500; color: #0A0A0B; text-align: right; max-width: 260px">' + esc(value) + '</span></div>';
    };
    resultEl.innerHTML =
      '<div class="rise" style="display: flex; flex-direction: column; gap: 16px; min-height: 250px">' +
      '<div style="display: flex; flex-direction: column">' +
      row('Item', item.label, false) + row('Location', place, false) + row('Local rule', result.rule, true) +
      '</div>' +
      '<div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 20px; border-radius: 18px; background: ' + bin.bg + '">' +
      '<div style="display: flex; flex-direction: column; gap: 2px">' +
      '<span style="font-size: 13px; font-weight: 500; color: #3A403B">Goes in</span>' +
      '<span style="font-size: 32px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; color: #0A0A0B">' + esc(result.bin) + '</span>' +
      '</div>' +
      '<div aria-hidden="true" style="flex: none; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 999px; background: ' + bin.dot + '">' +
      '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11.5l4 4 8-9" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>' +
      '</div></div></div>';
  }

  function renderLog() {
    countEl.textContent = state.count === 1 ? '1 sort logged' : state.count + ' sorts logged';
    logEl.innerHTML = state.log.map(function (entry, index) {
      var result = items[entry.item].out[entry.place];
      return '<div' + (index === 0 ? ' class="rise"' : '') + ' style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 18px; padding: 10px 14px; border-radius: 12px; background: #FFFFFF; border: 1px solid #EDEDE8; font-size: 14px">' +
        '<span style="min-width: 70px; color: #5F635F">' + esc(entry.time) + '</span>' +
        '<span style="flex: 1 1 150px; font-weight: 500; color: #0A0A0B">' + esc(items[entry.item].label) + '</span>' +
        '<span style="color: #4A4D4A">' + esc(places[entry.place]) + '</span>' +
        '<span style="display: inline-flex; align-items: center; gap: 7px; min-width: 96px; font-weight: 500; color: #0A0A0B">' +
        '<span aria-hidden="true" style="width: 9px; height: 9px; border-radius: 999px; background: ' + bins[result.bin].dot + '"></span>' + esc(result.bin) + '</span>' +
        '</div>';
    }).join('');
  }

  function render(logChanged) {
    paintChips(itemsEl, state.item);
    paintChips(placesEl, state.place);
    renderSteps();
    scanEl.hidden = state.phase >= 3;
    if (shownItem !== state.item) {
      shownItem = state.item;
      iconEl.innerHTML = items[state.item].icon;
    }
    camLabelEl.textContent = state.phase < 3 ? 'Scanning' : items[state.item].material;
    renderResult();
    if (logChanged) { renderLog(); }
  }

  function run(item, place, record) {
    clearTimeout(timer1);
    clearTimeout(timer2);
    state.item = item;
    state.place = place;
    state.phase = 1;
    render(false);
    timer1 = setTimeout(function () {
      state.phase = 2;
      render(false);
    }, 650);
    timer2 = setTimeout(function () {
      state.phase = 3;
      if (record) {
        state.log = [{ item: item, place: place, time: clock() }].concat(state.log).slice(0, 3);
        state.count += 1;
      }
      render(record);
    }, 1350);
  }

  buildChips(itemsEl, items.map(function (item) { return item.label; }), function (index) {
    run(index, state.place, true);
  });
  buildChips(placesEl, places, function (index) {
    run(state.item, index, true);
  });
  render(true);

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (err) {
    reduceMotion = false;
  }
  if (!reduceMotion) {
    setTimeout(function () { run(0, 0, false); }, 900);
  }
})();
