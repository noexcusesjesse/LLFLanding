// Contact form: posts JSON to the production lead endpoint (POST /api/leads).
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('c-status');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      var bad = form.querySelector(':invalid');
      status.textContent = 'Please fill in the required fields and check both boxes.';
      if (bad) bad.focus();
      return;
    }
    var data = {
      type: 'contact',
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim(),
      age18: form.age18.checked,
      consent: form.consent.checked,
    };
    status.textContent = 'Sending...';
    fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok) { status.textContent = '✓ Thank you! We will be in touch within 24 hours.'; form.reset(); }
        else status.textContent = res.j.error || 'Something went wrong. Please call or text (866) 830-9123.';
      })
      .catch(function () { status.textContent = 'Something went wrong. Please call or text (866) 830-9123.'; });
  });
})();
