function showError(form, message) {
  const error = form.querySelector('.form-error');
  error.textContent = message;
  error.focus();
}

function bind(form, url, successText) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    const data = new FormData(form);
    const payload = form.dataset.ruck === 'deletion-request'
      ? { name: data.get('name'), email: data.get('email') }
      : {
          name: data.get('name'),
          email: data.get('email'),
          zip: data.get('zip'),
          interests: data.getAll('interests'),
        };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        showError(form, body.error || 'The form could not be saved. Try again later.');
        return;
      }
      form.hidden = true;
      const thanks = form.parentElement.querySelector('.thanks');
      thanks.hidden = false;
      thanks.textContent = successText;
      thanks.focus();
    } catch {
      showError(form, 'The form could not be saved. Try again later.');
    }
  });
}

const interest = document.getElementById('interest-form');
if (interest) {
  bind(interest, '/api/ruck/interest', "You're on the list. We'll be in touch when a program launches.");
}

const deletion = document.getElementById('delete-form');
if (deletion) {
  bind(deletion, '/api/ruck/deletion-request', "We received your request. Jesse will confirm it's you and delete your information within 30 days.");
}
