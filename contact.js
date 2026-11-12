/* Wastely contact form: sends questions through Web3Forms.
   Until an access key is set, it falls back to opening an email draft. */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) { return; }

  var CONTACT_EMAIL = 'yugmehta141@gmail.com';
  var wrap = document.getElementById('contact-form-wrap');
  var success = document.getElementById('contact-success');
  var errorEl = document.getElementById('contact-error');
  var resetButton = document.getElementById('contact-reset');
  var submitButton = form.querySelector('button[type="submit"]');
  var submitLabel = submitButton ? submitButton.textContent : 'Send question';

  function showSuccess() {
    wrap.hidden = true;
    success.hidden = false;
    form.reset();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorEl.hidden = true;

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    if (data.botcheck) { return; }

    var key = (data.access_key || '').trim();
    if (!key || key.indexOf('YOUR_') === 0) {
      var topic = form.querySelector('#q-topic');
      var topicText = topic ? topic.options[topic.selectedIndex].text : 'General';
      var subject = 'Question about Wastely: ' + topicText;
      var body = (data.message || '') + '\n\n' + (data.name || '') + '\n' + (data.email || '');
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        return response.json().then(function (json) {
          if (response.status === 200 && json.success !== false) { return json; }
          throw new Error(json.message || 'Submission failed');
        });
      })
      .then(showSuccess)
      .catch(function () { errorEl.hidden = false; })
      .then(function () {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      });
  });

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      success.hidden = true;
      wrap.hidden = false;
    });
  }
})();
